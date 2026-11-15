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

import { assertPublicUrl, safeFetch } from './readOnly.ts';
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
  { label: 'article', rx: /^(blog|posts?|articles?|news|insights|journal)$/i, why: 'discovery intent: topical coverage that earns the first visit' },
  { label: 'offer', rx: /^(features?|solutions?|use-?cases?|products?|services?|industr(y|ies)|platform|apps?)$/i, why: 'evaluation intent: what the product does for this buyer' },
  { label: 'commercial', rx: /^(pricing|plans?|packages?|quote|demo|trial|contact)$/i, why: 'conversion intent: the page a buyer lands on to commit' },
  { label: 'docs', rx: /^(docs?|documentation|api|developers?|reference|integrations?|changelog)$/i, why: 'technical diligence, and the surface that earns links' },
  { label: 'education', rx: /^(glossary|faq|faqs|answers?|questions?|wiki|dictionary)$/i, why: 'definitional intent: cheap to win, feeds the guide cluster' },
  { label: 'local', rx: /^(locations?|cities|areas?|near|local|regions?)$/i, why: 'geo intent: one page per market the winner already serves' },
  { label: 'proof', rx: /^(case-?studies?|customers?|testimonials?|results?|portfolio|work|stories)$/i, why: 'trust intent: evidence that the outcome already happened' }
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
  const res = await safeFetch(url, {
    method: 'GET',
    headers: { 'User-Agent': UA, Accept: accept, 'Cache-Control': 'no-cache' },
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

// Filing scaffolding: a category, tag or author archive is the cabinet the pages sit
// in, not a surface a buyer wants. Counting those as territory invented gaps that
// nobody would ever ship a page to close.
const SCAFFOLD = /^(category|categories|tag|tags|author|authors|archive|archives|page)$/i;

function tokensOf(segment: string): string[] {
  return segment.toLowerCase().split(/[-_.]+/).filter(Boolean);
}

// A path's intent, read from its own segments, leaf first: the leaf names the page,
// the section names the shelf. Matching tokens as well as whole segments is what lets
// /resources/best-factoring-software read as a comparison rather than a generic
// resource, and what makes /solutions/factoring and /products/factoring the same
// territory under two filing habits. Only a path whose own segments say nothing about
// intent falls back to 'page'.
function intentOfPath(path: string): string {
  const segments = path.split('/').filter(Boolean).map((segment) => segment.toLowerCase());
  if (!segments.length) return 'page';
  if (segments.some((segment) => SCAFFOLD.test(segment))) return 'archive';
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    const direct = INTENTS.find((item) => item.rx.test(segment));
    if (direct) return direct.label;
    for (const token of tokensOf(segment)) {
      const hit = INTENTS.find((item) => item.rx.test(token));
      if (hit) return hit.label;
    }
  }
  return 'page';
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
  const pathsPct = union.size ? Math.round((exact / union.size) * 100) : 0;

  // The measure is intent, not URL text. Comparing first segments reported a gap where
  // only the taxonomy differed: a lead filing offers under /solutions and a winner under
  // /products published the same territory and scored as absent. Intent is now read from
  // each path independently, so the same intent counts as served wherever it is filed.
  const leadIntents = new Set(lead.list.map(intentOfPath).filter((intent) => intent !== 'archive'));
  // The denominator is the scored rows below, not every intent a winner mentions:
  // an intent a winner serves with a single page is a page, not territory, and it
  // must not count in the number while the map refuses to list it.

  type IntentRow = { intent: string; lead: number; winners: number; holders: string[]; examples: string[]; yours: string[] };
  const intentRows = new Map<string, IntentRow>();
  const rowFor = (intent: string): IntentRow => {
    const row = intentRows.get(intent) || { intent, lead: 0, winners: 0, holders: [], examples: [], yours: [] };
    intentRows.set(intent, row);
    return row;
  };

  for (const winner of winners) {
    for (const path of winner.list) {
      const intent = intentOfPath(path);
      if (intent === 'archive') continue;
      const row = rowFor(intent);
      row.winners += 1;
      if (!row.holders.includes(winner.host)) row.holders.push(winner.host);
      if (row.examples.length < 4 && !row.examples.includes(path)) row.examples.push(path);
    }
  }
  lead.list.forEach((path) => {
    const intent = intentOfPath(path);
    if (intent === 'archive') return;
    const row = rowFor(intent);
    row.lead += 1;
    if (row.yours.length < 4 && !row.yours.includes(path)) row.yours.push(path);
  });

  // An intent is a map only when it is more than one page: a single winner page is a
  // page, not territory, and listing it would inflate the gap.
  const intents = [...intentRows.values()]
    .filter((row) => row.winners >= 2)
    .map((row) => ({
      ...row,
      why: intentWhy(row.intent),
      verdict: row.lead === 0 ? 'absent' : row.winners >= 3 && row.lead * 3 <= row.winners ? 'thin' : 'covered'
    }))
    .sort((left, right) => right.winners - left.winners);

  // Scored on the same rows the map shows, so the percentage and the list agree.
  const winnerIntents = intents.map((row) => row.intent);
  const coveredIntents = intents.filter((row) => row.lead > 0).map((row) => row.intent);
  const intentsPct = winnerIntents.length ? Math.round((coveredIntents.length / winnerIntents.length) * 100) : 0;

  const voids = intents
    .filter((row) => row.verdict !== 'covered')
    .map((row) => ({
      intent: row.intent,
      why: row.why,
      kind: row.verdict,
      you: row.lead,
      winners: row.winners,
      held_by: row.holders,
      examples: row.examples,
      yours: row.yours,
      keywords: row.examples.map(leafOf).filter(Boolean).slice(0, 4),
      note:
        row.verdict === 'absent'
          ? 'Nothing you publish serves ' + row.intent + ' intent; the winners publish ' + row.winners + ' paths in it.'
          : 'You publish ' + row.lead + ' path(s) in ' + row.intent + ' intent against ' + row.winners +
            ' on the winner surfaces, so this intent is served thinly rather than not at all.'
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
    const keyword = gap.keywords[0] || gap.intent;
    const targetWords = measured ? Math.max(600, Math.ceil(measured.words / 100) * 100) : null;
    const ship = measured && measured.schema.length ? measured.schema : ['Article', 'FAQPage'];
    briefs.push({
      path: '/' + (slugOf(gap.intent) || 'page') + '/' + (slugOf(keyword) || gap.intent),
      intent: gap.intent,
      why: gap.why || intentWhy(gap.intent),
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
  const thin = voids.filter((gap) => gap.kind === 'thin');
  const topAbsent = absent.slice(0, 3).map((gap) => gap.intent);
  const topThin = thin.slice(0, 3).map((gap) => gap.intent);

  // Architecture, not a percentage. Width is how much a surface publishes; focus is
  // how much of it sits in an intent family the market already serves with more than
  // one page. Both are counts from the same read, so neither can drift from the map.
  const scored = new Set(winnerIntents);
  const leadScored = lead.list.filter((path) => scored.has(intentOfPath(path))).length;
  const loose = lead.list.filter((path) => {
    const intent = intentOfPath(path);
    return intent !== 'archive' && !scored.has(intent);
  });
  const widest = winners.reduce((max, winner) => Math.max(max, winner.paths), 0);
  const widthText = lead.paths + ' paths against ' + winners.map((winner) => winner.host + ' ' + winner.paths).join(' and ');
  const thinnest = intents
    .filter((row) => row.lead > 0 && row.lead < row.winners)
    .map((row) => ({ intent: row.intent, you: row.lead, winners: row.winners }));
  const focusPct = lead.paths ? Math.round((leadScored / lead.paths) * 100) : 0;

  // A surface that publishes more paths than the read window holds is measured as a
  // sample, and the record has to say so. Two truncated surfaces compared to each
  // other describes the cap, not the market, so the cap leads the verdict instead of
  // trailing it in the limits.
  const truncated = [lead, ...winners].filter((surface) => surface.paths >= MAX_PATHS).map((surface) => surface.host);
  const capNote = truncated.length
    ? 'Read capped at ' + MAX_PATHS + ' paths per surface and ' + truncated.join(' and ') +
      ' reached the cap, so every count below is a sample of a larger surface, not a total. '
    : '';

  const architecture = {
    lead_paths: lead.paths,
    widest_winner_paths: widest,
    width_ratio: widest ? Math.round((lead.paths / widest) * 100) / 100 : null,
    winner_paths: winners.map((winner) => ({ host: winner.host, paths: winner.paths })),
    sample: { cap: MAX_PATHS, truncated, complete: !truncated.length },
    focus_pct: focusPct,
    scored_paths: leadScored,
    loose_paths: loose.length,
    loose_examples: loose.slice(0, 4),
    thinnest,
    drift: {
      absent: topAbsent,
      thin: topThin,
      winner_only: winnerIntents.filter((intent) => !leadIntents.has(intent)),
      lead_only: [...leadIntents].filter((intent) => !scored.has(intent))
    },
    // Paths in a family no winner serves with more than one page. This is the one
    // part of the map where the lead may already be ahead, so it is stated as an
    // unmatched hold rather than sold as drift.
    unmatched: {
      intents: [...leadIntents].filter((intent) => !scored.has(intent)),
      paths: loose.length,
      examples: loose.slice(0, 4)
    },
    // The sentence the claim is built from. It names width first and territory second,
    // because a path count that carries no intent is not a finding, it is a number.
    verdict: absent.length
      ? 'Your map publishes ' + widthText + ', ' +
        (lead.paths >= widest ? 'the widest surface in this read' : 'wider than the market on this read') +
        ', and still reaches nothing in ' + absent.length + ' intent famil' + (absent.length === 1 ? 'y' : 'ies') +
        ' the winners serve with more than one page (' + topAbsent.join(', ') + '), so the distance is structural drift, not path count.'
      : 'Your map publishes ' + widthText + (lead.paths >= widest ? ', the widest surface in this read' : '') +
        '. Every intent family the winners serve with more than one page is present on yours, so this is not a coverage gap: ' +
        leadScored + ' of your ' + lead.paths + ' paths (' + focusPct + '%) sit in territory the winners also serve' +
        (thinnest.length
          ? ', and the only thin spots are ' + thinnest.map((row) => row.intent + ' at ' + row.you + ' against ' + row.winners).join(' and ')
          : ', with no family thinner than the winners on this read') +
        '.' +
        (loose.length
          ? ' The ' + loose.length + ' paths no winner matches sit in ' + [...leadIntents].filter((intent) => !scored.has(intent)).join(', ') +
            ', which is the one place this surface leads instead of trailing.'
          : '')
  };
  if (capNote) architecture.verdict = capNote + architecture.verdict;

  // The strike leads with the architecture and carries the path overlap as support.
  // No percentage heads the claim: a ratio invites a method argument before the
  // finding has been read, and the finding here does not need one.
  const pitch =
    architecture.verdict + ' ' + exact + ' of their ' + union.size + ' paths exist verbatim on yours, so the ' +
    (absent.length || thin.length ? 'drift is in which families you built, not how many pages you publish.' : 'naming differs even where the territory does not.');

  const evidence = [
    'lead · ' + lead.host + ' · ' + lead.paths + ' paths · ' + leadIntents.size + ' intents · ' + lead.schema_types.length + ' schema types',
    ...winners.map((winner) => {
      const served = new Set(winner.list.map(intentOfPath).filter((intent) => intent !== 'archive'));
      return 'winner · ' + winner.host + ' · ' + winner.paths + ' paths · ' + served.size + ' intents · ' + winner.schema_types.length + ' schema types';
    }),
    'intents served by the winners · ' + winnerIntents.length + ' · served by the lead · ' + coveredIntents.length,
    'width · you ' + lead.paths + ' paths · ' + winners.map((winner) => winner.host + ' ' + winner.paths).join(' · '),
    'focus · ' + leadScored + ' of your ' + lead.paths + ' paths (' + focusPct + '%) sit in intents the winners also serve · ' + loose.length + ' in no shared family',
    'shared keyword gaps · ' + keywordVoids.length,
    'structured data you do not ship · ' + (schemaGaps.length ? schemaGaps.join(', ') : 'none observed')
  ];

  const ranAt = new Date().toISOString();
  const caveat =
    'Counts are the paths each surface publishes to an anonymous reader (sitemap plus navigation), read once on ' +
    ranAt.slice(0, 10) + '. Intent is classified from each path on its own, leaf segment first, so an intent both ' +
    'surfaces file under different sections still counts as served, and an archive index (category, tag, author) counts as neither. ' +
    'A surface that hides paths from both is undercounted here, so the gap is understated rather than invented.' +
    (unread.length ? ' ' + unread.length + ' winner surface(s) could not be read.' : '');

  return {
    ran_at: ranAt,
    coverage: {
      intents_pct: intentsPct,
      intents_held: coveredIntents.length,
      winner_intents: winnerIntents.length,
      paths_pct: pathsPct,
      union_paths: union.size,
      lead_paths: lead.paths
    },
    architecture,
    lead: summaryOf(lead),
    winners: winners.map(summaryOf),
    unread,
    intents: intents.slice(0, 14),
    voids: voids.slice(0, 10),
    keyword_voids: keywordVoids,
    schema_gaps: schemaGaps,
    briefs,
    strike: { pitch, evidence, caveat },
    limits:
      'Anonymous GET only: one homepage, robots.txt, sitemap and up to ' + MAX_BRIEFS +
      ' sampled winner pages per run. Intent is inferred from path naming alone, so a page filed under a misleading slug is ' +
      'classified by what its URL says rather than by what it contains. No ranking data, no clicks, nothing re-served.'
  };
}