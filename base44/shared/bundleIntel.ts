/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Bundle reversal. A minified webpack/vite bundle is treated as the binary it
// is: the manifest is the symbol table, the chunk graph is the call graph, and
// the reading mode switches to pattern matching when the payload is obfuscated.
// Everything here is a static read of files the target already publishes. No
// payload is evaluated and no obfuscated string is decoded.

const UA = 'REVENGINE-SovereignMirror/1.0 (+authorized read-only pass)';
const MANIFEST_CAP = 300000;
const MANIFEST_CANDIDATES = ['/.vite/manifest.json', '/asset-manifest.json', '/manifest.json', '/build-manifest.json'];

const LITERAL_ROUTE = /["'`](\/(?:api|v[0-9]|graphql|rest|rpc|internal|admin)\/[A-Za-z0-9_\-./{}$:]{1,80})["'`]/g;
const PATTERN_ROUTES = [
  { key: 'quoted path', rx: /["'`](\/[A-Za-z0-9_\-./{}$:]{3,80})["'`]/g },
  { key: 'endpoint segment', rx: /["'`]([A-Za-z0-9_\-./{}$:]*\/(?:api|v\d|graphql|rest|rpc)\/[A-Za-z0-9_\-./{}$:]{1,80})["'`]/g },
  { key: 'storage key', rx: /(?:localStorage|sessionStorage)\.(?:get|set|remove)Item\(\s*["'`]([^"'`]{2,60})["'`]/g }
];
const FRAMEWORK = /\b(react|vue|svelte|angular|next|nuxt|remix|astro|ember|jquery|backbone)[@/.\-]?([0-9][\w.]*)?/gi;

async function getText(url: string) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: '*/*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(9000)
    });
    if (!res.ok) return '';
    const type = res.headers.get('content-type') || '';
    if (!/json|javascript|text/i.test(type)) return '';
    return (await res.text()).slice(0, MANIFEST_CAP);
  } catch {
    return '';
  }
}

// A bundle that hides its identifiers cannot be read literally, so the reader
// states how obfuscated it is and falls back to patterns the compiler cannot
// scramble away: quoted paths, storage keys, decoder markers.
export function detectObfuscation(text: string) {
  if (!text) return { score: 0, mode: 'literal', markers: [] as string[] };
  const sample = text.slice(0, 200000);
  const markers: string[] = [];
  let score = 0;

  const hexNames = (sample.match(/_0x[0-9a-f]{2,}/gi) || []).length;
  if (hexNames > 20) {
    markers.push(hexNames + ' hex-named identifiers');
    score += 45;
  }
  const escaped = (sample.match(/\\x[0-9a-f]{2}/gi) || []).length;
  if (escaped > 50) {
    markers.push(escaped + ' escaped byte sequences');
    score += 20;
  }
  const blobs = (sample.match(/["'][A-Za-z0-9+/=]{80,}["']/g) || []).length;
  if (blobs > 0) {
    markers.push(blobs + ' encoded string blob(s)');
    score += 20;
  }
  if (/\beval\s*\(/.test(sample)) {
    markers.push('eval call site');
    score += 8;
  }
  if (/\batob\s*\(/.test(sample)) {
    markers.push('atob decoder');
    score += 10;
  }
  const words = sample.match(/[A-Za-z]{6,}/g) || [];
  const density = words.join('').length / Math.max(1, sample.length);
  if (density < 0.25) {
    markers.push('sparse readable words');
    score += 15;
  }

  score = Math.min(100, score);
  return { score, mode: score >= 40 ? 'pattern' : 'literal', markers };
}

function parseManifest(url: string, text: string) {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  const values = Object.values(data) as any[];
  const looksVite = values.some(
    (value) => value && typeof value === 'object' && typeof value.file === 'string' && ('isEntry' in value || 'dynamicImports' in value || 'imports' in value)
  );

  if (looksVite) {
    const files = values.filter((value) => value.file).map((value) => value.file as string);
    const entries = values.filter((value) => value.isEntry).length;
    const eager = values.flatMap((value) => (value.imports || []).map((to: string) => ({ from: value.file, to })));
    const lazy = values.flatMap((value) => (value.dynamicImports || []).map((to: string) => ({ from: value.file, to })));
    const css = values.reduce((sum, value) => sum + (value.css ? value.css.length : 0), 0);
    const referenced = new Set([...eager, ...lazy].map((edge) => edge.to));
    const orphans = files.filter((file) => !referenced.has(file) && !values.some((value) => value.file === file && value.isEntry));
    return {
      kind: 'vite',
      url,
      entries,
      chunks: files.length,
      css,
      eager: eager.length,
      dynamic: lazy.length,
      orphans: orphans.slice(0, 6),
      edges: [...eager, ...lazy].slice(0, 24),
      note:
        'Vite manifest read as the symbol table: ' + files.length + ' chunk(s), ' + entries + ' entry point(s), ' +
        eager.length + ' eager import(s), ' + lazy.length + ' lazy import(s), ' + css + ' stylesheet(s) linked.'
    };
  }

  if (data.files || data.entrypoints || data.namedChunkGroups || data.chunks) {
    const files = Object.keys(data.files || {});
    const groups = Object.keys(data.namedChunkGroups || {});
    const chunks = Array.isArray(data.chunks) ? data.chunks : [];
    return {
      kind: 'webpack',
      url,
      entries: (data.entrypoints || []).length || groups.length,
      chunks: files.length || chunks.length,
      css: files.filter((file) => file.endsWith('.css')).length,
      eager: files.length,
      dynamic: groups.length,
      orphans: [] as string[],
      edges: groups.slice(0, 24).map((group) => ({ from: 'entrypoint', to: group })),
      note:
        'Webpack asset manifest read as the symbol table: ' + (files.length || chunks.length) + ' asset(s), ' +
        ((data.entrypoints || []).length || groups.length) + ' chunk group(s) declared.'
    };
  }

  return null;
}

async function readManifests(origin: string) {
  const found: any[] = [];
  const texts = await Promise.all(MANIFEST_CANDIDATES.map((path) => getText(origin + path)));
  texts.forEach((text, index) => {
    if (!text) return;
    const parsed = parseManifest(origin + MANIFEST_CANDIDATES[index], text);
    if (parsed) found.push(parsed);
  });
  return {
    manifest: found[0] || null,
    candidates: found.length,
    note: found.length
      ? found[0].note
      : 'No build manifest was published at the usual paths, so chunk mapping falls back to the script tags the document requested.'
  };
}

export async function readBundleIntelligence(origin: string, scriptUrls: string[], limit: number, cap: number) {
  const manifests = await readManifests(origin);
  const targets = scriptUrls.slice(0, limit);
  const texts = await Promise.all(
    targets.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': UA, Accept: '*/*' },
          redirect: 'follow',
          signal: AbortSignal.timeout(9000)
        });
        if (!res.ok) return { url, text: '' };
        return { url, text: (await res.text()).slice(0, cap) };
      } catch {
        return { url, text: '' };
      }
    })
  );

  const routes = new Set<string>();
  const storageKeys = new Set<string>();
  const frameworks = new Set<string>();
  const bundles: any[] = [];
  let patternMode = false;

  for (const bundle of texts) {
    if (!bundle.text) continue;
    const obfuscation = detectObfuscation(bundle.text);
    if (obfuscation.mode === 'pattern') patternMode = true;
    const read: string[] = [];

    if (obfuscation.mode === 'literal') {
      for (const match of bundle.text.matchAll(LITERAL_ROUTE)) {
        if (routes.size >= 80) break;
        routes.add(match[1]);
        read.push(match[1]);
      }
    } else {
      for (const pattern of PATTERN_ROUTES) {
        for (const match of bundle.text.matchAll(pattern.rx)) {
          if (routes.size >= 80 && pattern.key !== 'storage key') break;
          if (pattern.key === 'storage key') {
            if (storageKeys.size < 20) storageKeys.add(match[1]);
          } else if (routes.size < 80) {
            routes.add(match[1]);
            read.push(match[1]);
          }
        }
      }
    }

    for (const match of bundle.text.matchAll(FRAMEWORK)) {
      if (frameworks.size >= 12) break;
      frameworks.add((match[1] + (match[2] ? ' ' + match[2] : '')).toLowerCase().trim());
    }

    bundles.push({
      url: bundle.url,
      bytes: bundle.text.length,
      mode: obfuscation.mode,
      obfuscation,
      routes: read.slice(0, 30)
    });
  }

  const mode = patternMode ? 'pattern' : 'literal';
  return {
    bundles,
    manifest: manifests.manifest,
    manifests_seen: manifests.candidates,
    routes: [...routes],
    storage_keys: [...storageKeys],
    frameworks: [...frameworks],
    mode,
    note: bundles.length
      ? routes.size + ' route/endpoint candidate(s) recovered from ' + bundles.length + ' public bundle(s) in ' +
        mode + ' mode' + (manifests.manifest ? ', with the ' + manifests.manifest.kind + ' manifest mapped to ' + manifests.manifest.chunks + ' chunk(s)' : '') +
        '. This is what the bundle names, not what the server proves it serves.'
      : 'No same-origin bundle could be read, so the bundle graph stays unobserved.',
    manifest_note: manifests.note
  };
}