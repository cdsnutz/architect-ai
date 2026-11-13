/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Bounded, read-only capture of a whole site: anonymous GET per page, same-origin
// links only, a hard page cap. It inventories what a visitor can reach, never
// downloads source maps, never submits a form and never sends a body.

import { assertPublicUrl } from './readOnly.ts';

const MAX_PAGES = 12;
const TIMEOUT_MS = 9000;
const MAX_BYTES = 200000;

type PageRow = {
  url: string;
  path: string;
  status: number;
  bytes: number;
  content_type: string;
  title: string;
  description: string;
  generator: string;
  headings: string[];
  forms: { action: string; method: string; fields: number }[];
  scripts: string[];
  internal_links: number;
  external_links: number;
};

const HEX_ANY = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

function normHex(raw: string): string {
  let hex = raw.replace('#', '').toLowerCase();
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return '#' + hex;
}

// Reads the stylesheets a page actually links. Colours and colour/background
// pairs are quoted from the CSS; nothing is guessed from a screenshot.
function collectCss(text: string, colors: Map<string, number>, pairs: Map<string, { fg: string; bg: string; count: number }>) {
  const found = text.match(HEX_ANY) || [];
  found.forEach((raw) => {
    const hex = normHex(raw);
    colors.set(hex, (colors.get(hex) || 0) + 1);
  });
  const rules = [...text.matchAll(/([^{}]{1,300})\{([^{}]{0,900})\}/g)];
  rules.forEach((match) => {
    const body = match[2] || '';
    const fg = /(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/i.exec(body);
    const bg = /(?:^|;)\s*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i.exec(body);
    if (!fg || !bg) return;
    const key = normHex(fg[1]) + '|' + normHex(bg[1]);
    const seen = pairs.get(key);
    if (seen) {
      seen.count += 1;
    } else {
      pairs.set(key, { fg: normHex(fg[1]), bg: normHex(bg[1]), count: 1 });
    }
  });
  return rules.length;
}

function decode(value: string): string {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function first(html: string, rx: RegExp): string {
  const match = rx.exec(html);
  return match ? decode(match[1]) : '';
}

function attr(tag: string, name: string): string {
  const match = new RegExp(name + '\\s*=\\s*["\']([^"\']*)["\']', 'i').exec(tag);
  return match ? match[1].trim() : '';
}

function safeUrl(href: string, base: string): string | null {
  const raw = String(href || '').trim();
  if (!raw || raw.startsWith('#') || /^(mailto:|tel:|javascript:|data:)/i.test(raw)) return null;
  try {
    const url = new URL(raw, base);
    url.hash = '';
    return url.toString();
  } catch (error) {
    return null;
  }
}

function parsePage(html: string, pageUrl: string) {
  const origin = new URL(pageUrl).origin;
  const anchorTags = [...html.matchAll(/<a\b[^>]*>/gi)].map((match) => match[0]);
  const links = anchorTags.map((tag) => safeUrl(attr(tag, 'href'), pageUrl)).filter(Boolean) as string[];
  const internal = links.filter((url) => url.startsWith(origin));
  const external = [...new Set(links.filter((url) => !url.startsWith(origin)).map((url) => new URL(url).hostname))];

  const forms = [...html.matchAll(/<form\b[^>]*>/gi)].map((match) => {
    const tag = match[0];
    const action = safeUrl(attr(tag, 'action') || pageUrl, pageUrl) || pageUrl;
    return { action, method: (attr(tag, 'method') || 'get').toUpperCase(), fields: 0 };
  });
  forms.forEach((form, index) => {
    const start = html.search(/<form\b/i);
    if (start < 0) return;
    const chunk = html.slice(start).split(/<\/form>/i)[index] || '';
    form.fields = (chunk.match(/<(input|select|textarea)\b/gi) || []).length;
  });

  const scripts = [...html.matchAll(/<script\b[^>]*src\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => safeUrl(match[1], pageUrl))
    .filter((url): url is string => Boolean(url) && Boolean(url) && (url as string).startsWith(origin))
    .map((url) => new URL(url).pathname);

  return {
    internal,
    external,
    forms,
    scripts,
    title: first(html, /<title[^>]*>([^<]*)<\/title>/i),
    description: first(html, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i),
    generator: first(html, /<meta[^>]+name=["']generator["'][^>]*content=["']([^"']*)["']/i),
    headings: [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
      .slice(0, 4)
      .map((match) => decode(match[1].replace(/<[^>]+>/g, ' ')))
      .filter(Boolean)
  };
}

async function readPage(url: string): Promise<{ row: PageRow; html: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'ArchitectAI-lab/1.0 (read-only capture)' }
    });
    const text = (await response.text()).slice(0, MAX_BYTES);
    const parsed = parsePage(text, url);
    const row: PageRow = {
      url,
      path: new URL(url).pathname,
      status: response.status,
      bytes: text.length,
      content_type: response.headers.get('content-type') || '',
      title: parsed.title,
      description: parsed.description,
      generator: parsed.generator,
      headings: parsed.headings,
      forms: parsed.forms,
      scripts: [...new Set(parsed.scripts)],
      internal_links: [...new Set(parsed.internal)].length,
      external_links: parsed.external.length
    };
    return { row, html: text };
  } finally {
    clearTimeout(timer);
  }
}

export async function captureSite(startUrl: string, options: { maxPages?: number } = {}) {
  const entry = assertPublicUrl(startUrl);
  const origin = new URL(entry).origin;
  const maxPages = Math.min(MAX_PAGES, Math.max(1, options.maxPages || MAX_PAGES));

  const cssLinks = new Set<string>();
  const queue: string[] = [entry];
  let inlineCss = '';
  const seen = new Set<string>([entry]);
  const pages: PageRow[] = [];
  const externalHosts = new Set<string>();
  const routePaths = new Set<string>();

  while (queue.length && pages.length < maxPages) {
    const next = queue.shift() as string;
    try {
      const { row, html } = await readPage(next);
      pages.push(row);
      routePaths.add(row.path || '/');
      const parsed = parsePage(html, next);
      parsed.external.forEach((host) => externalHosts.add(host));
      inlineCss += (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n');
      [...html.matchAll(/<link\b[^>]*>/gi)].forEach((match) => {
        if (cssLinks.size >= 4 || !/rel\s*=\s*["']?stylesheet/i.test(match[0])) return;
        const href = attr(match[0], 'href');
        const cssUrl = href ? safeUrl(href, next) : null;
        if (cssUrl && cssUrl.startsWith(origin)) cssLinks.add(cssUrl);
      });
      parsed.internal.forEach((url) => {
        if (seen.has(url) || pages.length + queue.length >= maxPages) return;
        seen.add(url);
        queue.push(url);
      });
    } catch (error) {
      pages.push({
        url: next,
        path: new URL(next).pathname,
        status: 0,
        bytes: 0,
        content_type: '',
        title: '',
        description: '',
        generator: '',
        headings: [],
        forms: [],
        scripts: [],
        internal_links: 0,
        external_links: 0
      });
    }
  }

  const colors = new Map<string, number>();
  const colorPairs = new Map<string, { fg: string; bg: string; count: number }>();
  let ruleCount = collectCss(inlineCss.slice(0, 120000), colors, colorPairs);
  for (const cssUrl of [...cssLinks]) {
    try {
      const response = await fetch(cssUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'User-Agent': 'ArchitectAI-lab/1.0 (read-only capture)' }
      });
      const text = (await response.text()).slice(0, 150000);
      ruleCount += collectCss(text, colors, colorPairs);
    } catch (error) {
      // A stylesheet that will not load carries no evidence.
    }
  }

  const forms: { action: string; method: string; fields: number; page: string }[] = [];
  const bundles = new Set<string>();
  pages.forEach((page) => {
    page.forms.forEach((form) => {
      if (!forms.some((item) => item.action === form.action && item.method === form.method)) {
        forms.push({ ...form, page: page.path });
      }
    });
    page.scripts.forEach((script) => bundles.add(script));
  });

  return {
    start_url: entry,
    origin,
    pages,
    page_count: pages.length,
    route_paths: [...routePaths],
    forms: forms.slice(0, 20),
    bundles: [...bundles].slice(0, 20),
    stylesheets: {
      files: [...cssLinks],
      rules: ruleCount,
      colors: [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([hex, count]) => ({ hex, count })),
      pairs: [...colorPairs.values()].sort((a, b) => b.count - a.count).slice(0, 12)
    },
    external_hosts: [...externalHosts].slice(0, 20),
    total_bytes: pages.reduce((sum, page) => sum + page.bytes, 0),
    limits: 'Same-origin GET only, ' + maxPages + ' page cap, bodies trimmed to ' + MAX_BYTES + ' bytes, forms never submitted.',
    captured_at: new Date().toISOString()
  };
}