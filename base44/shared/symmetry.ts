/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Symmetry lane: the authorized-target version of 1:1 virtualization.
//
// This module raises fidelity by *reading* harder, never by re-serving someone
// else's traffic. It builds a trigger-edge dependency graph, predicts assets the
// DOM never links, inventories state keys (names only), and diffs a candidate
// surface against a baseline. Transport interception (the "ghost proxy") stays
// out of contract: nothing here proxies, rewrites or replays a live stream.

import { assertPublicUrl } from './readOnly.ts';
import { latencyModel, markovPlan, readTimings, topologyParity } from './symmetryDims.ts';

const UA = 'Mozilla/5.0 (compatible; RevEngineSymmetry/1.0; authorized-target pass)';
const TIMEOUT_MS = 8000;
const BODY_CAP = 200000;
const MAX_BUNDLES = 2;
const MAX_PROBES = 12;
const MAX_ROUTES = 5;
const UNSAFE_PATH = /(logout|sign-?out|delete|destroy|reset|unsubscribe|revoke|checkout)/i;

export const AUTH_BASES = [
  { key: 'owned', label: 'I own this property' },
  { key: 'written_authorization', label: 'Written authorization on file' },
  { key: 'staging_mirror', label: 'Staging mirror of my own stack' }
];

export type Tag = 'observed' | 'inferred';
export type GraphNode = { id: string; url: string; kind: string; tag: Tag };
export type GraphEdge = { from: string; to: string; trigger: string; tag: Tag };

export function assertAuthorization(basis: unknown, attestation: unknown) {
  const key = typeof basis === 'string' ? basis.trim() : '';
  const entry = AUTH_BASES.find((item) => item.key === key);
  if (!entry) {
    throw new Error('An authorization basis is required: owned, written_authorization or staging_mirror.');
  }
  const note = typeof attestation === 'string' ? attestation.trim() : '';
  if (note.length < 8) {
    throw new Error('Record who authorized this target and for what. The symmetry pass will not run on an unattested target.');
  }
  return { basis: entry.key, label: entry.label, attestation: note.slice(0, 500) };
}

export type Doc = {
  url: string;
  status: number;
  content_type: string;
  bytes: number;
  title: string;
  tag_count: number;
  script_count: number;
  cookie_names: string[];
  headers: Record<string, string>;
  body: string;
};

async function readText(url: string): Promise<string> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': UA, Accept: 'application/javascript,text/javascript,text/css,*/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  try {
    assertPublicUrl(res.url);
  } catch {
    throw new Error('The asset redirected off its authorized public surface.');
  }
  return (await res.text()).slice(0, BODY_CAP);
}

async function readDocument(url: string): Promise<Doc> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*', 'Cache-Control': 'no-cache' },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  try {
    assertPublicUrl(res.url);
  } catch {
    throw new Error('The target redirected off its authorized public surface.');
  }
  const body = (await res.text()).slice(0, BODY_CAP);
  const jar: string[] =
    typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function'
      ? (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : [res.headers.get('set-cookie') || ''];
  const cookieNames = new Set<string>();
  for (const line of jar) {
    const name = String(line || '').split('=')[0].split(';')[0].trim();
    if (name && name.length < 64 && /^[A-Za-z0-9_.-]+$/.test(name)) cookieNames.add(name);
  }
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(body);
  return {
    url,
    status: res.status,
    content_type: (res.headers.get('content-type') || '').split(';')[0],
    bytes: body.length,
    title: title ? title[1].trim().slice(0, 160) : '',
    tag_count: (body.match(/<([a-z][a-z0-9-]*)/gi) || []).length,
    script_count: (body.match(/<script/gi) || []).length,
    cookie_names: [...cookieNames],
    headers: {
      cache_control: res.headers.get('cache-control') || 'none',
      csp: res.headers.get('content-security-policy') || 'none',
      hsts: res.headers.get('strict-transport-security') || 'none',
      vary: res.headers.get('vary') || 'none',
      server: res.headers.get('server') || 'none'
    },
    body
  };
}

function absolute(raw: string, base: string): string {
  try {
    const url = new URL(raw, base);
    url.hash = '';
    if (!/^https?:$/.test(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

const ASSET_TAGS: { kind: string; rx: RegExp }[] = [
  { kind: 'script', rx: /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi },
  { kind: 'stylesheet', rx: /<link\b[^>]*\bhref\s*=\s*["']([^"']+\.css[^"']*)["']/gi },
  { kind: 'image', rx: /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi },
  { kind: 'media', rx: /<(?:video|source|audio)\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi },
  { kind: 'frame', rx: /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi },
  { kind: 'form', rx: /<form\b[^>]*\baction\s*=\s*["']([^"']+)["']/gi },
  { kind: 'link', rx: /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi }
];

// A quoted string that looks like a path an application calls, not a selector.
const LITERAL_RX = /["'`](\/[^"'`\s<>{}\\]{2,180}|https?:\/\/[^"'`\s]{6,180})["'`]/g;

function triggerBefore(text: string, index: number): { trigger: string; tag: Tag } {
  const window = text.slice(Math.max(0, index - 260), index);
  if (/new\s+WebSocket\s*\(/.test(window)) return { trigger: 'socket_open', tag: 'inferred' };
  if (/fetch\s*\(/.test(window)) return { trigger: 'fetch_call', tag: 'inferred' };
  if (/\.open\s*\(|XMLHttpRequest|\$\.ajax/.test(window)) return { trigger: 'xhr_open', tag: 'inferred' };
  if (/import\s*\(/.test(window)) return { trigger: 'lazy_import', tag: 'inferred' };
  const event = /addEventListener\s*\(\s*["']([a-z]+)["']|on(click|submit|input|change|scroll|keyup|load)\b/i.exec(window);
  if (event) return { trigger: 'interaction:' + (event[1] || event[2]).toLowerCase(), tag: 'inferred' };
  return { trigger: 'code_literal', tag: 'inferred' };
}

export function extractGraph(doc: Doc, origin: string, bundles: { url: string; text: string }[] = []) {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const docId = 'document';
  nodes.set(docId, { id: docId, url: doc.url, kind: 'document', tag: 'observed' });

  const pushFrom = (fromId: string, url: string, kind: string, tag: Tag, trigger: string) => {
    if (!url) return;
    const id = kind + ':' + url;
    if (!nodes.has(id)) nodes.set(id, { id, url, kind, tag });
    edges.push({ from: fromId, to: id, trigger, tag });
  };

  const push = (url: string, kind: string, tag: Tag, trigger: string) => pushFrom(docId, url, kind, tag, trigger);

  for (const tag of ASSET_TAGS) {
    for (const match of doc.body.matchAll(tag.rx)) {
      push(absolute(match[1], doc.url), tag.kind, 'observed', tag.kind === 'link' ? 'document_link' : 'document_tag');
    }
  }

  // Inline code: literal paths and the call site that would fire them. A bundle
  // owns the endpoints it calls, so the edge runs from that script, not the document.
  const inline = (doc.body.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || []).join('\n');
  const codeSources = [
    { from: docId, text: inline },
    ...bundles.map((bundle) => ({ from: 'script:' + bundle.url, text: bundle.text }))
  ];
  for (const source of codeSources) {
    if (!source.text) continue;
    for (const match of source.text.matchAll(LITERAL_RX)) {
      const resolved = absolute(match[1], doc.url);
      if (!resolved) continue;
      if (/\.(png|jpe?g|gif|svg|webp|woff2?|ttf|ico)(\?|$)/i.test(resolved)) continue;
      const at = match.index || 0;
      const { trigger, tag } = triggerBefore(source.text, at);
      // A bare fragment quoted in a bundle ("/i", "/core-js") is not an asset.
      // Keep it only when the path has real shape or a call site fires it.
      let path = '';
      try {
        path = new URL(resolved).pathname;
      } catch {
        continue;
      }
      const shaped = /\.[a-z0-9]{2,5}(\?|$)/i.test(path) || path.split('/').filter(Boolean).length >= 2 || resolved.includes('?');
      const called = ['fetch_call', 'xhr_open', 'socket_open', 'lazy_import'].includes(trigger);
      const last = path.split('/').filter(Boolean).pop() || '';
      const prose = /^(licen[cs]e|readme|changelog|notice|authors|contributing|core-js|index)$/i.test(last);
      if (prose || last.length < 3) continue;
      if (!shaped && !called) continue;
      pushFrom(source.from, resolved, 'endpoint', tag, trigger);
    }
  }

  const list = [...nodes.values()];
  const external = [...new Set(list.filter((node) => !node.url.startsWith(origin)).map((node) => new URL(node.url).hostname))];
  const triggers: Record<string, number> = {};
  edges.forEach((edge) => {
    triggers[edge.trigger] = (triggers[edge.trigger] || 0) + 1;
  });

  // Navigation links are kept, but as their own bounded class: a page with 500
  // anchors must not crowd out the assets and call-site edges the graph is for.
  const resources = list.filter((node) => node.kind !== 'link');
  const links = list.filter((node) => node.kind === 'link');
  const resourceEdges = edges.filter((edge) => edge.trigger !== 'document_link');
  const linkEdges = edges.filter((edge) => edge.trigger === 'document_link');

  return {
    nodes: [...resources.slice(0, 90), ...links.slice(0, 25)],
    edges: [...resourceEdges.slice(0, 140), ...linkEdges.slice(0, 25)],
    counts: {
      nodes: list.length,
      edges: edges.length,
      resources: resources.length,
      navigation: links.length,
      navigation_edges: linkEdges.length,
      resource_edges: resourceEdges.length,
      observed: edges.filter((edge) => edge.tag === 'observed').length,
      inferred: edges.filter((edge) => edge.tag === 'inferred').length,
      external_hosts: external.length
    },
    triggers,
    external_hosts: external.slice(0, 12)
  };
}

type Cluster = {
  pattern: string;
  dir: string;
  prefix: string;
  ext: string;
  width: number;
  known: number[];
  predicted: string[];
  confirmed: string[];
  gated: string[];
  rejected: string[];
};

function buildClusters(nodes: GraphNode[], origin: string): Cluster[] {
  const groups = new Map<string, Cluster>();
  for (const node of nodes) {
    if (!node.url.startsWith(origin)) continue;
    let path = '';
    try {
      path = new URL(node.url).pathname;
    } catch {
      continue;
    }
    const match = /^(.*?\/)?([A-Za-z0-9_.-]*?)(\d{1,6})(\.[a-z0-9]{2,5})$/.exec(path);
    if (!match) continue;
    const dir = match[1] || '/';
    const prefix = match[2];
    const digits = match[3];
    const ext = match[4];
    const key = dir + '|' + prefix + '|' + digits.length + '|' + ext;
    const found = groups.get(key);
    if (found) {
      found.known.push(Number(digits));
    } else {
      groups.set(key, {
        pattern: dir + prefix + '#' + ext,
        dir,
        prefix,
        ext,
        width: digits.length,
        known: [Number(digits)],
        predicted: [],
        confirmed: [],
        gated: [],
        rejected: []
      });
    }
  }
  return [...groups.values()].filter((cluster) => cluster.known.length >= 2);
}

function predictFor(cluster: Cluster): string[] {
  const known = [...new Set(cluster.known)].sort((a, b) => a - b);
  const min = known[0];
  const max = known[known.length - 1];
  const missing: number[] = [];
  for (let i = min; i <= max && missing.length < 6; i += 1) {
    if (!known.includes(i)) missing.push(i);
  }
  const tail = [max + 1, max + 2].filter((value) => !known.includes(value));
  return [...missing, ...tail]
    .slice(0, 6)
    .map((value) => String(value).padStart(cluster.width, '0'));
}

async function probeAsset(url: string) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const type = (res.headers.get('content-type') || '').split(';')[0];
    if (res.status === 405 || res.status === 501) {
      const ranged = await fetch(url, {
        headers: { 'User-Agent': UA, Range: 'bytes=0-0' },
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      return { status: ranged.status, type: (ranged.headers.get('content-type') || '').split(';')[0] };
    }
    return { status: res.status, type };
  } catch {
    return { status: 0, type: '' };
  }
}

export async function predictAssets(nodes: GraphNode[], origin: string) {
  const clusters = buildClusters(nodes, origin).slice(0, 6);
  let budget = MAX_PROBES;
  for (const cluster of clusters) {
    cluster.predicted = predictFor(cluster);
    for (const suffix of cluster.predicted) {
      if (budget <= 0) break;
      budget -= 1;
      const url = origin + cluster.dir + cluster.prefix + suffix + cluster.ext;
      const hit = await probeAsset(url);
      if (hit.status === 200) cluster.confirmed.push(url);
      else if (hit.status === 401 || hit.status === 403) cluster.gated.push(url);
      else cluster.rejected.push(url);
    }
  }
  const confirmed = clusters.reduce((sum, cluster) => sum + cluster.confirmed.length, 0);
  const probed = clusters.reduce((sum, cluster) => sum + cluster.predicted.length, 0);
  return {
    clusters,
    probed,
    confirmed,
    note: probed
      ? confirmed + ' of ' + probed + ' predicted siblings answered 200. Predictions are inferences until the response confirms them.'
      : 'No indexed asset family had enough members to predict a gap, so nothing was probed.'
  };
}

export function readState(doc: Doc, code: string) {
  const local = new Set<string>();
  const session = new Set<string>();
  const literal = (source: string, bucket: Set<string>) => {
    for (const match of source.matchAll(/\b(?:localStorage|sessionStorage)\s*\.\s*(?:getItem|setItem|removeItem)\s*\(\s*["']([^"']{1,80})["']/g)) {
      bucket.add(match[1]);
    }
    for (const match of source.matchAll(/\b(?:localStorage|sessionStorage)\s*\.\s*([A-Za-z_$][\w$]{1,60})\b/g)) {
      if (!['getItem', 'setItem', 'removeItem', 'clear', 'key', 'length'].includes(match[1])) bucket.add(match[1]);
    }
  };
  literal(doc.body, local);
  literal(code, local);
  for (const match of code.matchAll(/\bsessionStorage\s*\.\s*(?:getItem|setItem)\s*\(\s*["']([^"']{1,80})["']/g)) {
    session.add(match[1]);
  }
  for (const match of doc.body.matchAll(/\bsessionStorage\s*\.\s*(?:getItem|setItem)\s*\(\s*["']([^"']{1,80})["']/g)) {
    session.add(match[1]);
  }
  const localKeys = [...local].slice(0, 40);
  const sessionKeys = [...session].slice(0, 40);
  const total = doc.cookie_names.length + localKeys.length + sessionKeys.length;
  return {
    cookie_names: doc.cookie_names.slice(0, 40),
    local_keys: localKeys,
    session_keys: sessionKeys,
    total,
    note: total
      ? 'Key names only. Values are never read, stored or replayed: state symmetry is reproduced in your own deployment, never injected into a stranger\'s origin.'
      : 'No cookie or storage key is visible from an anonymous read, so this surface needs an authorized test session to reach state parity.'
  };
}

async function headStatus(url: string): Promise<number> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    return res.status;
  } catch {
    return 0;
  }
}

export type DiffRow = { key: string; baseline: string; candidate: string; verdict: 'match' | 'drift' | 'missing' };

function rowOf(key: string, baseline: string, candidate: string): DiffRow {
  let verdict: DiffRow['verdict'] = 'match';
  if (baseline !== candidate) verdict = candidate === 'none' || candidate === '0' || candidate === '' ? 'missing' : 'drift';
  return { key, baseline, candidate, verdict };
}

export async function diffSurfaces(baseline: Doc, candidateUrl: string, preloaded?: Doc) {
  const candidate = preloaded || (await readDocument(candidateUrl));
  const rows: DiffRow[] = [
    rowOf('http status', String(baseline.status), String(candidate.status)),
    rowOf('content type', baseline.content_type || 'none', candidate.content_type || 'none'),
    rowOf('title', baseline.title || 'none', candidate.title || 'none'),
    rowOf('document bytes', String(baseline.bytes), String(candidate.bytes)),
    rowOf('element tags', String(baseline.tag_count), String(candidate.tag_count)),
    rowOf('script tags', String(baseline.script_count), String(candidate.script_count)),
    rowOf('content-security-policy', baseline.headers.csp, candidate.headers.csp),
    rowOf('strict-transport-security', baseline.headers.hsts, candidate.headers.hsts),
    rowOf('cache-control', baseline.headers.cache_control, candidate.headers.cache_control)
  ];

  const baseOrigin = new URL(baseline.url).origin;
  const paths = new Set<string>();
  for (const match of baseline.body.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
    const resolved = absolute(match[1], baseline.url);
    if (!resolved || !resolved.startsWith(baseOrigin)) continue;
    const path = new URL(resolved).pathname;
    if (UNSAFE_PATH.test(path) || paths.size >= MAX_ROUTES) continue;
    paths.add(path);
  }
  const candidateOrigin = new URL(candidate.url).origin;
  const routes: { path: string; baseline: number; candidate: number; verdict: string }[] = [];
  for (const path of paths) {
    const [left, right] = await Promise.all([headStatus(baseOrigin + path), headStatus(candidateOrigin + path)]);
    const verdict = left === right ? 'match' : left === 0 || right === 0 ? 'unreachable' : 'drift';
    routes.push({ path, baseline: left, candidate: right, verdict });
  }

  const matched = rows.filter((row) => row.verdict === 'match').length + routes.filter((route) => route.verdict === 'match').length;
  const total = rows.length + routes.length;
  return {
    candidate_url: candidate.url,
    rows,
    routes,
    matched,
    total,
    verdict: total === 0 ? 'no evidence' : matched === total ? 'parity' : matched / total >= 0.8 ? 'near parity' : 'drift',
    note: 'Both surfaces were read with the same anonymous GET; the diff compares what each one serves, never a proxied stream.'
  };
}

export function scoreFidelity(input: {
  graph: any;
  entropy: any;
  state: any;
  diff: any;
  latency?: any;
  isomorphism?: any;
}) {
  const { graph, entropy, state, diff, latency, isomorphism } = input;
  const components: { name: string; weight: number; earned: number; note: string }[] = [];

  const assets = graph.counts.resources !== undefined ? graph.counts.resources : graph.counts.nodes;
  components.push({
    name: 'assets observed in the document',
    weight: 20,
    earned: Math.min(20, assets * 2),
    note: assets + ' resource' + (assets === 1 ? '' : 's') + ' named by the served HTML'
  });

  // Navigation links are excluded here: they are reachability, not dependency.
  const navigationEdges = graph.counts.navigation_edges || 0;
  const dependencyEdges = Math.max(0, graph.counts.observed - navigationEdges);
  const edges = dependencyEdges + graph.counts.inferred * 0.6;
  components.push({
    name: 'trigger edges',
    weight: 20,
    earned: Math.round(Math.min(20, edges * 1.6)),
    note:
      dependencyEdges + ' observed · ' + graph.counts.inferred + ' inferred from call sites · ' +
      navigationEdges + ' navigation links set aside'
  });

  components.push({
    name: 'entropy recovery',
    weight: 15,
    earned: Math.min(15, entropy.confirmed * 3),
    note: entropy.probed + ' siblings predicted, ' + entropy.confirmed + ' confirmed by response'
  });

  components.push({
    name: 'state inventory',
    weight: 10,
    earned: state.total ? 10 : 0,
    note: state.total + ' state key name' + (state.total === 1 ? '' : 's') + ' inventoried'
  });

  components.push({
    name: 'candidate parity',
    weight: 10,
    earned: diff ? Math.round((diff.matched / Math.max(1, diff.total)) * 10) : 0,
    note: diff ? diff.matched + ' of ' + diff.total + ' compared signals match' : 'no candidate surface supplied'
  });

  components.push({
    name: 'temporal signature',
    weight: 10,
    earned: latency && latency.samples >= 3 ? (latency.signature === 'tight' ? 10 : 6) : latency && latency.samples ? 4 : 0,
    note: latency && latency.target
      ? latency.samples + ' time-to-first-byte samples · ±' + latency.target.jitter + ' ms · ' + latency.signature
      : 'no timing sample came back'
  });

  components.push({
    name: 'structural parity',
    weight: 15,
    earned: isomorphism ? Math.round((isomorphism.score * 15) / 100) : 0,
    note: isomorphism ? isomorphism.verdict + ' at ' + isomorphism.score + '%' : 'no candidate surface to compare shape against'
  });

  const score = components.reduce((sum, part) => sum + part.earned, 0);
  const level = score >= 80 ? 'L3' : score >= 55 ? 'L2+' : 'L2';
  return {
    score,
    level,
    components,
    ceiling:
      'This lane stops at L3. L4 transport interception is out of contract: a proxy that re-serves another origin and injects captured state is not a fidelity upgrade, it is credential handling and content re-hosting. State parity is rebuilt in your own deployment instead.'
  };
}

// Document order of first appearance: the walk the transition model is built on.
function walkOf(graph: any): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  const push = (id: string) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    order.push(id);
  };
  push('document');
  for (const edge of graph.edges || []) {
    if (edge.trigger === 'document_link') continue;
    push(edge.to);
  }
  return order.slice(0, 120);
}

export async function runSymmetryPass(input: { target: string; candidate?: string }) {
  const target = assertPublicUrl(input.target);
  const origin = new URL(target).origin;
  const doc = await readDocument(target);
  if (doc.status >= 400) {
    throw new Error('The target answered HTTP ' + doc.status + ', so there is no surface to map.');
  }

  const bundleUrls = extractGraph(doc, origin).nodes
    .filter((node) => node.kind === 'script' && node.url.startsWith(origin) && !/\.map(\?|$)/i.test(node.url))
    .map((node) => node.url)
    .slice(0, MAX_BUNDLES);

  const bundles = await Promise.all(
    bundleUrls.map(async (url) => {
      try {
        return { url, text: await readText(url) };
      } catch {
        return { url, text: '' };
      }
    })
  );
  const code = bundles.map((bundle) => bundle.text).filter(Boolean).join('\n');

  const graph = extractGraph(doc, origin, bundles);
  const entropy = await predictAssets(graph.nodes, origin);
  const state = readState(doc, code);

  const candidateDoc = input.candidate ? await readDocument(input.candidate) : null;
  const candidateGraph = candidateDoc ? extractGraph(candidateDoc, new URL(candidateDoc.url).origin) : null;
  const diff = candidateDoc ? await diffSurfaces(doc, candidateDoc.url, candidateDoc) : null;
  const isomorphism = topologyParity(graph, candidateGraph);
  const markov = markovPlan([walkOf(graph)], graph.nodes, graph.edges);
  const latency = latencyModel(await readTimings(target, UA));

  const fidelity = scoreFidelity({ graph, entropy, state, diff, latency, isomorphism });

  return {
    target_url: target,
    graph,
    entropy,
    state,
    diff,
    isomorphism,
    markov,
    latency,
    fidelity,
    notes:
      'Read-only authorized pass: ' + graph.counts.nodes + ' nodes, ' + graph.counts.edges + ' edges, ' +
      entropy.confirmed + ' entropy hits, ' + latency.samples + ' timing samples, ' + markov.plan.length +
      ' prefetch candidates' + (isomorphism ? ', structural parity ' + isomorphism.score + '%' : '') +
      '. Documents trimmed to ' + BODY_CAP + ' bytes; no form submitted, no credential sent, nothing re-served.'
  };
}