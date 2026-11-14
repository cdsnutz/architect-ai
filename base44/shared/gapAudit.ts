/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Competitive gap analyzer: the read-only half of the pivot.
//
// One lead surface and up to three winner surfaces are read once, anonymously.
// The engine inventories the paths each one publishes (sitemap plus navigation),
// sorts them into intent families, and reports the measured distance between the
// lead and the winners: families it does not hold, keywords two or more winners
// share and it lacks, structured data it never ships, and the depth a winning
// page actually carries. Nothing here ranks, clicks, spoofs or re-serves: the
// output is a map, and every number on it came from a response.

import { assertPublicUrl } from './readOnly.ts';
import { FRAMEWORK_MARKERS } from './readOnly.ts';

const UA = 'Mozilla/5.0 (compatible; RevEngineGapAudit/1.0; public read-only audit)';
const TIMEOUT_MS = 9000;
const BODY_CAP = 250000;
const MAX_PATHS = 200;
const MAX_WINNERS = 3;
const MAX_BRIEFS = 4;
const UNSAFE_PATH = /(logout|sign-?out|delete|destroy|reset|unsubscribe|revoke|cart|checkout|basket|account|login|signin|sign-?up|register|admin)/i;
const ASSET_PATH = /\.(png|jpe?g|gif|svg|webp|avif|ico|css|js|mjs|json|xml|txt|pdf|zip|mp4|webm|woff2?|ttf|eot|map)$/i;

// What kind of search intent a path family serves, in the order a buyer moves.
const INTENTS: { label: string; rx: RegExp; why: string }[] = [
  { label: 'guide', rx: /^(guides?|how-?to|tutorials?|learn|academy|resources?|help)$/i, why: 'task-level intent: the searcher wants the steps, not the pitch' },
  { label: 'comparison', rx: /^(compare|comparisons?|vs|versus|alternatives?|best|top|reviews?|rankings?)$/i, why: 'decision intent: the searcher is choosing between options' },
  { label: 'article', rx: /^(blog|posts?|articles?|news|insights|journal|stories)$/i, why: 'discovery intent: topical coverage that earns the first visit' },
  { label: 'offer', rx: /^(features?|solutions?|use-?cases?|products?|services?|industr(y|ies)|platform|apps?)$/i, why: 'evaluation intent: what the product does for this buyer' },
  { label: 'commercial', rx: /^(pricing|plans?|packages?|quote|demo|trial|contact)$/i, why: 'conversion intent: the page a buyer lands on to commit' },
  { label: 'docs', rx: /^(docs?|documentation|api|developers?|reference|integrations?|changelog)$/i, why: 'technical diligence, and the surface that earns links' },
  { label: 'education', rx: /^(glossary|faq|faqs|answers?|questions?|wiki|dictionary)$/i, why: 'definitional intent: cheap to win, feeds the guide cluster' },
  { label: 'local', rx: /^(locations?|cities|areas?|near|local|regions?)$/i, why: 'geo intent: one page per market the winner already serves' },
  { label: 'proof', rx: /^(case-?studies?|customers?|testimonials?|results?|portfolio|work)$/i, why: 'trust intent: evidence that the outcome already happened' }
];

type Surface = {
  url: string;
  origin: string;
  host: string;
  title: string;
  framework: string[];
  paths: number;
  families: number;
  schema_types: string[];
  words: number;
  headings: number;
  internal_links: number;
  link_density: number;
  scripts: number;
  bytes: number;
  ttfb_ms: number;
  hsts: boolean;
  csp: boolean;
  sitemap_paths: number;
  navigation_paths: number;
  list: string[];
  body: string;
};

async function fetchText(url: string, accept: string) {
  const started = Date.now();
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': UA, Accept: accept, 'Cache-Control': 'no-cache' },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  try {
    assertPublicUrl(res.url);
  } catch {
    throw new Error('the surface redirected off its public origin');
  }
  const body = (await res.text()).slice(0, BODY_CAP);
  return { url: res.url, status: res.status, body, ttfb: Date.now() - started, headers: res.headers };
}

function textOf(body: string) {
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-zA-Z#0-9]{2,8};/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(body: string) {
  return textOf(body).split(' ').filter(Boolean).length;
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

function schemaTypes(body: string): string[] {
  const found = new Set<string>();
  const walk = (node: any, depth: number) => {
    if (!node || depth > 4) return;
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;
    const type = node['@type'];
    if (typeof type === 'string') found.add(type);
    else if (Array.isArray(type)) type.forEach((value) => typeof value === 'string' && found.add(value));
    Object.keys(node).forEach((key) => {
      const value = node[key];
      if (value && typeof value === 'object') walk(value, depth + 1);
    });
  };
  for (const block of body.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(block[1]), 0);
    } catch {
      // An unparsable block is not evidence, so it contributes nothing.
    }
  }
  return [...found].slice(0, 24);
}

function familyOf(path: string) {
  return (path.split('/').filter(Boolean)[0] || '').toLowerCase();
}

function intentOf(family: string) {
  const hit = INTENTS.find((item) => item.rx.test(family));
  return hit ? hit.label : 'page';
}

function intentWhy(intent: string) {
  const hit = INTENTS.find((item) => item.label === intent);
  return hit ? hit.why : 'a surface the winners index and you do not';
}

function leafOf(path: string) {
  const parts = path.split('/').filter(Boolean);
  const leaf = parts[parts.length - 1] || '';
  return leaf
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b(\d{1,2}|page)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function slugOf(text: string) {
  return text.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

async function sitemapPaths(origin: string, robots: string): Promise<string[]> {
  const declared = [...robots.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((match) => match[1]);
  const roots = declared.length ? declared.slice(0, 2) : [origin + '/sitemap.xml'];
  const out: string[] = [];
  for (const root of roots) {
    let xml = '';
    try {
      const page = await fetchText(root, 'application/xml,text/plain,*/*');
      if (page.status === 200) xml = page.body;
    } catch {
      continue;
    }
    if (!xml) continue;
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) => match[1]);
    for (const loc of locs) if (!/\.xml(\?|$)/i.test(loc)) out.push(loc);
    for (const child of locs.filter((loc) => /\.xml(\?|$)/i.test(loc)).slice(0, 2)) {
      try {
        const page = await fetchText(child, 'application/xml,text/plain,*/*');
        if (page.status !== 200) continue;
        for (const match of page.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
          if (!/\.xml(\?|$)/i.test(match[1])) out.push(match[1]);
        }
      } catch {
        // A child sitemap that will not read undercounts the surface; it never invents paths.
      }
    }
  }
  return out;
}

async function auditSurface(url: string): Promise<Surface> {
  const page = await fetchText(url, 'text/html,application/xhtml+xml,*/*');
  if (page.status >= 400) throw new Error('answered HTTP ' + page.status + ', so there is no surface to audit');

  const origin = new URL(page.url).origin;
  const host = new URL(page.url).hostname;

  let robots = '';
  try {
    const jar = await fetchText(origin + '/robots.txt', 'text/plain,*/*');
    if (jar.status === 200) robots = jar.body;
  } catch {
    robots = '';
  }

  const fromSitemap = (await sitemapPaths(origin, robots)).map((loc) => normalizePath(loc, origin)).filter(Boolean);
  const fromNavigation = [...page.body.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => normalizePath(match[1], origin))
    .filter(Boolean);

  const list = [...new Set([...fromSitemap, ...fromNavigation])].slice(0, MAX_PATHS);
  const families = new Set(list.map(familyOf).filter(Boolean));
  const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(page.body);
  const words = wordCount(page.body);
  const framework = FRAMEWORK_MARKERS.filter((marker) => marker.test.test(page.body)).map((marker) => marker.label);

  return {
    url: page.url,
    origin,
    host,
    title: titleMatch ? titleMatch[1].trim().slice(0, 160) : '',
    framework: framework.length ? framework : ['hand-served'],
    paths: list.length,
    families: families.size,
    schema_types: schemaTypes(page.body),
    words,
    headings: (page.body.match(/<h2\b/gi) || []).length,
    internal_links: fromNavigation.length,
    link_density: words ? Math.round((fromNavigation.length / words) * 1000) : 0,
    scripts: (page.body.match(/<script\b/gi) || []).length,
    bytes: page.body.length,
    ttfb_ms: page.ttfb,
    hsts: Boolean(page.headers.get('strict-transport-security')),
    csp: Boolean(page.headers.get('content-security-policy')),
    sitemap_paths: fromSitemap.length,
    navigation_paths: fromNavigation.length,
    list,
    body: page.body
  };
}

function summaryOf(surface: Surface) {
  const { origin, list, body, ...rest } = surface;
  return rest;
}

export async function runGapAudit(input: { lead: string; winners: string[] }) {
  const leadUrl = assertPublicUrl(input.lead);
  const leadOrigin = new URL(leadUrl).origin;
  const candidates = (input.winners || [])
    .map((value) => {
      try {
        return assertPublicUrl(value);
      } catch {
        return '';
      }
    })
    .filter(Boolean);
  const winnerUrls = [...new Set(candidates)].filter((url) => new URL(url).origin !== leadOrigin).slice(0, MAX_WINNERS);
  if (!winnerUrls.length) {
    throw new Error('At least one winner surface is required, on a different origin from the lead.');
  }

  const lead = await auditSurface(leadUrl);
  const unread: { url: string; reason: string }[] = [];
  const settled = await Promise.all(
    winnerUrls.map(async (url) => {
      try {
        return await auditSurface(url);
      } catch (error) {
        unread.push({ url, reason: error && error.message ? error.message : 'no response in the read window' });
        return null;
      }
    })
  );
  const winners = settled.filter(Boolean) as Surface[];
  if (!winners.length) throw new Error('None of the winner surfaces could be read, so there is no map to compare against.');

  const union = new Set<string>();
  winners.forEach((winner) => winner.list.forEach((path) => union.add(path)));
  const exact = [...union].filter((path) => lead.list.includes(path)).length;
  const winnerFamilies = new Set([...union].map(familyOf).filter(Boolean));
  const coveredFamilies = [...winnerFamilies].filter((family) => lead.list.some((path) => familyOf(path) === family));
  const pathsPct = union.size ? Math.round((exact / union.size) * 100) : 0;
  const familiesPct = winnerFamilies.size ? Math.round((coveredFamilies.length / winnerFamilies.size) * 100) : 0;

  const familyRows = new Map<string, { family: string; intent: string; lead: number; winners: number; holders: string[]; examples: string[] }>();
  for (const winner of winners) {
    for (const path of winner.list) {
      const family = familyOf(path);
      if (!family) continue;
      const row = familyRows.get(family) || { family, intent: intentOf(family), lead: 0, winners: 0, holders: [], examples: [] };
      row.winners += 1;
      if (!row.holders.includes(winner.host)) row.holders.push(winner.host);
      if (row.examples.length < 4 && !row.examples.includes(path)) row.examples.push(path);
      familyRows.set(family, row);
    }
  }
  lead.list.forEach((path) => {
    const row = familyRows.get(familyOf(path));
    if (row) row.lead += 1;
  });

  // A family is a map only when it is more than one page: either the winners run
  // several paths in it, or more than one winner publishes in it. A lone /love
  // page is a page, not territory, and listing it would inflate the gap.
  const families = [...familyRows.values()]
    .filter((row) => row.winners >= 2 || row.holders.length >= 2)
    .map((row) => ({
      ...row,
      verdict: row.lead === 0 ? 'absent' : row.winners >= 3 && row.lead * 3 <= row.winners ? 'thin' : 'covered'
    }))
    .sort((left, right) => right.winners - left.winners);

  const voids = families
    .filter((row) => row.verdict !== 'covered')
    .map((row) => ({
      family: row.family,
      intent: row.intent,
      kind: row.verdict,
      you: row.lead,
      winners: row.winners,
      held_by: row.holders,
      examples: row.examples,
      keywords: row.examples.map(leafOf).filter(Boolean).slice(0, 4),
      note:
        row.verdict === 'absent'
          ? 'No path on your surface lives in this family; the winners run ' + row.winners + '.'
          : 'You hold ' + row.lead + ' path here against ' + row.winners + ' on the winner surfaces.'
    }))
    .sort((left, right) => (left.kind === right.kind ? right.winners - left.winners : left.kind === 'absent' ? -1 : 1));

  const leadLeaves = new Set(lead.list.map(leafOf).filter(Boolean));
  const leafOwners = new Map<string, string[]>();
  winners.forEach((winner) => {
    winner.list.forEach((path) => {
      const leaf = leafOf(path);
      if (!leaf || leaf.length < 5 || leaf.split(' ').length < 2) return;
      const owners = leafOwners.get(leaf) || [];
      if (!owners.includes(winner.host)) owners.push(winner.host);
      leafOwners.set(leaf, owners);
    });
  });
  const keywordVoids = [...leafOwners.entries()]
    .filter(([leaf, owners]) => owners.length >= 2 && !leadLeaves.has(leaf))
    .map(([keyword, owners]) => ({ keyword, held_by: owners }))
    .sort((left, right) => right.held_by.length - left.held_by.length)
    .slice(0, 10);

  const winnerSchema = new Set<string>();
  winners.forEach((winner) => winner.schema_types.forEach((type) => winnerSchema.add(type)));
  const schemaGaps = [...winnerSchema].filter((type) => !lead.schema_types.includes(type)).slice(0, 12);

  const briefs = [];
  for (const gap of voids.slice(0, MAX_BRIEFS)) {
    const sample = gap.examples[0] || '';
    const owner = winners.find((winner) => sample && winner.list.includes(sample));
    let measured: any = null;
    if (owner) {
      try {
        const page = await fetchText(owner.origin + sample, 'text/html,application/xhtml+xml,*/*');
        if (page.status < 400) {
          measured = {
            url: owner.origin + sample,
            words: wordCount(page.body),
            headings: (page.body.match(/<h2\b/gi) || []).length,
            schema: schemaTypes(page.body),
            internal_links: (page.body.match(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi) || []).length
          };
        }
      } catch {
        measured = null;
      }
    }
    const keyword = gap.keywords[0] || gap.family;
    const targetWords = measured ? Math.max(600, Math.ceil(measured.words / 100) * 100) : null;
    const ship = measured && measured.schema.length ? measured.schema : ['Article', 'FAQPage'];
    briefs.push({
      path: '/' + gap.family + '/' + (slugOf(keyword) || gap.family),
      family: gap.family,
      intent: gap.intent,
      why: intentWhy(gap.intent),
      keyword,
      evidence: measured
        ? measured.url + ' reads ' + measured.words + ' words, ' + measured.headings + ' subheads, ' +
          (measured.schema.length ? measured.schema.join(' + ') : 'no structured data') + ', ' + measured.internal_links + ' links out.'
        : owner
          ? owner.origin + sample + ' did not answer in the read window, so depth is unmeasured.'
          : 'No winner path in this family could be sampled.',
      target_words: targetWords,
      schema_to_ship: ship,
      requirement:
        'Ship ' + (targetWords ? targetWords + '+ words' : 'complete task coverage') + ', ' + ship.join(' + ') +
        ' structured data, and at least 3 internal links into it from pages you already publish.'
    });
  }

  const absent = voids.filter((gap) => gap.kind === 'absent');
  const topAbsent = absent.slice(0, 3).map((gap) => '/' + gap.family);
  const pitch =
    'Your surface publishes ' + lead.paths + ' indexable paths across ' + lead.families + ' path families. The ' +
    winners.length + ' winner' + (winners.length === 1 ? '' : 's') + ' read here publish ' + union.size + ' across ' +
    winnerFamilies.size + '. You hold ' + familiesPct + '% of those families' +
    (absent.length ? ' and none of ' + absent.length + ' of them at all' + (topAbsent.length ? ' (' + topAbsent.join(', ') + ')' : '') : '') +
    '. You are not losing to a better product; you are losing to a better map.';

  const evidence = [
    'lead · ' + lead.host + ' · ' + lead.paths + ' paths · ' + lead.families + ' families · ' + lead.schema_types.length + ' schema types',
    ...winners.map(
      (winner) => 'winner · ' + winner.host + ' · ' + winner.paths + ' paths · ' + winner.families + ' families · ' + winner.schema_types.length + ' schema types'
    ),
    'shared keyword gaps · ' + keywordVoids.length,
    'structured data you do not ship · ' + (schemaGaps.length ? schemaGaps.join(', ') : 'none observed')
  ];

  const ranAt = new Date().toISOString();
  const caveat =
    'Counts are the paths each surface publishes to an anonymous reader (sitemap plus navigation), read once on ' +
    ranAt.slice(0, 10) + '. A surface that hides paths from both is undercounted here, so the gap is understated rather than invented.' +
    (unread.length ? ' ' + unread.length + ' winner surface(s) could not be read.' : '');

  return {
    ran_at: ranAt,
    coverage: { paths_pct: pathsPct, families_pct: familiesPct, union_paths: union.size, lead_paths: lead.paths },
    lead: summaryOf(lead),
    winners: winners.map(summaryOf),
    unread,
    families: families.slice(0, 14),
    voids: voids.slice(0, 10),
    keyword_voids: keywordVoids,
    schema_gaps: schemaGaps,
    briefs,
    strike: { pitch, evidence, caveat },
    limits:
      'Anonymous GET only: one homepage, robots.txt, sitemap and up to ' + MAX_BRIEFS +
      ' sampled winner pages per run. No ranking data, no clicks, no fingerprint work, nothing re-served.'
  };
}