/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// The War Room pod: three agents over one read-only pass.
//
// The Infiltrator reports exposure a public response actually proves: missing
// security headers, key-shaped literals, internal hosts and internal API paths
// published in a client bundle, and version banners. It does not test for a WAF
// bypass, force errors or attempt intrusion, and a secret it matches is named by
// class and location only — the literal is never echoed, stored or returned.
//
// The Oracle reads the lead and up to three winners once and measures the
// dominance cluster: the path families two or more winners publish and the lead
// does not. One read carries no time series, so velocity is a structural proxy
// and the axis says so.
//
// The General sequences only what the other two observed into three weeks.

import { assertPublicUrl, safeFetch } from './readOnly.ts';
import { assertAuthorization } from './symmetry.ts';
import { runGapAudit } from './gapAudit.ts';

const UA = 'Mozilla/5.0 (compatible; RevEngineWarRoom/1.0; authorized read-only audit)';
const TIMEOUT_MS = 9000;
const BODY_CAP = 250000;
const SCRIPT_CAP = 400000;
const MAX_SCRIPTS = 3;
const MAX_COMPETITORS = 3;

export const WAR_ROOM_AGENTS = [
  {
    name: 'The Infiltrator',
    skill: 'Security_Leak_Detection',
    reach: 'bounded',
    detail:
      'Reads the served document, its response headers and up to three of its own bundles for exposure a response proves: missing security headers, key-shaped literals, internal hosts, internal API paths and version banners. It reports the class and the location of a matched secret, never the value.'
  },
  {
    name: 'The Oracle',
    skill: 'Temporal_Competitive_Synthesis',
    reach: 'bounded',
    detail:
      'Compares the lead against the winner surfaces and reports the dominance cluster: families two or more winners publish and the lead does not. One read per surface holds no time series, so velocity is a structural proxy, labelled as one.'
  },
  {
    name: 'The General',
    skill: 'Tactical_Roadmap_Generation',
    reach: 'bounded',
    detail:
      'Sequences the two agents\' findings into a three-week plan. Every step cites the observation behind it and none introduces a number the pass did not measure.'
  }
];

export const WAR_ROOM_REFUSALS = [
  {
    key: 'WAF_Bypass',
    agent: 'The Infiltrator',
    reach: 'refused',
    detail:
      'Testing whether a WAF can be defeated is exploitation of someone else\'s control surface. The pod reports the exposure a response already shows and stops there.'
  },
  {
    key: 'Exploit_Verification',
    agent: 'The Infiltrator',
    reach: 'refused',
    detail:
      'A finding is reported with the response that proves it. Nothing is exploited, forced or brute-forced to make a finding stronger than its evidence.'
  },
  {
    key: 'Session_Replay',
    agent: 'The Oracle',
    reach: 'refused',
    detail:
      'Mirroring or replaying a live session means capturing someone\'s credentials. Winners are read anonymously, once, like any visitor.'
  }
];

const HEADERS = [
  {
    key: 'strict-transport-security',
    title: 'No HSTS: the first hop can be stripped',
    severity: 'high',
    fix: 'Send Strict-Transport-Security: max-age=31536000; includeSubDomains on every https response.'
  },
  {
    key: 'content-security-policy',
    title: 'No content security policy: an injected script runs unrestricted',
    severity: 'high',
    fix: 'Publish a Content-Security-Policy that allows only the origins the app loads, starting in report-only mode.'
  },
  {
    key: 'x-content-type-options',
    title: 'No nosniff: a response can be re-typed by the browser',
    severity: 'medium',
    fix: 'Send X-Content-Type-Options: nosniff.'
  },
  {
    key: 'referrer-policy',
    title: 'No referrer policy: full paths leak to every third party',
    severity: 'low',
    fix: 'Send Referrer-Policy: strict-origin-when-cross-origin.'
  },
  {
    key: 'permissions-policy',
    title: 'No permissions policy: device APIs stay open to any frame',
    severity: 'low',
    fix: 'Send Permissions-Policy denying camera, microphone and geolocation wherever they are unused.'
  }
];

// Each pattern is matched against the document and its own bundles. `redact`
// patterns are credentials: the finding names the class and where it was read,
// and the matched text is dropped before it leaves this module.
const LEAK_PATTERNS = [
  {
    id: 'private_key',
    class: 'leak',
    title: 'Private key material published to the client',
    severity: 'critical',
    redact: true,
    rx: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
    fix: 'Rotate that key, rebuild without it, purge the old bundle and move the signing or decryption step server-side.'
  },
  {
    id: 'provider_key',
    class: 'leak',
    title: 'Provider API key literal published to the client',
    severity: 'critical',
    redact: true,
    rx: /\b(?:sk_live_[A-Za-z0-9]{8,}|sk_test_[A-Za-z0-9]{8,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|AIza[0-9A-Za-z_-]{30,}|xox[baprs]-[A-Za-z0-9-]{8,})/,
    fix: 'Revoke the key, issue a fresh one, and call that provider from the server so the client never holds it.'
  },
  {
    id: 'env_file',
    class: 'leak',
    title: 'Environment file referenced from the client bundle',
    severity: 'high',
    redact: false,
    rx: /(?:^|["'`(\s])\.env(?:\.[a-z0-9]+)?(?:$|["'`)\s])/i,
    fix: 'Confirm the file is not served, then strip the reference and build the value in at deploy time.'
  },
  {
    id: 'internal_host',
    class: 'leak',
    title: 'Pre-production host published to the client',
    severity: 'high',
    redact: false,
    // The keyword has to sit on a subdomain of a registrable domain: dev.example.com
    // qualifies, while dev.to or qa.io (real sites) do not.
    rx: /\bhttps?:\/\/(?:[a-z0-9-]+\.)*(?:dev|staging|stage|internal|intranet|preview|qa|uat)\.[a-z0-9-]+\.[a-z]{2,}/i,
    fix: 'Remove the host from the build and put it behind an authenticated server route if it is still needed.'
  },
  {
    id: 'internal_path',
    class: 'leak',
    title: 'Internal API path published to the client',
    severity: 'high',
    redact: false,
    rx: /\/(?:dev|staging|internal|test|private)[-_]?(?:api|graphql|rest)\b/i,
    fix: 'Close that route to anonymous traffic, then rebuild the client so the path is no longer shipped.'
  }
];

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function nowIso() {
  return new Date().toISOString();
}

function clamp(text: string, max: number) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '…' : clean;
}

async function read(url: string, cap: number) {
  const started = Date.now();
  const response = await safeFetch(url, {
    method: 'GET',
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/javascript,*/*' },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  // redirect:'follow' can land anywhere: the surface parsed has to be public.
  assertPublicUrl(response.url);
  const text = (await response.text()).slice(0, cap);
  return { url: response.url, status: response.status, text, headers: response.headers, ms: Date.now() - started };
}

function scriptUrls(html: string, base: string): string[] {
  const origin = new URL(base).origin;
  const found = new Set<string>();
  for (const match of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) {
    try {
      const url = new URL(match[1], base);
      if (url.origin === origin) found.add(url.toString());
    } catch {
      // A script reference that does not resolve carries no evidence.
    }
  }
  return [...found].slice(0, MAX_SCRIPTS);
}

// One anonymous read of the lead: headers, document, and its own bundles.
export async function scanSurface(target: string) {
  const page = await read(target, BODY_CAP);
  if (page.status >= 400) {
    throw new Error('the lead answered HTTP ' + page.status + ', so there is no surface to scan');
  }

  const headers = page.headers;
  const header = (name: string) => headers.get(name) || '';
  const findings: any[] = [];
  const push = (finding: any) => findings.push({ id: finding.id, ...finding, observed: true });

  const protocol = new URL(page.url).protocol;
  if (protocol === 'http:') {
    push({
      id: 'plaintext',
      class: 'transport',
      title: 'Served over plain http',
      severity: 'critical',
      where: page.url,
      evidence: 'The lead answered on ' + page.url + ' without TLS.',
      fix: 'Terminate TLS and redirect every http request to https with a 301.'
    });
  }

  for (const rule of HEADERS) {
    if (header(rule.key)) continue;
    push({
      id: 'header:' + rule.key,
      class: 'headers',
      title: rule.title,
      severity: rule.severity,
      where: page.url,
      evidence: 'HTTP ' + page.status + ' for ' + page.url + ' carried no ' + rule.key + ' header.',
      fix: rule.fix
    });
  }

  if (!header('x-frame-options') && !/frame-ancestors/i.test(header('content-security-policy'))) {
    push({
      id: 'header:frame-ancestors',
      class: 'headers',
      title: 'No frame protection: the app can be embedded elsewhere',
      severity: 'medium',
      where: page.url,
      evidence: 'Neither X-Frame-Options nor a CSP frame-ancestors directive came back for ' + page.url + '.',
      fix: 'Send X-Frame-Options: SAMEORIGIN, or frame-ancestors in the CSP once the policy exists.'
    });
  }

  const banner = [header('server'), header('x-powered-by')].filter(Boolean).join(' · ');
  if (banner && /[0-9]/.test(banner)) {
    push({
      id: 'header:banner',
      class: 'disclosure',
      title: 'Service banner discloses a version',
      severity: 'low',
      where: page.url,
      evidence: 'The response advertises "' + clamp(banner, 80) + '".',
      fix: 'Suppress the version from the server and framework banners; keep it in your own logs.'
    });
  }

  const scripts = scriptUrls(page.text, page.url);
  const bundles: any[] = [];
  const sources = [{ where: page.url, text: page.text }];
  for (const script of scripts) {
    try {
      const bundle = await read(script, SCRIPT_CAP);
      bundles.push({ url: bundle.url, bytes: bundle.text.length, status: bundle.status });
      sources.push({ where: bundle.url, text: bundle.text });
      const map = /\/\/[#@]\s*sourceMappingURL=(\S+)/.exec(bundle.text);
      if (map) {
        let mapUrl = '';
        try {
          mapUrl = new URL(map[1], bundle.url).toString();
        } catch {
          mapUrl = '';
        }
        push({
          id: 'bundle:sourcemap',
          class: 'leak',
          title: 'Bundle declares a source map',
          severity: 'medium',
          where: mapUrl || bundle.url,
          evidence: clamp(bundle.url, 140) + ' declares sourceMappingURL=' + clamp(map[1], 80) + '.',
          fix: 'Ship maps to your error tracker only (hidden-source-map), and confirm the .map file is not publicly served.'
        });
      }
    } catch {
      // A bundle that will not read contributes no evidence.
    }
  }

  const seen = new Set<string>();
  for (const source of sources) {
    for (const pattern of LEAK_PATTERNS) {
      const match = pattern.rx.exec(source.text);
      if (!match) continue;
      const quoted = String(match[0]).replace(/^["'`(\s]+/, '');
      // The same published literal read in the document and in a bundle is one
      // exposure, not two. A redacted match has no literal to compare, so it is
      // keyed by the file it was read from.
      const key = pattern.redact ? pattern.id + '|' + source.where : pattern.id + '|' + quoted.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      push({
        id: pattern.id + ':' + seen.size,
        class: pattern.class,
        title: pattern.title,
        severity: pattern.severity,
        where: source.where,
        evidence: pattern.redact
          ? 'A string matching the ' + pattern.id.replace(/_/g, ' ') + ' pattern appears in ' + clamp(source.where, 140) + '. The value is deliberately not reproduced.'
          : 'Read in ' + clamp(source.where, 140) + ': "' + clamp(quoted, 120) + '".',
        fix: pattern.fix
      });
    }
  }

  const insecureForms = [...page.text.matchAll(/<form\b[^>]*action\s*=\s*["'](http:\/\/[^"']+)["']/gi)].length;
  if (insecureForms) {
    push({
      id: 'form:plaintext',
      class: 'transport',
      title: 'A form posts over plain http',
      severity: 'high',
      where: page.url,
      evidence: insecureForms + ' form action(s) on ' + page.url + ' point at an http:// destination.',
      fix: 'Point every form action at https; a plaintext post carries its fields in the clear.'
    });
  }

  const sorted = findings.sort(
    (left, right) => (SEVERITY_ORDER[left.severity] ?? 9) - (SEVERITY_ORDER[right.severity] ?? 9)
  );

  const counts = {
    total: sorted.length,
    critical: sorted.filter((item) => item.severity === 'critical').length,
    high: sorted.filter((item) => item.severity === 'high').length,
    medium: sorted.filter((item) => item.severity === 'medium').length,
    low: sorted.filter((item) => item.severity === 'low').length
  };

  return {
    url: page.url,
    status: page.status,
    ttfb_ms: page.ms,
    bytes: page.text.length,
    protocol,
    counts,
    findings: sorted,
    bundles,
    scripts,
    security: {
      hsts: Boolean(header('strict-transport-security')),
      csp: Boolean(header('content-security-policy')),
      nosniff: Boolean(header('x-content-type-options')),
      referrer: Boolean(header('referrer-policy')),
      permissions: Boolean(header('permissions-policy')),
      frame: Boolean(header('x-frame-options')) || /frame-ancestors/i.test(header('content-security-policy'))
    }
  };
}

// The Oracle: the intersection of what the winners publish.
export function buildLeapfrog(audit: any) {
  const rows: any[] = audit.families || [];
  const cluster = rows.filter((row) => (row.holders || []).length >= 2);
  const absent = cluster.filter((row) => row.lead === 0);
  const thin = cluster.filter((row) => row.verdict === 'thin');
  const briefs = new Map<string, any>((audit.briefs || []).map((brief: any) => [brief.family, brief]));

  const golden = [...absent, ...thin].slice(0, 6).map((row) => {
    const brief = briefs.get(row.family);
    return {
      family: row.family,
      intent: row.intent,
      held_by: row.holders,
      winners_paths: row.winners,
      you: row.lead,
      path: brief ? brief.path : '/' + row.family,
      why: brief ? brief.why : 'a family two or more winners publish and the lead does not',
      requirement:
        brief && brief.requirement
          ? brief.requirement
          : 'Publish at least three pages in this family, each carrying the depth the winners already ship, then link them from a page you publish today.',
      evidence: brief ? brief.evidence : row.examples.map((path: string) => 'winner path ' + path).join(', '),
      target_words: brief ? brief.target_words : null,
      schema_to_ship: brief ? brief.schema_to_ship : []
    };
  });

  const coverage = {
    cluster: cluster.length,
    held: cluster.length - absent.length,
    absent: absent.length,
    gap_pct: cluster.length ? Math.round((absent.length / cluster.length) * 100) : 0
  };

  return {
    cluster: cluster.slice(0, 10).map((row) => ({
      family: row.family,
      intent: row.intent,
      held_by: row.holders,
      winners_paths: row.winners,
      you: row.lead,
      verdict: row.lead === 0 ? 'absent' : row.verdict,
      examples: row.examples
    })),
    coverage,
    golden,
    all_three: absent.filter((row) => (row.holders || []).length >= 3).map((row) => row.family),
    schema_gaps: audit.schema_gaps || [],
    note:
      cluster.length === 0
        ? 'No family is shared by two or more winners in this read, so there is no cluster to leapfrog and no void to claim.'
        : 'The dominance cluster is ' + cluster.length + ' famili' + (cluster.length === 1 ? 'y' : 'ies') +
          ' two or more winners publish; the lead holds ' + coverage.held + ' of them and ' + coverage.absent +
          ' not at all.'
  };
}

// Coverage, velocity and authority as measured ratios. Velocity has no time
// series in one read, so structural spread stands in and says so.
export function buildRadar(audit: any) {
  const surfaces = [audit.lead, ...(audit.winners || [])].filter(Boolean);
  const maxPaths = Math.max(...surfaces.map((s: any) => s.paths || 0), 1);
  const maxFamilies = Math.max(...surfaces.map((s: any) => s.families || 0), 1);
  const maxSchema = Math.max(...surfaces.map((s: any) => (s.schema_types || []).length), 1);
  const schemaUnmeasured = surfaces.every((surface: any) => (surface.schema_types || []).length === 0);

  const series = surfaces.map((surface: any, index: number) => ({
    key: 's' + index,
    host: surface.host,
    label: surface.host + (index === 0 ? ' (lead)' : ''),
    is_target: index === 0
  }));

  const row = (axis: string, basis: string, value: (surface: any) => number) => {
    const out: any = { axis, basis };
    surfaces.forEach((surface: any, index: number) => {
      out['s' + index] = Math.min(100, Math.round(value(surface)));
    });
    return out;
  };

  return {
    series,
    rows: [
      row('Coverage', 'indexable paths published to an anonymous reader, relative to the largest surface read', (s) => ((s.paths || 0) / maxPaths) * 100),
      row('Velocity', 'families held, relative to the widest surface read — a structural proxy, since one read carries no time series', (s) => ((s.families || 0) / maxFamilies) * 100),
      row('Authority', schemaUnmeasured ? 'no surface in this read published structured data, so this axis is unmeasured' : 'distinct structured-data types, relative to the richest surface read', (s) => ((s.schema_types || []).length / maxSchema) * 100)
    ],
    verdict:
      'All three axes are ratios against the richest surface in this read, not absolute scores. Velocity measures spread, never speed: run the pass again on a later date to read a delta.'
  };
}

export async function runWarRoom(body: any) {
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

  // The Oracle and the Infiltrator read in parallel: the competitive math and
  // the exposure scan share no state.
  const [audit, scan] = await Promise.all([
    runGapAudit({ lead: target, winners: competitors }),
    scanSurface(target)
  ]);

  const leapfrog = buildLeapfrog(audit);
  const radar = buildRadar(audit);
  const fastestWinner = Math.min(...(audit.winners || []).map((winner: any) => winner.ttfb_ms || Infinity));

  const dna = {
    host: audit.lead.host,
    title: audit.lead.title,
    framework: audit.lead.framework,
    protocol: scan.protocol,
    ttfb_ms: audit.lead.ttfb_ms,
    bytes: audit.lead.bytes,
    paths: audit.lead.paths,
    families: audit.lead.families,
    headings: audit.lead.headings,
    schema_types: audit.lead.schema_types,
    security: scan.security,
    bundles: scan.bundles,
    fastest_competitor_ttfb_ms: Number.isFinite(fastestWinner) ? fastestWinner : null,
    ttfb_gap_ms: Number.isFinite(fastestWinner) ? Math.max(0, (audit.lead.ttfb_ms || 0) - fastestWinner) : null
  };

  const blueprint = {
    target_url: audit.lead.url,
    auth_basis: grant.basis,
    attestation: grant.attestation,
    ran_at: nowIso(),
    symmetry: {
      score: audit.coverage.families_pct,
      families_pct: audit.coverage.families_pct,
      paths_pct: audit.coverage.paths_pct,
      lead_paths: audit.coverage.lead_paths,
      union_paths: audit.coverage.union_paths,
      basis: 'path families the target holds against every family the competitors publish to an anonymous reader'
    },
    dna,
    competitors: (audit.winners || []).map((winner: any) => ({
      url: winner.url,
      host: winner.host,
      title: winner.title,
      framework: winner.framework,
      paths: winner.paths,
      families: winner.families,
      schema_types: winner.schema_types,
      ttfb_ms: winner.ttfb_ms,
      hsts: winner.hsts,
      csp: winner.csp
    })),
    unread: audit.unread || [],
    vulnerabilities: {
      counts: scan.counts,
      findings: scan.findings,
      scanned: { document: scan.url, bundles: scan.bundles.map((bundle: any) => bundle.url), bytes: scan.bytes }
    },
    leapfrog,
    radar,
    agents: WAR_ROOM_AGENTS,
    refusals: WAR_ROOM_REFUSALS,
    limits:
      'Anonymous GET only, one read per surface: the lead document, up to three of its own bundles and its sitemap and navigation, ' +
      'plus up to three competitor homepages. Findings are what a public response shows; nothing is exploited to strengthen one. ' +
      audit.limits
  };

  return blueprint;
}

// The General: only the observations the other two produced, in the order that
// closes exposure before it spends effort on reach.
export function buildRoadmap(input: { blueprint: any }) {
  const blueprint = input.blueprint || {};
  const findings = (blueprint.vulnerabilities && blueprint.vulnerabilities.findings) || [];
  const leapfrog = blueprint.leapfrog || { golden: [], coverage: {} };
  const dna = blueprint.dna || {};

  const exposures = findings
    .filter((finding: any) => finding.severity === 'critical' || finding.severity === 'high')
    .slice(0, 3)
    .map((finding: any, index: number) => ({
      order: index + 1,
      title: finding.title,
      action: finding.fix,
      evidence: finding.evidence,
      where: finding.where,
      severity: finding.severity
    }));

  const build = (leapfrog.golden || []).slice(0, 5).map((item: any, index: number) => ({
    order: index + 1,
    title: item.path,
    family: item.family,
    action: item.requirement,
    evidence: item.evidence,
    held_by: item.held_by,
    metric: item.target_words ? item.target_words + '+ words · ' + (item.schema_to_ship || []).join(' + ') : item.schema_to_ship.join(' + ')
  }));

  const identity: any[] = [];
  if (dna.ttfb_gap_ms !== null && dna.ttfb_gap_ms !== undefined && dna.ttfb_gap_ms > 40) {
    identity.push({
      order: identity.length + 1,
      title: 'Close the ' + dna.ttfb_gap_ms + ' ms TTFB gap',
      action:
        'The fastest winner answers in ' + dna.fastest_competitor_ttfb_ms + ' ms against your ' + dna.ttfb_ms +
        ' ms. Cache the document at the edge and move any blocking call off the render path until the gap is inside 40 ms.',
      evidence: 'homepage TTFB measured once per surface in this pass'
    });
  }
  if ((leapfrog.schema_gaps || []).length) {
    identity.push({
      order: identity.length + 1,
      title: 'Ship the structured data you do not publish',
      action: 'Add ' + leapfrog.schema_gaps.slice(0, 6).join(', ') + ' to the golden-path pages, then validate each block.',
      evidence: 'types the winners publish and your surface does not'
    });
  }
  if (!dna.security || !dna.security.csp || !dna.security.hsts) {
    identity.push({
      order: identity.length + 1,
      title: 'Hold the header baseline',
      action: 'Lock the security headers from week 1 in a regression check so a deploy cannot silently drop them.',
      evidence: 'headers absent in this pass'
    });
  }

  const weeks = [
    {
      key: 'week_1',
      label: 'Week 1 · close the exposure',
      agent: 'The Infiltrator',
      steps: exposures,
      note: exposures.length
        ? encountersNote(exposures.length)
        : 'No critical or high exposure was visible in this read. Nothing to close before you build.'
    },
    {
      key: 'week_2',
      label: 'Week 2 · take the cluster',
      agent: 'The Oracle',
      steps: build,
      note: build.length
        ? 'Each path is a family at least two winners publish and you do not. Build in the order listed: the first families carry the most winner paths.'
        : 'No shared family was missing on this read, so there is no cluster page to claim this cycle.'
    },
    {
      key: 'week_3',
      label: 'Week 3 · hold the edge',
      agent: 'The General',
      steps: identity,
      note: identity.length
        ? 'Identity work only counts once the pages exist: these steps make the new surface faster and more legible than the incumbent.'
        : 'Nothing measurable separated the surfaces on identity in this pass, so week 3 adds no invented work.'
    }
  ];

  return {
    generated_at: nowIso(),
    target_url: blueprint.target_url || '',
    horizon: '21 days',
    weeks,
    verdict:
      'Week 1 removes the exposure a buyer would discover in diligence. Week 2 claims ' + build.length +
      ' famil' + (build.length === 1 ? 'y' : 'ies') + ' two or more winners already prove. Week 3 makes that surface measurable against them.',
    coverage: leapfrog.coverage || {},
    limits: 'Every step above cites a finding from this pass. Nothing here is a projection: run the pass again to measure what changed.'
  };
}

function encountersNote(count: number) {
  return count + ' critical or high exposure(s) visible in a public response. Fix these before the market finds them.';
}