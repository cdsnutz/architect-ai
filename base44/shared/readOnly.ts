// Strictly read-only observation for the challenge lab.
// Every routine here issues anonymous GET requests only: no cookies, no credentials,
// no request bodies, no state-changing verbs, and no target that is private, internal
// or outside the hosts the operator explicitly authorized.

const UA = 'Mozilla/5.0 (compatible; RevEngineLab/1.0)';
const TIMEOUT_MS = 5000;
const BODY_CAP = 120000;

const PRIVATE_HOST =
  /^(localhost|127\.|0\.0\.0\.0|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|\[?::1\]?$|\[?fd[0-9a-f]{2}:)/i;
const INTERNAL_SUFFIX = /(\.internal|\.local|\.localhost|\.home\.arpa)$/i;

export function assertPublicUrl(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('A target URL is required.');
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new Error('Not a valid URL: ' + raw);
  }
  if (!/^https?:$/.test(parsed.protocol)) throw new Error('Only http and https targets can be probed.');
  if (parsed.username || parsed.password) throw new Error('Credentialed URLs are not allowed.');
  const host = parsed.hostname.toLowerCase();
  if (!host.includes('.') || PRIVATE_HOST.test(host) || INTERNAL_SUFFIX.test(host)) {
    throw new Error('Private or internal hosts cannot be probed: ' + host);
  }
  if (host === 'base44.com' || host.endsWith('.base44.com')) {
    throw new Error('The Base44 platform itself is out of scope.');
  }
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    throw new Error('Only standard web ports can be probed.');
  }
  if (parsed.pathname.length > 300) throw new Error('That path is too long to probe.');
  return parsed.origin + parsed.pathname + parsed.search;
}

export type Hit = {
  url: string;
  status: number;
  content_type: string;
  bytes: number;
  latency_ms: number;
  shape: string;
  headers: Record<string, string>;
  body: string;
};

function shapeOf(text: string, contentType: string): string {
  if (/json/i.test(contentType)) {
    try {
      const parsed = JSON.parse(text);
      const keys = Array.isArray(parsed) ? ['[array]'] : Object.keys(parsed || {}).slice(0, 12);
      return 'json:keys=' + keys.join(',');
    } catch {
      return 'json:unparsed';
    }
  }
  const tags = (text.match(/<([a-z][a-z0-9-]*)/gi) || []).length;
  const forms = (text.match(/<form/gi) || []).length;
  const scripts = (text.match(/<script/gi) || []).length;
  const shell = /__NEXT_DATA__|__NUXT__|data-reactroot|id="__next"|id="root"/i.test(text) ? 'spa' : 'static';
  return 'html:' + shell + ':tags=' + Math.round(tags / 10) + ':forms=' + forms + ':scripts=' + scripts;
}

async function readOnce(url: string, accept: string, extra: Record<string, string> = {}): Promise<Hit> {
  const started = Date.now();
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': UA, Accept: accept, 'Cache-Control': 'no-cache', ...extra },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  // A redirect can leave the public surface; refuse to read whatever it landed on.
  try {
    assertPublicUrl(res.url);
  } catch {
    throw new Error('The target redirected off the authorized public surface.');
  }
  const body = (await res.text()).slice(0, BODY_CAP);
  const contentType = (res.headers.get('content-type') || '').split(';')[0];
  return {
    url,
    status: res.status,
    content_type: contentType,
    bytes: body.length,
    latency_ms: Date.now() - started,
    shape: shapeOf(body, contentType),
    headers: {
      cache_control: res.headers.get('cache-control') || 'none',
      age: res.headers.get('age') || 'none',
      etag: res.headers.get('etag') ? 'present' : 'none',
      date: res.headers.get('date') || 'none',
      x_cache: res.headers.get('x-cache') || res.headers.get('cf-cache-status') || 'none',
      server: res.headers.get('server') || 'none',
      vary: res.headers.get('vary') || 'none',
      last_modified: res.headers.get('last-modified') || 'none',
      content_range: res.headers.get('content-range') || 'none',
      csp: res.headers.get('content-security-policy') || 'none',
      hsts: res.headers.get('strict-transport-security') || 'none',
      x_frame: res.headers.get('x-frame-options') || 'none',
      x_content_type: res.headers.get('x-content-type-options') || 'none',
      referrer: res.headers.get('referrer-policy') || 'none',
      etag_raw: res.headers.get('etag') || ''
    },
    body
  };
}

export type ProbeResult = {
  skill: string;
  probe: string;
  target: string;
  reproduced: boolean;
  observations: string[];
  signal: string;
};

function describe(hit: Hit): string {
  return (
    'HTTP ' + hit.status + ' · ' + (hit.content_type || 'unknown type') + ' · ' + hit.bytes + 'b · ' +
    hit.latency_ms + 'ms · cache-control=' + hit.headers.cache_control + ' · age=' + hit.headers.age
  );
}

async function probeNegotiate(skill: string, target: string): Promise<ProbeResult> {
  const [html, xhr] = await Promise.all([
    readOnce(target, 'text/html,application/xhtml+xml'),
    readOnce(target, 'application/json, text/plain, */*', { 'X-Requested-With': 'XMLHttpRequest' })
  ]);
  const reproduced = html.status !== xhr.status || html.content_type !== xhr.content_type || html.shape !== xhr.shape;
  return {
    skill,
    probe: 'negotiate',
    target,
    reproduced,
    observations: ['HTML request: ' + describe(html), 'XHR request: ' + describe(xhr), 'Shapes: ' + html.shape + ' vs ' + xhr.shape],
    signal: reproduced
      ? 'The route serves a different representation to XHR clients, so a machine-readable contract exists behind the page.'
      : 'The same representation is served whatever content type is asked for; no separate machine-readable contract is exposed.'
  };
}

async function probeEntropy(skill: string, target: string): Promise<ProbeResult> {
  const [first, second] = await Promise.all([
    readOnce(target, 'text/html,application/json,*/*'),
    readOnce(target, 'text/html,application/json,*/*')
  ]);
  const identical = first.bytes === second.bytes && first.shape === second.shape && first.body === second.body;
  return {
    skill,
    probe: 'entropy',
    target,
    reproduced: identical,
    observations: ['Read one: ' + describe(first), 'Read two: ' + describe(second), 'Bodies identical: ' + (identical ? 'yes' : 'no')],
    signal: identical
      ? 'Two reads are byte-identical, so the response is stable or cached and a repeated write would not show here.'
      : 'The payload changes between reads, so the route is live and a repeat write could surface as a payload change.'
  };
}

async function probeSilence(skill: string, target: string): Promise<ProbeResult> {
  const hit = await readOnce(target, 'application/json, text/html, */*');
  const hollow = hit.status === 200 && (hit.bytes < 300 || /json:keys=\s*$/i.test(hit.shape));
  return {
    skill,
    probe: 'silence',
    target,
    reproduced: hollow,
    observations: [describe(hit), 'Shape: ' + hit.shape],
    signal: hollow
      ? 'The route answers 200 with a payload too small to carry data, the shape an integration stores as valid and empty.'
      : 'The route answers with a populated payload, so it is not silently empty in this window.'
  };
}

async function probeClock(skill: string, target: string): Promise<ProbeResult> {
  const hit = await readOnce(target, 'text/html,application/json,*/*');
  const origin = Date.parse(hit.headers.date);
  const local = Date.now();
  const skew = Number.isNaN(origin) ? null : Math.round((origin - local) / 1000);
  return {
    skill,
    probe: 'clock',
    target,
    reproduced: skew !== null && Math.abs(skew) > 60,
    observations: [
      describe(hit),
      'Origin Date: ' + hit.headers.date,
      'Skew vs local: ' + (skew === null ? 'no Date header' : skew + 's'),
      'Age: ' + hit.headers.age + ' · server: ' + hit.headers.server
    ],
    signal:
      skew === null
        ? 'No Date header was returned, so origin clock offset is not observable from this response.'
        : Math.abs(skew) > 60
          ? 'The origin clock is offset by ' + skew + 's, enough to reorder events or expire a token early.'
          : 'The origin clock is within a minute of local time, so skew is not a cause here.'
  };
}

async function probeSurface(skill: string, target: string): Promise<ProbeResult> {
  const hit = await readOnce(target, 'text/html,*/*');
  const forms = (hit.body.match(/<form/gi) || []).length;
  const actions = [...hit.body.matchAll(/<form[^>]+action=["']([^"']+)["']/gi)].map((match) => match[1]).slice(0, 6);
  const verbs = (hit.body.match(/\b(POST|PUT|PATCH|DELETE)\b/g) || []).length;
  const reproduced = forms > 0 || verbs > 0;
  return {
    skill,
    probe: 'surface',
    target,
    reproduced,
    observations: [
      describe(hit),
      'Forms: ' + forms + ' · write verbs mentioned in source: ' + verbs,
      'Form actions: ' + (actions.length ? JSON.stringify(actions) : 'none inline')
    ],
    signal: reproduced
      ? 'The surface carries write affordances, so a written row can be traced back to a visible action.'
      : 'No write affordance is visible on this surface; any write it triggers is fired from script and cannot be attributed here.'
  };
}

async function probeCache(skill: string, target: string): Promise<ProbeResult> {
  const [plain, bypass] = await Promise.all([
    readOnce(target, 'text/html,application/json,*/*'),
    readOnce(target, 'text/html,application/json,*/*', { 'Cache-Control': 'no-cache, no-store' })
  ]);
  const directive = plain.headers.cache_control;
  const shared = /max-age|s-maxage|public|stale-while-revalidate/i.test(directive);
  const varied = plain.bytes !== bypass.bytes || plain.headers.age !== bypass.headers.age;
  return {
    skill,
    probe: 'cache',
    target,
    reproduced: shared,
    observations: [
      'Pass one: ' + describe(plain),
      'Pass two (no-store request): ' + describe(bypass),
      'Edge marker: ' + plain.headers.x_cache + ' · varied: ' + (varied ? 'yes' : 'no')
    ],
    signal: shared
      ? 'The response is shareable for ' + directive + ', so a failed origin is masked for that window to every reader.'
      : 'The response is not shareable, so a downstream cache is not masking a failed origin here.'
  };
}

const FRAMEWORK_MARKERS: { label: string; test: RegExp }[] = [
  { label: 'Next.js', test: /__NEXT_DATA__|\/_next\/static\//i },
  { label: 'Nuxt', test: /__NUXT__|\/_nuxt\//i },
  { label: 'React shell', test: /data-reactroot|id=["']root["']/i },
  { label: 'Vue', test: /data-v-[0-9a-f]{8}|__VUE__/i },
  { label: 'SvelteKit', test: /__sveltekit|_app\/immutable\//i },
  { label: 'Astro', test: /astro-island|astro-slot/i },
  { label: 'WordPress', test: /wp-content|wp-includes/i },
  { label: 'Drupal', test: /Drupal\.settings|sites\/default\/files/i },
  { label: 'Shopify', test: /cdn\.shopify\.com/i },
  { label: 'Django', test: /csrfmiddlewaretoken/i },
  { label: 'Rails', test: /csrf-token/i }
];

async function probeGenerator(skill: string, target: string): Promise<ProbeResult> {
  const hit = await readOnce(target, 'text/html,*/*');
  const meta = hit.body.match(/<meta[^>]+name=["']generator["'][^>]*content=["']([^"']+)["']/i);
  const detected = FRAMEWORK_MARKERS.filter((marker) => marker.test.test(hit.body)).map((marker) => marker.label);
  const hashed = new Set(
    [...hit.body.matchAll(/(?:src|href)=["'][^"']*?[.-]([0-9a-f]{8,})\.(?:js|css)["']/gi)].map((match) => match[1])
  );
  const reproduced = detected.length > 0 || hashed.size > 0 || Boolean(meta);
  return {
    skill,
    probe: 'generator',
    target,
    reproduced,
    observations: [
      describe(hit),
      'Generator meta: ' + (meta ? meta[1] : 'none'),
      'Build markers: ' + (detected.length ? detected.join(', ') : 'none'),
      'Content-hashed bundles: ' + hashed.size
    ],
    signal: reproduced
      ? 'The surface fingerprints its own build (' +
        (detected.length ? detected.join(', ') : 'no framework marker') +
        ', ' + hashed.size + ' hashed bundle(s)), so the running generation can be dated without source access.'
      : 'No generator meta, framework marker or hashed bundle is visible, so this surface is hand-served and cannot be dated this way.'
  };
}

async function probeConditional(skill: string, target: string): Promise<ProbeResult> {
  const first = await readOnce(target, 'text/html,application/json,*/*');
  const etag = first.headers.etag_raw;
  const validator = etag || (first.headers.last_modified !== 'none' ? first.headers.last_modified : '');
  if (!validator) {
    return {
      skill,
      probe: 'conditional',
      target,
      reproduced: true,
      observations: [describe(first), 'ETag: none · Last-Modified: ' + first.headers.last_modified],
      signal:
        'No validator is served at all, so a client cannot tell a fresh render from a stale copy and staleness is invisible on this route.'
    };
  }
  const header = etag ? { 'If-None-Match': etag } : { 'If-Modified-Since': validator };
  const second = await readOnce(target, 'text/html,application/json,*/*', header);
  const revalidated = second.status === 304;
  return {
    skill,
    probe: 'conditional',
    target,
    reproduced: !revalidated,
    observations: [
      describe(first),
      'Validator sent back: ' + (etag ? 'If-None-Match: ' + etag : 'If-Modified-Since: ' + validator),
      'Conditional re-read: HTTP ' + second.status + ' · ' + second.bytes + 'b'
    ],
    signal: revalidated
      ? 'The validator is real: the conditional re-read returned 304, so the edge revalidates and a stale copy would be detectable.'
      : 'The validator is decorative: a conditional re-read still returned a full body, so a masked stale copy cannot be told apart from a fresh one.'
  };
}

async function probeVariance(skill: string, target: string): Promise<ProbeResult> {
  const [first, second] = await Promise.all([
    readOnce(target, 'text/html,application/json,*/*', { 'Accept-Language': 'en-US,en;q=0.9' }),
    readOnce(target, 'text/html,application/json,*/*', { 'Accept-Language': 'fr-FR,fr;q=0.9' })
  ]);
  const declared = /accept-language|\*/i.test(first.headers.vary) || /accept-language|\*/i.test(second.headers.vary);
  const differ = first.body !== second.body || first.bytes !== second.bytes;
  const reproduced = differ && !declared;
  return {
    skill,
    probe: 'variance',
    target,
    reproduced,
    observations: [
      'Read one (en): ' + describe(first) + ' · vary=' + first.headers.vary,
      'Read two (fr): ' + describe(second) + ' · vary=' + second.headers.vary,
      'Bodies differ: ' + (differ ? 'yes' : 'no')
    ],
    signal: !differ
      ? 'Both language preferences returned the same body, so this route does not vary on the client language header.'
      : reproduced
        ? 'The body changes with Accept-Language while the response declares vary=' + first.headers.vary +
          ', so a shared cache can hand one reader the representation meant for another.'
        : 'The body changes with Accept-Language and the response declares it in vary, so the cache key is honest.'
  };
}

async function probePosture(skill: string, target: string): Promise<ProbeResult> {
  const page = await readOnce(target, 'text/html,application/json,*/*');
  const origin = new URL(page.url).origin;
  const read = async (url: string) => {
    try {
      return await readOnce(url, 'text/plain,application/xml,*/*');
    } catch {
      return null;
    }
  };
  const [robots, sitemap] = await Promise.all([read(origin + '/robots.txt'), read(origin + '/sitemap.xml')]);
  const controls = [
    { name: 'content-security-policy', value: page.headers.csp },
    { name: 'strict-transport-security', value: page.headers.hsts },
    { name: 'x-frame-options', value: page.headers.x_frame },
    { name: 'x-content-type-options', value: page.headers.x_content_type },
    { name: 'referrer-policy', value: page.headers.referrer }
  ];
  const missing = controls.filter((control) => control.value === 'none').map((control) => control.name);
  const declared = controls.filter((control) => control.value !== 'none').map((control) => control.name);
  const disallow = robots && robots.status === 200 ? (robots.body.match(/^\s*Disallow:/gim) || []).length : 0;
  const hintPaths =
    robots && robots.status === 200
      ? [...robots.body.matchAll(/^\s*Disallow:\s*(\S+)/gim)]
          .map((match) => match[1])
          .filter((path) => path !== '/')
          .slice(0, 4)
      : [];
  return {
    skill,
    probe: 'posture',
    target,
    reproduced: missing.length > 0,
    observations: [
      describe(page),
      'Declared controls: ' + (declared.length ? declared.join(', ') : 'none'),
      'Missing controls: ' + (missing.length ? missing.join(', ') : 'none'),
      'robots.txt: ' + (robots ? 'HTTP ' + robots.status + ' · ' + disallow + ' disallow entries' : 'unreadable'),
      'Advertised paths: ' + (hintPaths.length ? JSON.stringify(hintPaths) : 'none'),
      'sitemap.xml: ' + (sitemap ? 'HTTP ' + sitemap.status : 'unreadable')
    ],
    signal: missing.length
      ? 'The response leaves ' + missing.length + ' of 5 boundary controls undeclared (' + missing.join(', ') +
        '), so the browser enforces nothing there and the surface is free to be framed, sniffed or inline-scripted.'
      : 'All five boundary controls are declared, so the edge is setting an enforceable browser policy on this route.'
  };
}

const SECRET_SHAPES: { label: string; test: RegExp }[] = [
  { label: 'provider secret key', test: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}/g },
  { label: 'aws access key id', test: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: 'google api key', test: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { label: 'literal bearer token', test: /Bearer\s+[A-Za-z0-9._-]{20,}/g },
  { label: 'private key block', test: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
  { label: 'encoded jwt', test: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g }
];

async function probeBundle(skill: string, target: string): Promise<ProbeResult> {
  const page = await readOnce(target, 'text/html,*/*');
  const origin = new URL(page.url).origin;
  const sources = new Set<string>();
  for (const match of page.body.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) {
    try {
      const resolved = new URL(match[1], origin);
      if (resolved.origin === origin) sources.add(resolved.origin + resolved.pathname + resolved.search);
    } catch {
      continue;
    }
  }
  const chosen = [...sources].slice(0, 2);
  const reads = await Promise.all(
    chosen.map(async (url) => {
      try {
        return await readOnce(url, 'application/javascript,text/javascript,*/*');
      } catch {
        return null;
      }
    })
  );
  const hits: string[] = [];
  let scanned = 0;
  for (const hit of reads) {
    if (!hit) continue;
    scanned += 1;
    for (const shape of SECRET_SHAPES) {
      const count = (hit.body.match(shape.test) || []).length;
      if (count > 0) hits.push(shape.label + ' x' + count);
    }
  }
  return {
    skill,
    probe: 'bundle',
    target,
    reproduced: hits.length > 0,
    observations: [
      'Page: ' + describe(page),
      'Same-origin scripts referenced: ' + sources.size + ' · read: ' + scanned,
      'Credential-shaped patterns: ' + (hits.length ? hits.join(', ') : 'none'),
      'Values withheld: no matched string is recorded, only its pattern class'
    ],
    signal:
      scanned === 0
        ? 'No same-origin script on this page could be read, so what the client bundle carries is not observable from this surface.'
        : hits.length
          ? 'The shipped bundle carries credential-shaped strings (' + hits.join(', ') +
            '). The pattern is present; whether the value is live is not observable from a read surface, and the value itself is deliberately not retained.'
          : 'The scripts read carried no credential-shaped string, so the client bundle is not shipping a key in this window.'
  };
}

const RUNNERS: Record<string, (skill: string, target: string) => Promise<ProbeResult>> = {
  negotiate: probeNegotiate,
  entropy: probeEntropy,
  silence: probeSilence,
  clock: probeClock,
  surface: probeSurface,
  cache: probeCache,
  generator: probeGenerator,
  conditional: probeConditional,
  variance: probeVariance,
  posture: probePosture,
  bundle: probeBundle
};

export async function runProbe(probe: string, skill: string, target: string): Promise<ProbeResult> {
  const runner = RUNNERS[probe];
  const safeTarget = assertPublicUrl(target);
  if (!runner) throw new Error('Unknown probe: ' + probe);
  try {
    return await runner(skill, safeTarget);
  } catch (error) {
    const reason = error && error.message ? error.message : 'probe failed';
    return {
      skill,
      probe,
      target: safeTarget,
      reproduced: false,
      observations: ['No usable response: ' + reason],
      signal: 'The probe could not read this target in its window, so this skill produced no evidence.'
    };
  }
}

// One probe pair per skill, bounded by the cap so a run stays predictable.
export function selectProbes(
  skills: { name: string; probe: string }[],
  targets: string[],
  cap = 4
): { skill: string; probe: string; target: string }[] {
  const pairs: { skill: string; probe: string; target: string }[] = [];
  const hosts = targets.slice(0, 2);
  for (const skill of skills.slice(0, cap)) {
    for (const target of hosts) {
      if (pairs.length >= cap) return pairs;
      pairs.push({ skill: skill.name, probe: skill.probe, target });
    }
  }
  return pairs;
}

export function formatProbes(results: ProbeResult[]): string {
  if (!results.length) return 'No probe was executed.';
  return results
    .map(
      (result) =>
        '- skill=' + result.skill + ' probe=' + result.probe + ' target=' + result.target + '\n' +
        '  observations: ' + result.observations.join(' | ') + '\n' +
        '  signal: ' + result.signal
    )
    .join('\n');
}