/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Anonymous, GET-only content-negotiation observation.
// Sends no credentials, no cookies and no request bodies, never repeats a path,
// and never targets an endpoint that could change state.

const UA = 'Mozilla/5.0 (compatible; LogicMapper/1.0)';
const MAX_TARGETS = 3;
const TIMEOUT_MS = 8000;
const BODY_CAP = 200000;
const UNSAFE_PATH = /(logout|sign-?out|delete|destroy|reset|unsubscribe|revoke)/i;

type Hit = {
  status: number;
  content_type: string;
  bytes: number;
  shape: string;
  latency_ms: number;
  cache: string;
};

// Cache and revalidation signals are the only honest timing evidence a single
// anonymous pass can collect; inter-update cadence needs a series over time.
function cacheSignals(headers: Headers): string {
  const parts = [
    'cache-control=' + (headers.get('cache-control') || 'none'),
    'etag=' + (headers.get('etag') ? 'present' : 'none'),
    'age=' + (headers.get('age') || 'none'),
    'last-modified=' + (headers.get('last-modified') ? 'present' : 'none'),
  ];
  return parts.join('; ');
}

export type ProbeResult = {
  url: string;
  baseline: Hit | null;
  variant: Hit | null;
  verdict: 'same' | 'changed' | 'status_changed' | 'error';
  note: string;
};

function shapeOf(text: string, contentType: string): string {
  if (/json/i.test(contentType)) {
    try {
      const parsed = JSON.parse(text);
      const keys = Array.isArray(parsed) ? ['[array]'] : Object.keys(parsed || {}).slice(0, 12);
      return 'json:' + keys.join(',');
    } catch {
      return 'json:unparsed';
    }
  }
  const tags = (text.match(/<([a-z][a-z0-9-]*)/gi) || []).length;
  const scripts = (text.match(/<script/gi) || []).length;
  const shell = /__NEXT_DATA__|__NUXT__|data-reactroot|id="__next"|id="root"/i.test(text) ? 'spa' : 'static';
  return 'html:' + shell + ':tags=' + Math.round(tags / 10) + ':scripts=' + scripts;
}

async function hit(url: string, headers: Record<string, string>): Promise<Hit> {
  const started = Date.now();
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, ...headers },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const text = (await res.text()).slice(0, BODY_CAP);
  const latency = Date.now() - started;
  const contentType = (res.headers.get('content-type') || '').split(';')[0];
  return {
    status: res.status,
    content_type: contentType,
    bytes: text.length,
    shape: shapeOf(text, contentType),
    latency_ms: latency,
    cache: cacheSignals(res.headers)
  };
}

function buildTargets(url: string, internalLinks: string[]): string[] {
  let origin = '';
  try {
    origin = new URL(url).origin;
  } catch {
    return [];
  }
  const targets = [url];
  for (const link of internalLinks) {
    if (targets.length >= MAX_TARGETS) break;
    try {
      const abs = new URL(link, origin);
      if (abs.origin !== origin) continue;
      if (UNSAFE_PATH.test(abs.pathname)) continue;
      const clean = abs.origin + abs.pathname;
      if (!targets.includes(clean)) targets.push(clean);
    } catch {
      continue;
    }
  }
  return targets;
}

function verdictOf(baseline: Hit, variant: Hit): Pick<ProbeResult, 'verdict' | 'note'> {
  if (baseline.status !== variant.status) {
    return {
      verdict: 'status_changed',
      note:
        'Answers ' + baseline.status + ' to an HTML request and ' + variant.status +
        ' to an XHR request, so the route is content-negotiated.'
    };
  }
  if (baseline.content_type !== variant.content_type || baseline.shape !== variant.shape) {
    return {
      verdict: 'changed',
      note:
        'A different representation is returned to XHR clients (' + (baseline.content_type || 'unknown') + ' to ' +
        (variant.content_type || 'unknown') + '), so a machine-readable surface is reachable by observation.'
    };
  }
  return { verdict: 'same', note: 'No differential: the same representation is served whatever content type is asked for.' };
}

export async function probeContentNegotiation(url: string, internalLinks: string[] = []): Promise<ProbeResult[]> {
  const targets = buildTargets(url, internalLinks);
  return await Promise.all(
    targets.map(async (target) => {
      try {
        const [baseline, variant] = await Promise.all([
          hit(target, { Accept: 'text/html,application/xhtml+xml' }),
          hit(target, { Accept: 'application/json, text/plain, */*', 'X-Requested-With': 'XMLHttpRequest' })
        ]);
        return { url: target, baseline, variant, ...verdictOf(baseline, variant) };
      } catch {
        return {
          url: target,
          baseline: null,
          variant: null,
          verdict: 'error' as const,
          note: 'No response for this target in the probe window.'
        };
      }
    })
  );
}

export function formatProbe(results: ProbeResult[]): string {
  if (!results.length) {
    return 'Header probe: not run — no live endpoint was queried for this analysis (pasted HTML).';
  }
  const lines = results.map((r) => {
    const describe = (h: Hit | null) =>
      h
        ? h.status + '/' + (h.content_type || 'unknown') + '/' + h.bytes + 'b/' + h.latency_ms + 'ms [' + h.cache + ']'
        : 'no response';
    return (
      '- ' + r.url + ' :: ' + r.verdict + ' — HTML request ' + describe(r.baseline) +
      ' vs XHR request ' + describe(r.variant) + '. ' + r.note
    );
  });
  return (
    'Header probe (anonymous GET, two header variants per path; no cookies, no credentials, no payloads):\n' +
    lines.join('\n')
  );
}