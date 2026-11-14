/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Bundle-declared endpoints. A public bundle is static text the target ships
// to every browser, so reading it is a read of published code, not of traffic.
// Nothing here is executed, decoded or replayed, and every endpoint carries the
// grade the capture can actually prove instead of an assumed one.

import { assertPublicUrl, safeFetch } from './readOnly.ts';
import { detectObfuscation } from './bundleIntel.ts';

const UA = 'REVENGINE-Honesty/1.0 (+authorized read-only pass)';
const BUNDLE_CAP = 350000;
const MAX_BUNDLES = 6;
const MAX_ENDPOINTS = 60;

const PATH_LITERAL = /["'`](\/(?:api|v[0-9]+|graphql|gql|rest|rpc|internal|admin|debug|__)[A-Za-z0-9_\-./{}$:~%]{0,110})["'`]/g;
const ABSOLUTE_URL = /\bhttps?:\/\/([A-Za-z0-9.\-]+\.[A-Za-z]{2,})(?::[0-9]{2,5})?(\/[A-Za-z0-9_\-./{}$:~%]{0,110})?/g;
const BARE_ENV = /([a-z0-9\-]*(?:staging|stage|dev|test|qa|uat|preprod|preview|sandbox|localhost)[a-z0-9.\-]*\.[a-z]{2,})(\/[A-Za-z0-9_\-./]{0,80})?/gi;
const ENV_LABEL = /(^|[.\-])(staging|stage|dev|develop|test|qa|uat|preprod|preview|sandbox|localhost|internal|corp)([.\-]|$)/i;
const NOISE = /(w3\.org|schema\.org|jsdelivr|unpkg\.com|gstatic|googleapis|google-analytics|googletagmanager|cloudflare|sentry\.io|github\.com|githubusercontent|npmjs|mozilla\.org|reactjs\.org|vercel\.com|fonts\.|favicon)/i;
const FRAMEWORK = /\b(react|vue|svelte|angular|next|nuxt|remix|astro|ember|jquery|backbone)[@/.\-]?([0-9][\w.]*)?/gi;

function baseDomain(host: string) {
  const parts = host.split('.').filter(Boolean);
  return parts.length <= 2 ? host : parts.slice(-2).join('.');
}

function normalize(path: string) {
  let value = (path || '').split('?')[0].split('#')[0].trim();
  if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1);
  return value;
}

function familyOf(path: string) {
  return path.split('/').filter(Boolean).slice(0, 2).join('/');
}

function kindOf(path: string) {
  if (/graphql|gql/i.test(path)) return 'graphql';
  if (/\/(admin|internal|debug|__)\//i.test(path + '/')) return 'privileged';
  return 'api';
}

// A version prefix is the signal: v1 and v2 declared for the same root means
// the older contract is still shipped to every browser.
function versioned(path: string) {
  const segments = path.split('/').filter(Boolean);
  const index = segments.findIndex((segment) => /^v[0-9]+$/i.test(segment));
  if (index < 0) return null;
  return {
    version: segments[index].toLowerCase(),
    root: '/' + segments.slice(0, index).concat(segments.slice(index + 1, index + 2)).join('/')
  };
}

async function readBundle(url: string) {
  try {
    const res = await safeFetch(url, {
      headers: { 'User-Agent': UA, Accept: '*/*' },
      signal: AbortSignal.timeout(9000)
    });
    // A redirect can leave the public surface; refuse to read what it landed on.
    try {
      assertPublicUrl(res.url);
    } catch {
      return { url, text: '', bytes: 0 };
    }
    if (!res.ok) return { url, text: '', bytes: 0 };
    const text = (await res.text()).slice(0, BUNDLE_CAP);
    return { url, text, bytes: text.length };
  } catch {
    return { url, text: '', bytes: 0 };
  }
}

export async function mapDeclaredEndpoints(input: {
  origin: string;
  host: string;
  scriptUrls: string[];
  observed?: string[];
}) {
  const targets = [...new Set(input.scriptUrls || [])].slice(0, MAX_BUNDLES);
  const bundles = (await Promise.all(targets.map(readBundle))).filter((bundle) => bundle.text);

  // A path is "referenced" only when the surface capture itself points at its
  // family. Everything else is dormant, however plausible it looks.
  const observedFamilies = new Set((input.observed || []).map(familyOf).filter(Boolean));
  const leadBase = baseDomain(input.host);

  const endpoints = new Map<string, any>();
  const leaks = new Map<string, any>();
  const frameworks = new Set<string>();
  let mode = 'literal';
  let obfuscationScore = 0;

  const add = (entry: any) => {
    if (endpoints.size >= MAX_ENDPOINTS || endpoints.has(entry.path)) return;
    endpoints.set(entry.path, entry);
  };

  for (const bundle of bundles) {
    const read = detectObfuscation(bundle.text);
    if (read.mode === 'pattern') mode = 'pattern';
    obfuscationScore = Math.max(obfuscationScore, read.score);

    for (const match of bundle.text.matchAll(FRAMEWORK)) {
      if (frameworks.size < 8) frameworks.add((match[1] + (match[2] ? ' ' + match[2] : '')).toLowerCase().trim());
    }

    for (const match of bundle.text.matchAll(PATH_LITERAL)) {
      const path = normalize(match[1]);
      if (path.length < 4) continue;
      add({
        path,
        host: input.host,
        kind: kindOf(path),
        grade: observedFamilies.has(familyOf(path)) ? 'referenced' : 'dormant',
        bundle: bundle.url,
        evidence: 'path literal'
      });
    }

    for (const match of bundle.text.matchAll(ABSOLUTE_URL)) {
      const host = match[1].toLowerCase();
      if (NOISE.test(host)) continue;
      const related = baseDomain(host) === leadBase;
      const envLike = ENV_LABEL.test(host);
      if (!related && !envLike) continue;
      const path = normalize(match[2] || '/');

      if (host === input.host) {
        add({
          path,
          host,
          kind: kindOf(path),
          grade: observedFamilies.has(familyOf(path)) ? 'referenced' : 'dormant',
          bundle: bundle.url,
          evidence: 'absolute url'
        });
        continue;
      }
      leaks.set(host + path, {
        host,
        path,
        url: 'https://' + host + path,
        severity: envLike ? 'environment' : 'subdomain',
        bundle: bundle.url
      });
    }

    for (const match of bundle.text.matchAll(BARE_ENV)) {
      const host = match[1].toLowerCase();
      if (NOISE.test(host) || host === input.host) continue;
      if (baseDomain(host) !== leadBase && !host.includes('localhost')) continue;
      const path = normalize(match[2] || '/');
      leaks.set(host + path, {
        host,
        path,
        url: (host.includes('localhost') ? 'http://' : 'https://') + host + path,
        severity: 'environment',
        bundle: bundle.url
      });
    }
  }

  const list = [...endpoints.values()];
  const leakList = [...leaks.values()].slice(0, 20);

  const byRoot = new Map<string, { versions: Set<string>; examples: string[] }>();
  for (const entry of list) {
    const parsed = versioned(entry.path);
    if (!parsed) continue;
    if (!byRoot.has(parsed.root)) byRoot.set(parsed.root, { versions: new Set(), examples: [] });
    const bucket = byRoot.get(parsed.root) as { versions: Set<string>; examples: string[] };
    bucket.versions.add(parsed.version);
    if (bucket.examples.length < 4) bucket.examples.push(entry.path);
  }
  const versions = [...byRoot.entries()]
    .filter(([, bucket]) => bucket.versions.size > 1)
    .map(([root, bucket]) => {
      const sorted = [...bucket.versions].sort();
      return {
        root,
        versions: sorted,
        examples: bucket.examples,
        note: sorted.join(' and ') + ' are both declared for ' + root + ', so every browser still receives the older contract.'
      };
    })
    .slice(0, 8);

  const counts = {
    total: list.length,
    referenced: list.filter((entry) => entry.grade === 'referenced').length,
    dormant: list.filter((entry) => entry.grade === 'dormant').length,
    internal: leakList.length,
    bundles: bundles.length,
    chars: bundles.reduce((sum, bundle) => sum + bundle.bytes, 0)
  };

  const state = bundles.length ? (list.length || leakList.length ? 'mapped' : 'no_endpoints') : 'no_bundles';

  return {
    host: input.host,
    origin: input.origin,
    state,
    mode,
    obfuscation: obfuscationScore,
    counts,
    bundles: bundles.map((bundle) => ({ url: bundle.url, bytes: bundle.bytes })),
    endpoints: list,
    leaks: leakList,
    versions,
    frameworks: [...frameworks],
    note: !bundles.length
      ? 'No same-origin script could be read, so no endpoint can be declared and none is claimed.'
      : counts.total + ' endpoint(s) declared in ' + counts.bundles + ' public bundle(s): ' +
        counts.referenced + ' also referenced by the capture, ' + counts.dormant + ' dormant, ' +
        counts.internal + ' pointing at another host' +
        (versions.length ? ', with ' + versions.length + ' version set(s) still shipping an older contract' : '') + '.',
    limits:
      'A bundle is a declaration, not traffic. Nothing was called, so a dormant endpoint may already be dead on the server: ' +
      'the map states what the code is programmed to handle, never what it answered. No traffic was watched, so no ' +
      'endpoint is graded Confirmed: the strongest grade this pass can prove is Referenced. Read ' + BUNDLE_CAP / 1000 +
      'k chars per bundle, ' + MAX_BUNDLES + ' bundles, ' + mode + ' mode' +
      (mode === 'pattern' ? ' (obfuscated payload: matched by pattern, no string decoded)' : '') + '.'
  };
}