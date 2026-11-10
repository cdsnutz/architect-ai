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
      server: res.headers.get('server') || 'none'
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

const RUNNERS: Record<string, (skill: string, target: string) => Promise<ProbeResult>> = {
  negotiate: probeNegotiate,
  entropy: probeEntropy,
  silence: probeSilence,
  clock: probeClock,
  surface: probeSurface,
  cache: probeCache
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

// One probe pair per skill, bounded so a run never exceeds four executions.
export function selectProbes(
  skills: { name: string; probe: string }[],
  targets: string[],
  cap = 4
): { skill: string; probe: string; target: string }[] {
  const pairs: { skill: string; probe: string; target: string }[] = [];
  const hosts = targets.slice(0, 2);
  for (const skill of skills.slice(0, 4)) {
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