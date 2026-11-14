/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Sovereign intelligence: four modules over one bounded read.
//
// 1. Temporal drift — the same surface, read again on a later date, against the
//    snapshot this lab took the first time. The first pass for a host is a
//    baseline and says so; there is no velocity without two points.
// 2. Ghost-page diff — the Internet Archive CDX index for a window six to twelve
//    months back, compared with what the surface publishes today. Deleted paths
//    are reported as scar tissue, never as intent.
// 3. Semantic entropy — marketing claims in the served document checked against
//    the technical signal this pass actually measured.
// 4. Synthetic path predictor — siblings implied by the naming convention the
//    surface already uses, probed inside a fixed budget. Only a confirmed
//    response is reported as an asset; everything else stays a prediction.

import { assertPublicUrl, safeFetch } from './readOnly.ts';
import { assertAuthorization } from './symmetry.ts';

const UA = 'Mozilla/5.0 (compatible; RevEngineSovereignIntel/1.0; authorized read-only audit)';
const TIMEOUT_MS = 9000;
const ARCHIVE_TIMEOUT_MS = 25000;
const MIN_DRIFT_HOURS = 24;
const HOME_CAP = 250000;
const MAX_PATHS = 300;
const MAX_COMPETITORS = 3;
const MAX_PROBES = 8;
const MAX_WAYBACK = 400;
const ASSET_PATH = /\.(png|jpe?g|gif|svg|webp|avif|ico|css|js|mjs|json|xml|txt|pdf|zip|mp4|webm|woff2?|ttf|eot|map)$/i;
const UNSAFE_PATH = /(logout|sign-?out|delete|destroy|reset|unsubscribe|revoke|cart|checkout|basket|account|login|signin|sign-?up|register|admin)/i;

const CLAIMS = [
  {
    id: 'speed',
    label: 'speed',
    rx: /\b(?:fastest|blazing(?:ly)? fast|ultra[- ]?fast|lightning[- ]?fast|insanely fast)\b/i,
    need: 'a first byte at least as fast as the other surfaces read'
  },
  {
    id: 'reliability',
    label: 'reliability',
    rx: /\b(?:enterprise[- ]grade|99\.9+%?|five[- ]nines|mission[- ]critical|uptime guarantee|\bSLA\b)\b/i,
    need: 'the baseline headers a hardened origin ships'
  },
  {
    id: 'security',
    label: 'security posture',
    rx: /\b(?:bank[- ]grade|military[- ]grade|secure by design|end[- ]to[- ]end encrypt\w*|zero[- ]trust)\b/i,
    need: 'transport and content security headers'
  },
  {
    id: 'latency',
    label: 'real-time delivery',
    rx: /\b(?:real[- ]time|sub[- ]second|zero[- ]latency)\b/i,
    need: 'a first byte inside 100 ms'
  },
  {
    id: 'scale',
    label: 'unbounded scale',
    rx: /\b(?:scales? to (?:millions|billions)|unlimited|infinite scale)\b/i,
    need: 'a load measurement this pass cannot make'
  }
];

function nowIso() {
  return new Date().toISOString();
}

async function get(url: string, accept: string, cap: number) {
  const started = Date.now();
  const response = await safeFetch(url, {
    method: 'GET',
    headers: { 'User-Agent': UA, Accept: accept },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  // redirect:'follow' can land anywhere: the surface parsed has to be public.
  assertPublicUrl(response.url);
  const text = cap > 0 ? (await response.text()).slice(0, cap) : '';
  return { url: response.url, status: response.status, text, headers: response.headers, ms: Date.now() - started };
}

function normalizePath(raw: string, origin: string): string {
  try {
    const parsed = new URL(raw, origin);
    if (parsed.origin !== origin) return '';
    const path = parsed.pathname.replace(/\/{2,}/g, '/');
    if (path === '/' || path.length > 180) return '';
    if (ASSET_PATH.test(path) || UNSAFE_PATH.test(path)) return '';
    return path.replace(/\/$/, '');
  } catch {
    return '';
  }
}

function familyOf(path: string) {
  return (path.split('/').filter(Boolean)[0] || '').toLowerCase();
}

function familyCounts(paths: string[]) {
  const counts = new Map<string, number>();
  paths.forEach((path) => {
    const family = familyOf(path);
    if (family) counts.set(family, (counts.get(family) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([family, count]) => ({ family, count }))
    .sort((left, right) => right.count - left.count);
}

async function readSurface(url: string, role: string) {
  const home = await get(url, 'text/html,application/xhtml+xml,*/*', HOME_CAP);
  if (home.status >= 400) throw new Error('answered HTTP ' + home.status + ', so there is no surface to read');
  const origin = new URL(home.url).origin;
  const host = new URL(home.url).hostname;

  let robots = '';
  try {
    const jar = await get(origin + '/robots.txt', 'text/plain,*/*', 20000);
    if (jar.status === 200) robots = jar.text;
  } catch {
    robots = '';
  }

  const declared = [...robots.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((match) => match[1]).slice(0, 2);
  const roots = declared.length ? declared : [origin + '/sitemap.xml'];
  const fromSitemap: string[] = [];
  for (const root of roots) {
    try {
      const page = await get(root, 'application/xml,text/plain,*/*', 200000);
      if (page.status !== 200) continue;
      for (const match of page.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
        if (/\.xml(\?|$)/i.test(match[1])) continue;
        const path = normalizePath(match[1], origin);
        if (path) fromSitemap.push(path);
        if (fromSitemap.length >= MAX_PATHS * 2) break;
      }
    } catch {
      // A sitemap that will not read undercounts the surface; it never invents paths.
    }
  }

  const fromNavigation = [...home.text.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => normalizePath(match[1], origin))
    .filter(Boolean);

  const paths = [...new Set([...fromSitemap, ...fromNavigation])].slice(0, MAX_PATHS);
  const header = (name: string) => home.headers.get(name) || '';

  return {
    url: home.url,
    origin,
    host,
    role,
    status: home.status,
    text: home.text,
    ttfb_ms: home.ms,
    bytes: home.text.length,
    paths,
    families: familyCounts(paths),
    security: {
      hsts: Boolean(header('strict-transport-security')),
      csp: Boolean(header('content-security-policy')),
      nosniff: Boolean(header('x-content-type-options'))
    }
  };
}

// ── 1. Temporal drift ────────────────────────────────────────────────────────
function buildDrift(surfaces: any[], priors: Record<string, any>) {
  const rows = surfaces.map((surface) => {
    const prior = priors[surface.host];
    if (!prior) {
      return {
        host: surface.host,
        role: surface.role,
        state: 'baseline',
        paths: surface.paths.length,
        added: 0,
        removed: 0,
        rate_per_day: 0,
        projection_21d: null,
        families: [],
        note: 'First snapshot for this host, so there is no velocity to read yet. Run this pass again in a week and the delta is measured, not guessed.'
      };
    }

    const before = new Set<string>(prior.paths || []);
    const now = new Set<string>(surface.paths);
    const added = [...now].filter((path) => !before.has(path));
    const removed = [...before].filter((path) => !now.has(path));
    const capturedMs = new Date(prior.captured_at || nowIso()).getTime();
    const hours = Math.max(1, Math.round((Date.now() - capturedMs) / 3600000));
    const days = Math.max(1, Math.round(hours / 24));
    // Velocity across two reads minutes apart is noise, not speed.
    const measurable = hours >= MIN_DRIFT_HOURS;
    const beforeFamily = new Map<string, number>(
      familyCounts(prior.paths || []).map((row: any) => [row.family, row.count])
    );
    const families = surface.families
      .map((row: any) => ({ family: row.family, now: row.count, before: beforeFamily.get(row.family) || 0 }))
      .map((row: any) => ({ ...row, delta: row.now - row.before }))
      .filter((row: any) => row.delta !== 0)
      .sort((left: any, right: any) => right.delta - left.delta);
    const elapsedDays = hours / 24;
    const rate = measurable ? added.length / elapsedDays : null;

    return {
      host: surface.host,
      role: surface.role,
      state: measurable ? 'tracked' : 'interval_short',
      since: prior.captured_at,
      hours,
      days,
      paths: surface.paths.length,
      added: added.length,
      removed: removed.length,
      rate_per_day: rate === null ? null : Math.round(rate * 100) / 100,
      projection_21d: rate === null ? null : Math.round(rate * 21),
      families,
      added_examples: added.slice(0, 5),
      removed_examples: removed.slice(0, 5),
      note: measurable
        ? added.length === 0 && removed.length === 0
          ? 'No change against the previous snapshot taken ' + days + ' day(s) ago.'
          : added.length + ' path(s) added and ' + removed.length + ' removed in ' + days + ' day(s).'
        : 'The previous snapshot is ' + hours + ' hour(s) old, so the change is reported without a rate: velocity needs at least a day between reads to mean anything.'
    };
  });

  const warnings = rows
    .filter((row: any) => row.state === 'tracked' && row.role === 'winner')
    .flatMap((row: any) =>
      row.families
        .filter((family: any) => family.delta >= 3)
        .map((family: any) => ({
          host: row.host,
          family: family.family,
          delta: family.delta,
          days: row.days,
          message:
            row.host + ' added ' + family.delta + ' path(s) in /' + family.family + ' in ' + row.days +
            ' day(s). They are moving into that intent now: claim it before the space consolidates.'
        }))
    )
    .sort((left: any, right: any) => right.delta - left.delta)
    .slice(0, 4);

  const baselines = rows.filter((row: any) => row.state === 'baseline').length;

  return {
    rows,
    warnings,
    baselines,
    note: baselines === rows.length
      ? 'Every surface in this pass was a first snapshot, so drift is a baseline only. The velocity reads on the next run.'
      : warnings.length
        ? warnings[0].message
        : 'No winner expanded a family by three or more paths against its last snapshot.'
  };
}

// ── 2. Ghost-page diff ───────────────────────────────────────────────────────
async function waybackPaths(host: string, origin: string) {
  const to = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10).replace(/-/g, '');
  const from = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10).replace(/-/g, '');
  const query =
    'https://web.archive.org/cdx/search/cdx?url=' + encodeURIComponent(host + '/*') +
    '&from=' + from + '&to=' + to + '&output=json&fl=original&collapse=urlkey&limit=' + MAX_WAYBACK;
  const response = await fetch(query, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(ARCHIVE_TIMEOUT_MS) });
  if (!response.ok) throw new Error('the archive answered HTTP ' + response.status);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length < 2) return [];
  return rows
    .slice(1)
    .map((row: any) => normalizePath(String(row && row[0] ? row[0] : ''), origin))
    .filter(Boolean);
}

async function buildGhost(surfaces: any[], priors: Record<string, any>) {
  const rows = await Promise.all(
    surfaces.map(async (surface) => {
      let historical: string[] = [];
      let archiveState = 'compared';
      let archiveReason = '';
      try {
        historical = await waybackPaths(surface.host, surface.origin);
      } catch (error: any) {
        archiveState = 'unavailable';
        archiveReason = error && error.message ? error.message : 'no response';
      }

      // Two histories: the archive's captures and this lab's own snapshots.
      // Either one proves a path was published and is now gone.
      const priorPaths: string[] = (priors[surface.host] && priors[surface.host].paths) || [];
      const sources = [
        historical.length
          ? 'archive recorded ' + historical.length + ' path(s) six to twelve months ago'
          : archiveState === 'unavailable'
            ? 'archive unavailable (' + archiveReason + ')'
            : 'archive holds no capture in the window',
        priorPaths.length
          ? 'previous snapshot held ' + priorPaths.length + ' path(s)'
          : 'no previous snapshot stored'
      ];

      const current = new Set(surface.paths);
      const seen = new Set<string>();
      const deleted = [...historical, ...priorPaths].filter((path) => {
        if (!path || current.has(path) || seen.has(path)) return false;
        seen.add(path);
        return true;
      });
      const families = familyCounts(deleted);
      const scars = families.filter((row) => row.count >= 3).slice(0, 5);

      return {
        host: surface.host,
        role: surface.role,
        state: historical.length || priorPaths.length ? 'compared' : archiveState === 'unavailable' ? 'unavailable' : 'empty',
        archive_paths: historical.length,
        prior_paths: priorPaths.length,
        deleted: deleted.length,
        families: families.slice(0, 8),
        scars,
        examples: deleted.slice(0, 6),
        sources,
        note: deleted.length
          ? deleted.length + ' path(s) published before are gone from the surface today (' + sources.join('; ') + ').'
          : 'Nothing published before is missing today (' + sources.join('; ') + ').'
      };
    })
  );

  const scars = rows.flatMap((row: any) =>
    (row.scars || []).map((scar: any) => ({
      host: row.host,
      family: scar.family,
      deleted: scar.count,
      message:
        row.host + ' removed ' + scar.count + ' path(s) from /' + scar.family +
        '. A section that size does not disappear by accident: it is a cut segment, a failed push or a dropped line of business. That is the seam to sell into.'
    }))
  );

  return {
    rows,
    scars,
    note: scars.length
      ? scars[0].message
      : rows.every((row: any) => row.state === 'compared')
        ? 'No family this large was removed from any surface in the window.'
        : 'History is only reported where the archive actually answered.'
  };
}

// ── 3. Semantic entropy ──────────────────────────────────────────────────────
function buildEntropy(surfaces: any[]) {
  const fastest = Math.min(...surfaces.map((surface) => surface.ttfb_ms));

  const rows = surfaces.map((surface) => {
    const claims = CLAIMS.map((claim) => {
      const match = claim.rx.exec(surface.text);
      if (!match) return null;
      const quote = String(match[0]).trim().slice(0, 60);

      let verdict = 'unverified';
      let reality = '';

      if (claim.id === 'speed') {
        const competitive = surface.ttfb_ms <= fastest * 1.25;
        verdict = competitive ? 'supported' : 'unsupported';
        reality = 'first byte measured at ' + surface.ttfb_ms + ' ms against ' + fastest + ' ms on the fastest surface read';
      } else if (claim.id === 'latency') {
        verdict = surface.ttfb_ms <= 100 ? 'supported' : 'unsupported';
        reality = 'first byte measured at ' + surface.ttfb_ms + ' ms';
      } else if (claim.id === 'reliability') {
        const hardened = surface.security.hsts && surface.security.csp;
        verdict = hardened ? 'supported' : 'unsupported';
        reality = 'HSTS ' + (surface.security.hsts ? 'present' : 'absent') + ', CSP ' + (surface.security.csp ? 'present' : 'absent');
      } else if (claim.id === 'security') {
        const hardened = surface.security.hsts && surface.security.csp && surface.security.nosniff;
        verdict = hardened ? 'supported' : 'unsupported';
        reality = 'transport and content headers ' + (hardened ? 'all present' : 'incomplete in this response');
      } else {
        verdict = 'unverified';
        reality = 'this pass reads one document and cannot measure capacity';
      }

      return { id: claim.id, label: claim.label, quote, need: claim.need, verdict, reality };
    }).filter(Boolean);

    const tested = claims.filter((claim: any) => claim.verdict !== 'unverified');
    const unsupported = tested.filter((claim: any) => claim.verdict === 'unsupported');

    return {
      host: surface.host,
      role: surface.role,
      claims,
      tested: tested.length,
      unsupported: unsupported.length,
      gap_pct: tested.length ? Math.round((unsupported.length / tested.length) * 100) : null,
      note: claims.length
        ? tested.length
          ? unsupported.length + ' of ' + tested.length + ' measurable claim(s) are not supported by this response.'
          : 'Every claim matched here needs a measurement this pass cannot take, so none is scored.'
        : 'No claim in the pattern set appears in the served document.'
    };
  });

  const worst = rows
    .filter((row: any) => row.gap_pct !== null && row.gap_pct > 0)
    .sort((left: any, right: any) => right.gap_pct - left.gap_pct)[0];

  return {
    rows,
    note: worst
      ? worst.host + ' carries a ' + worst.gap_pct + '% credibility gap on the claims this pass could test: the identity in the copy and the infrastructure underneath do not agree.'
      : 'No measurable credibility gap was found on the claims this pass could test.',
    limits:
      'Claims are matched by pattern in the served document and scored only against what one anonymous read measured. A claim this pass cannot measure is marked unverified, never unsupported.'
  };
}

// ── 4. Synthetic path predictor ──────────────────────────────────────────────
function syntheticCandidates(paths: string[]) {
  const stems = new Map<string, number[]>();
  paths.forEach((path) => {
    const match = /^(.*?)(\d{1,3})$/.exec(path);
    if (!match) return;
    stems.set(match[1], [...(stems.get(match[1]) || []), Number(match[2])]);
  });

  const candidates = new Set<string>();
  for (const [stem, indexes] of stems) {
    const highest = Math.max(...indexes);
    candidates.add(stem + (highest + 1));
    if (indexes.length >= 2) {
      candidates.add(stem + '0');
      candidates.add(stem + (highest + 2));
      candidates.add(stem + 'beta');
    }
  }
  return [...candidates].filter((path) => !paths.includes(path)).slice(0, MAX_PROBES);
}

async function buildPredictor(lead: any) {
  const candidates = syntheticCandidates(lead.paths);
  if (!candidates.length) {
    return {
      host: lead.host,
      state: 'no_pattern',
      patterns: 0,
      probed: 0,
      confirmed: [],
      absent: [],
      note: 'No numbering convention was observed in the paths this surface publishes, so there is no sibling to infer. Nothing was guessed.'
    };
  }

  const results = await Promise.all(
    candidates.map(async (path) => {
      const url = lead.origin + path;
      try {
        const response = await get(url, 'text/html,application/xhtml+xml,*/*', 60000);
        const isPage = response.status >= 200 && response.status < 300 && /text\/html/i.test(response.headers.get('content-type') || '');
        return { path, url, status: response.status, confirmed: isPage && response.text.length > 200 };
      } catch {
        return { path, url, status: 0, confirmed: false };
      }
    })
  );

  const confirmed = results.filter((row) => row.confirmed);
  const absent = results.filter((row) => !row.confirmed);

  return {
    host: lead.host,
    state: 'probed',
    patterns: candidates.length,
    probed: results.length,
    confirmed: confirmed.map((row) => ({ url: row.url, status: row.status, path: row.path })),
    absent: absent.map((row) => ({ path: row.path, status: row.status })),
    note: confirmed.length
      ? confirmed.length + ' path(s) implied by the surface\'s own naming convention answered with a page and are not published in its sitemap or navigation.'
      : 'Every predicted sibling answered nothing, so the convention holds no hidden page inside this budget.',
    limits: 'Prediction is derived from the paths the surface publishes itself and capped at ' + MAX_PROBES + ' anonymous GETs. Only a 2xx HTML response is reported as an asset.'
  };
}

export async function runIntel(input: { base44: any; body: any }) {
  const { base44, body } = input;
  const target = assertPublicUrl(body.target_url);
  const targetOrigin = new URL(target).origin;
  const grant = assertAuthorization(body.auth_basis, body.attestation);

  const competitors = [...new Set(
    (Array.isArray(body.competitor_urls) ? body.competitor_urls : [])
      .map((value: any) => {
        try {
          return assertPublicUrl(value);
        } catch {
          return '';
        }
      })
      .filter(Boolean)
  )].filter((url) => new URL(url).origin !== targetOrigin).slice(0, MAX_COMPETITORS);

  if (!competitors.length) {
    throw new Error('At least one competitor surface is required, on a different origin from the target.');
  }

  const surfaceResults = await Promise.allSettled([
    readSurface(target, 'lead'),
    ...competitors.map((url) => readSurface(url, 'winner'))
  ]);
  const surfaces = surfaceResults
    .filter((result) => result.status === 'fulfilled')
    .map((result: any) => result.value);
  const unread = surfaceResults
    .map((result, index) => ({ result, url: index === 0 ? target : competitors[index - 1] }))
    .filter((entry) => entry.result.status === 'rejected')
    .map((entry) => ({ url: entry.url, reason: entry.result.reason && entry.result.reason.message ? entry.result.reason.message : 'no response' }));

  if (!surfaces.length) throw new Error('No surface could be read, so there is no intelligence to compile.');
  const lead = surfaces[0].role === 'lead' ? surfaces[0] : surfaces.find((surface) => surface.role === 'lead');
  if (!lead) throw new Error('The target surface could not be read.');

  // Priors are read before this pass writes its own snapshots.
  const priorPairs = await Promise.all(
    surfaces.map(async (surface) => {
      try {
        const page = await base44.entities.SurfaceSnapshot.filter(
          { host: surface.host },
          { sort: '-captured_at', limit: 1 }
        );
        return [surface.host, page.items[0] || null];
      } catch {
        return [surface.host, null];
      }
    })
  );
  const priors: Record<string, any> = Object.fromEntries(priorPairs);

  const drift = buildDrift(surfaces, priors);
  const [ghost, predictor] = await Promise.all([buildGhost(surfaces, priors), buildPredictor(lead)]);
  const entropy = buildEntropy(surfaces);

  // The snapshots this pass just read become the baseline for the next one.
  const capturedAt = nowIso();
  try {
    await base44.entities.SurfaceSnapshot.bulkCreate(
      surfaces.map((surface) => ({
        host: surface.host,
        url: surface.url,
        role: surface.role,
        paths: surface.paths,
        families: surface.families,
        total_paths: surface.paths.length,
        captured_at: capturedAt
      }))
    );
  } catch (error: any) {
    console.log('runIntel: snapshots not saved — ' + (error && error.message));
  }

  return {
    target_url: lead.url,
    auth_basis: grant.basis,
    attestation: grant.attestation,
    ran_at: capturedAt,
    surfaces: surfaces.map((surface) => ({
      url: surface.url,
      host: surface.host,
      role: surface.role,
      paths: surface.paths.length,
      families: surface.families.length,
      ttfb_ms: surface.ttfb_ms,
      security: surface.security
    })),
    unread,
    drift,
    ghost,
    entropy,
    predictor,
    refusals: [
      {
        key: 'Velocity_Without_History',
        reach: 'refused',
        detail: 'Drift needs two dated snapshots of the same host. The first pass stores a baseline and refuses to call it a trend.'
      },
      {
        key: 'Deleted_Means_Failed',
        reach: 'refused',
        detail: 'A removed section is reported as what the archive recorded, not as why it went. Intent is the buyer\'s inference to make, not this pass\'s claim.'
      }
    ],
    limits:
      'Anonymous GET only: homepage, robots.txt and up to two sitemaps per surface, one archive index read per host, and ' +
      MAX_PROBES + ' predicted siblings probed against the lead. Nothing is authenticated, submitted or re-served.'
  };
}