/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Command intelligence: three readings over one bounded anonymous read.
//
// 1. Gravity map — the internal link graph of each surface, so a page is scored
//    by how much of the site's own linking is routed into it, not by how it looks.
// 2. Cognitive load — the decision density of one document: how many different
//    destinations, calls to action and form fields compete for a single reader,
//    and how far the attention splits across families.
// 3. Agility index — the same money paths read again later and compared by a text
//    digest, so a copy change is a measured event with a date, not an impression.
//
// Two of the five commanded modules are refused here and say why: watching XHR
// needs an authenticated session against a third-party origin, and external
// sentiment needs sources no authorization in this lab covers.

import { assertPublicUrl } from './readOnly.ts';
import { assertAuthorization } from './symmetry.ts';

const UA = 'Mozilla/5.0 (compatible; RevEngineCommand/1.0; authorized read-only audit)';
const TIMEOUT_MS = 9000;
const MAX_BYTES = 220000;
const MAX_PAGES = 6;
const MAX_COMPETITORS = 3;
const MAX_DIGESTS = 8;
const MIN_AGILITY_DAYS = 1;

const MONEY = /(^|\/)(pricing|prices?|plans?|checkout|cart|signup|sign-up|register|trial|demo|contact|book|buy|quote|get-started|start-free)(\/|$)/i;
const ASSET = /\.(png|jpe?g|gif|svg|webp|avif|ico|css|js|mjs|json|xml|txt|pdf|zip|mp4|webm|woff2?|ttf|eot|map)$/i;
const UNSAFE = /(logout|sign-?out|delete|destroy|reset|unsubscribe|revoke|account|login|signin|admin)/i;
const CTA = /\b(get started|start (?:free|now|building|for free)|try (?:it )?free|free trial|book (?:a )?(?:demo|call)|request (?:a )?(?:demo|access|quote)|contact (?:sales|us)|talk to (?:us|sales)|buy now|subscribe|sign ?up|create (?:an )?account|see (?:the )?pricing|view (?:plans|pricing)|compare plans|add to cart|deploy (?:now|free))\b/i;

const LOAD_FORMULA =
  'decisions x 2 + calls to action x 5 + form fields x 1.5 + attention entropy in bits x 6, capped at 100';

export const COMMAND_REFUSALS = [
  {
    key: 'Shadow_API_Watch',
    reach: 'refused',
    detail:
      'Watching XHR and fetch traffic needs a live authenticated session against a third-party origin. This lab reads published documents only, so undocumented endpoints are not claimed here. What the served bundles declare can still be read in the Mirror reversal stage.'
  },
  {
    key: 'Externality_Scrape',
    reach: 'refused',
    detail:
      'Reddit, X, TrustPilot and G2 are not read. No authorization in this lab covers them, and a complaint pulled without one is not evidence this engine will present as a complaint.'
  },
  {
    key: 'Churn_Without_Interval',
    reach: 'refused',
    detail:
      'Agility needs two dated digests at least a day apart. A pass against a snapshot minutes old is recorded as a baseline rather than sold as instability.'
  }
];

function nowIso() {
  return new Date().toISOString();
}

function isMoney(path: string): boolean {
  return MONEY.test(path);
}

function familyOf(path: string): string {
  return (path.split('/').filter(Boolean)[0] || 'root').toLowerCase();
}

function hash32(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}

function normalizeText(html: string): string {
  return String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePath(raw: string, origin: string): string {
  const value = String(raw || '').trim();
  if (!value || value.startsWith('#') || /^(mailto:|tel:|javascript:|data:)/i.test(value)) return '';
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return '';
    const path = url.pathname.replace(/\/{2,}/g, '/');
    if (path === '/' || path.length > 180) return '';
    if (ASSET.test(path) || UNSAFE.test(path)) return '';
    return path.replace(/\/$/, '');
  } catch {
    return '';
  }
}

function attr(attributes: string, name: string): string {
  const match = new RegExp(name + '\\s*=\\s*["\']([^"\']*)["\']', 'i').exec(attributes);
  return match ? match[1].trim() : '';
}

function extract(html: string, origin: string) {
  const links: string[] = [];
  let ctas = 0;

  [...html.matchAll(/<a\b([^>]*)>([\s\S]{0,300}?)<\/a>/gi)].forEach((match) => {
    const href = attr(match[1] || '', 'href');
    const path = normalizePath(href, origin);
    if (path) links.push(path);
    // A sign-up control that points at an app subdomain still competes for the
    // reader's decision, so a call to action is counted whatever its origin.
    if (href && !/^(mailto:|tel:|javascript:|#)/i.test(href) && CTA.test(normalizeText(match[2] || ''))) {
      ctas += 1;
    }
  });

  const buttonLabels = [...html.matchAll(/<button\b[^>]*>([\s\S]{0,200}?)<\/button>/gi)]
    .map((match) => normalizeText(match[1] || '').slice(0, 80))
    .filter(Boolean);
  buttonLabels.forEach((label) => {
    if (CTA.test(label)) ctas += 1;
  });

  const title = (() => {
    const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
    return match ? normalizeText(match[1]).slice(0, 160) : '';
  })();

  const text = normalizeText(html);

  return {
    title,
    links: [...new Set(links)],
    link_count: links.length,
    ctas,
    buttons: buttonLabels.length,
    fields: (html.match(/<(input|select|textarea)\b/gi) || []).length,
    words: text ? text.split(/\s+/).length : 0,
    digest: 'h' + hash32(text.slice(0, 6000))
  };
}

async function fetchPage(url: string) {
  const started = Date.now();
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  // redirect:'follow' can land anywhere: the surface parsed has to be public.
  assertPublicUrl(response.url);
  const text = (await response.text()).slice(0, MAX_BYTES);
  return { url: response.url, status: response.status, text, ms: Date.now() - started };
}

async function readSurface(url: string, role: string) {
  const home = await fetchPage(url);
  if (home.status >= 400) throw new Error('answered HTTP ' + home.status + ', so there is no surface to read');

  const origin = new URL(home.url).origin;
  const host = new URL(home.url).hostname;
  const homeInfo = extract(home.text, origin);

  // Money paths are read before anything else: they are where the gravity
  // question is actually answered.
  const queue = homeInfo.links
    .filter((path) => path !== '/')
    .sort((left, right) => Number(isMoney(right)) - Number(isMoney(left)))
    .slice(0, MAX_PAGES - 1);

  const pages: any[] = [
    { path: '/', ...homeInfo, status: home.status, bytes: home.text.length, ttfb_ms: home.ms }
  ];

  const reads = await Promise.allSettled(
    queue.map(async (path) => {
      const page = await fetchPage(origin + path);
      return { path, page };
    })
  );

  reads.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    const { path, page } = result.value;
    if (page.status >= 400) return;
    pages.push({ path, ...extract(page.text, origin), status: page.status, bytes: page.text.length, ttfb_ms: page.ms });
  });

  return { url: home.url, origin, host, role, pages, ttfb_ms: home.ms, security: home.status };
}

// ── 1. Gravity map ───────────────────────────────────────────────────────────
function buildGravity(pages: any[]) {
  const inbound = new Map<string, Set<string>>();
  let links = 0;

  pages.forEach((page) => {
    page.links.forEach((target: string) => {
      if (target === page.path) return;
      links += 1;
      if (!inbound.has(target)) inbound.set(target, new Set());
      (inbound.get(target) as Set<string>).add(page.path);
    });
  });

  const outDegree = new Map<string, number>(pages.map((page) => [page.path, page.links.length]));

  const all = [...inbound.entries()]
    .map(([path, sources]) => ({
      path,
      inbound: sources.size,
      share: links ? Math.round((sources.size / links) * 1000) / 10 : 0,
      money: isMoney(path),
      out_degree: outDegree.has(path) ? (outDegree.get(path) as number) : null
    }))
    .map((row) => ({
      ...row,
      kind: row.money ? 'sink' : row.out_degree !== null && row.out_degree >= 3 ? 'hub' : 'leaf'
    }))
    .sort((left, right) => right.inbound - left.inbound);

  // The money share is measured over every link seen, not over the shortlist:
  // a pricing link that is merely low-ranked still carries traffic.
  const moneyRows = all.filter((row) => row.money);
  const moneyInbound = moneyRows.reduce((sum, row) => sum + row.inbound, 0);
  const rows = all.slice(0, 8);
  if (moneyRows.length && !rows.some((row) => row.money)) rows.push(moneyRows[0]);

  return {
    rows,
    links,
    money_inbound: moneyInbound,
    money_share: links ? Math.round((moneyInbound / links) * 1000) / 10 : 0
  };
}

function buildFunnel(pages: any[]) {
  const graph = new Map<string, string[]>();
  pages.forEach((page) => graph.set(page.path, page.links.filter((link: string) => link !== page.path)));

  const seen = new Set<string>(['/']);
  const queue: { path: string; trail: string[] }[] = [{ path: '/', trail: ['/'] }];

  while (queue.length) {
    const node = queue.shift() as { path: string; trail: string[] };
    if (node.path !== '/' && isMoney(node.path)) {
      return { found: true, depth: node.trail.length - 1, trail: node.trail };
    }
    for (const next of graph.get(node.path) || []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push({ path: next, trail: [...node.trail, next] });
    }
  }

  return { found: false, depth: null, trail: [] };
}

function buildGravityModule(surfaces: any[]) {
  const rows = surfaces.map((surface) => {
    const gravity = buildGravity(surface.pages);
    const funnel = buildFunnel(surface.pages);
    const top = gravity.rows[0];
    const moneyTop = gravity.rows.find((row) => row.money);

    return {
      host: surface.host,
      role: surface.role,
      pages_crawled: surface.pages.length,
      links: gravity.links,
      money_share: gravity.money_share,
      gravity: gravity.rows,
      funnel,
      note: top
        ? surface.host + ' routes ' + gravity.money_share + '% of its internal links into a money path' +
          (moneyTop ? ' (' + moneyTop.path + ' takes ' + moneyTop.share + '% alone)' : '') +
          (funnel.found
            ? '; the shortest route from the entry page to a conversion page is ' + funnel.trail.join(' → ') + '.'
            : '; no conversion path is reachable inside the pages this pass crawled.')
        : 'No internal link was found on the pages read, so this surface has no gravity to map.'
    };
  });

  const winner = rows
    .filter((row) => row.role === 'winner')
    .sort((left, right) => right.money_share - left.money_share)[0];
  const lead = rows.find((row) => row.role === 'lead');

  return {
    rows,
    note: winner && lead
      ? winner.host + ' points ' + winner.money_share + '% of its internal links at a conversion page against ' +
        lead.money_share + '% for ' + lead.host + '. That is the flow to re-engineer, not the page to copy.'
      : 'Gravity is reported per surface; a lead and a winner are needed to read the delta.',
    limits:
      'Inbound counts come from the links on the pages this pass actually read, capped at ' + MAX_PAGES +
      ' pages per surface with money paths read first. A link that exists only on an uncrawled page is not counted.'
  };
}

// ── 2. Cognitive load ────────────────────────────────────────────────────────
function entropyBits(links: string[]): number {
  if (!links.length) return 0;
  const families = new Map<string, number>();
  links.forEach((path) => {
    const family = familyOf(path);
    families.set(family, (families.get(family) || 0) + 1);
  });
  let bits = 0;
  for (const count of families.values()) {
    const share = count / links.length;
    bits -= share * Math.log2(share);
  }
  return Math.round(bits * 100) / 100;
}

function loadIndex(row: { decisions: number; ctas: number; fields: number; entropy_bits: number }) {
  const raw = row.decisions * 2 + row.ctas * 5 + row.fields * 1.5 + row.entropy_bits * 6;
  return Math.min(100, Math.round(raw));
}

function buildCognitiveModule(surfaces: any[]) {
  const rows = surfaces.map((surface) => {
    const home = surface.pages[0];
    const base = {
      host: surface.host,
      role: surface.role,
      page: '/',
      title: home.title,
      decisions: home.links.length,
      ctas: home.ctas,
      fields: home.fields,
      words: home.words,
      entropy_bits: entropyBits(home.links)
    };
    return { ...base, load: loadIndex(base) };
  });

  const lead = rows.find((row) => row.role === 'lead');
  const winners = rows.filter((row) => row.role === 'winner').sort((left, right) => left.load - right.load);
  const best = winners[0];

  return {
    rows,
    formula: LOAD_FORMULA,
    note: lead && best
      ? lead.host + ' asks one reader to choose between ' + lead.decisions + ' destinations and ' + lead.ctas +
        ' calls to action (' + lead.load + ') against ' + best.decisions + ' and ' + best.ctas + ' for ' + best.host +
        ' (' + best.load + '). The gap is measurable friction, not taste.'
      : 'Load is reported per surface; a lead and a winner are needed to read the gap.',
    limits:
      'Counted from the served entry document only: distinct internal link destinations, anchors and buttons whose text matches a known action phrase, form fields, and the Shannon entropy of link families. Nothing below the fold or after hydration is claimed.'
  };
}

// ── 3. Agility index ─────────────────────────────────────────────────────────
function digestMap(snapshot: any): Map<string, string> {
  const pages = Array.isArray(snapshot && snapshot.pages) ? snapshot.pages : [];
  return new Map(pages.map((page: any) => [page.path, page.digest || '']));
}

function buildAgilityModule(surfaces: any[], history: Record<string, any[]>) {
  const rows = surfaces.map((surface) => {
    const list = (history[surface.host] || [])
      .slice()
      .sort((left: any, right: any) => new Date(left.captured_at).getTime() - new Date(right.captured_at).getTime());

    if (list.length < 2) {
      return {
        host: surface.host,
        role: surface.role,
        state: 'baseline',
        snapshots: list.length,
        span_days: 0,
        churn_per_pass: null,
        money_paths: [],
        note:
          'First digest for this host, so there is no churn to read yet. The next pass compares against it path by path.'
      };
    }

    const first = new Date(list[0].captured_at).getTime();
    const last = new Date(list[list.length - 1].captured_at).getTime();
    const spanDays = Math.round(((last - first) / 86400000) * 10) / 10;

    if (spanDays < MIN_AGILITY_DAYS) {
      return {
        host: surface.host,
        role: surface.role,
        state: 'interval_short',
        snapshots: list.length,
        span_days: spanDays,
        churn_per_pass: null,
        money_paths: [],
        note:
          'The digests for this host span ' + spanDays + ' day(s), so churn is recorded without a verdict: pacing needs at least a day between reads.'
      };
    }

    const changes = new Map<string, { path: string; changes: number; last_change_at: string }>();
    let churn = 0;

    for (let index = 1; index < list.length; index += 1) {
      const before = digestMap(list[index - 1]);
      const after = digestMap(list[index]);
      const paths = new Set<string>([...before.keys(), ...after.keys()]);
      paths.forEach((path) => {
        const was = before.get(path) || '';
        const now = after.get(path) || '';
        if (was === now) return;
        churn += 1;
        const entry = changes.get(path) || { path, changes: 0, last_change_at: list[index].captured_at };
        entry.changes += 1;
        entry.last_change_at = list[index].captured_at;
        changes.set(path, entry);
      });
    }

    const passes = list.length - 1;
    const churnPerPass = Math.round((churn / passes) * 100) / 100;
    const moneyPaths = [...changes.values()]
      .filter((entry) => isMoney(entry.path))
      .sort((left, right) => right.changes - left.changes)
      .slice(0, 6);
    const unstable = moneyPaths.some((entry) => entry.changes >= 2);
    const state = unstable ? 'unstable' : churnPerPass >= 6 ? 'active' : 'stable';

    return {
      host: surface.host,
      role: surface.role,
      state,
      snapshots: list.length,
      span_days: spanDays,
      churn_per_pass: churnPerPass,
      money_paths: moneyPaths,
      note: unstable
        ? surface.host + ' rewrote a money path ' + moneyPaths[0].changes + ' time(s) in ' + spanDays +
          ' day(s) (' + moneyPaths[0].path + ', last ' + String(moneyPaths[0].last_change_at).slice(0, 10) +
          '). That is an unresolved message, and it is the window to strike in.'
        : churnPerPass >= 6
          ? surface.host + ' changed ' + churnPerPass + ' page(s) per pass across ' + spanDays + ' day(s): active, and every change is dated.'
          : surface.host + ' held its structure across ' + list.length + ' digest(s) over ' + spanDays + ' day(s).'
    };
  });

  const unstable = rows.filter((row) => row.state === 'unstable');

  return {
    rows,
    note: unstable.length
      ? unstable[0].note
      : rows.every((row) => row.state === 'baseline')
        ? 'Every surface in this pass is a first digest, so agility is a baseline only. The churn reads on the next pass.'
        : 'No money path was rewritten between digests on any surface read.',
    limits:
      'A digest is a hash of the first 6,000 characters of visible text per crawled page. A change means the text changed, not that the strategy did; a digest difference carries the date it was observed and nothing more.'
  };
}

export async function runMarketIntel(input: { base44: any; body: any }) {
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

  const reads = await Promise.allSettled([readSurface(target, 'lead'), ...competitors.map((url) => readSurface(url, 'winner'))]);
  const surfaces = reads.filter((result) => result.status === 'fulfilled').map((result: any) => result.value);
  const unread = reads
    .map((result, index) => ({ result, url: index === 0 ? target : competitors[index - 1] }))
    .filter((entry) => entry.result.status === 'rejected')
    .map((entry) => ({
      url: entry.url,
      reason: entry.result.reason && entry.result.reason.message ? entry.result.reason.message : 'no response'
    }));

  if (!surfaces.length) throw new Error('No surface could be read, so there is no intelligence to compile.');

  const lead = surfaces.find((surface: any) => surface.role === 'lead');
  if (!lead) throw new Error('The target surface could not be read.');

  // History is read before this pass writes its own digests.
  const historyPairs = await Promise.all(
    surfaces.map(async (surface: any) => {
      try {
        const page = await base44.entities.SurfaceDigest.filter(
          { host: surface.host },
          { sort: '-captured_at', limit: MAX_DIGESTS }
        );
        return [surface.host, page.items || []];
      } catch (error: any) {
        console.log('marketIntel: digest history unavailable for ' + surface.host + ' — ' + (error && error.message));
        return [surface.host, []];
      }
    })
  );
  const history: Record<string, any[]> = Object.fromEntries(historyPairs);

  const gravity = buildGravityModule(surfaces);
  const cognitive = buildCognitiveModule(surfaces);
  const agility = buildAgilityModule(surfaces, history);

  const capturedAt = nowIso();
  try {
    await base44.entities.SurfaceDigest.bulkCreate(
      surfaces.map((surface: any) => ({
        host: surface.host,
        url: surface.url,
        role: surface.role,
        captured_at: capturedAt,
        total_pages: surface.pages.length,
        pages: surface.pages.map((page: any) => ({
          path: page.path,
          title: page.title,
          digest: page.digest,
          status: page.status,
          words: page.words
        }))
      }))
    );
  } catch (error: any) {
    console.log('marketIntel: digests not saved — ' + (error && error.message));
  }

  return {
    target_url: lead.url,
    auth_basis: grant.basis,
    attestation: grant.attestation,
    ran_at: capturedAt,
    surfaces: surfaces.map((surface: any) => ({
      url: surface.url,
      host: surface.host,
      role: surface.role,
      pages: surface.pages.length,
      ttfb_ms: surface.ttfb_ms
    })),
    unread,
    gravity,
    cognitive,
    agility,
    refusals: COMMAND_REFUSALS,
    limits:
      'Anonymous GET only: the entry page plus up to ' + (MAX_PAGES - 1) + ' same-origin pages per surface, money paths first, ' +
      MAX_COMPETITORS + ' competitors per pass. Nothing is authenticated, submitted, inlined or re-served.'
  };
}