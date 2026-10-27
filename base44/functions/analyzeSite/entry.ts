import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getEntitlement } from '../../shared/entitlement.ts';

const LOGIC_MAP_SCHEMA = {
  type: 'object',
  properties: {
    app_summary: { type: 'string' },
    page_structure: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          purpose: { type: 'string' },
          key_elements: { type: 'array', items: { type: 'string' } }
        },
        required: ['name', 'purpose', 'key_elements']
      }
    },
    data_entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          purpose: { type: 'string' },
          likely_fields: { type: 'array', items: { type: 'string' } }
        },
        required: ['name', 'purpose', 'likely_fields']
      }
    },
    api_integrations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          evidence: { type: 'string' },
          purpose: { type: 'string' }
        },
        required: ['name', 'evidence', 'purpose']
      }
    },
    user_flows: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          steps: { type: 'array', items: { type: 'string' } }
        },
        required: ['name', 'steps']
      }
    },
    bottlenecks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          area: { type: 'string' },
          issue: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          suggestion: { type: 'string' }
        },
        required: ['area', 'issue', 'severity', 'suggestion']
      }
    },
    ux_issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          area: { type: 'string' },
          issue: { type: 'string' },
          suggestion: { type: 'string' }
        },
        required: ['area', 'issue', 'suggestion']
      }
    }
  },
  required: ['app_summary', 'page_structure', 'data_entities', 'user_flows', 'bottlenecks', 'ux_issues']
};

function extractEvidence(url, html) {
  const title = (((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]) || '').trim().slice(0, 200);
  const description = (((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || [])[1]) || '').slice(0, 300);
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]).slice(0, 40);
  const forms = (html.match(/<form[^>]*>/gi) || []).length;
  const links = [...new Set([...html.matchAll(/<a[^>]+href=["'](\/[^"'#][^"']*)["']/gi)].map((m) => m[1]))].slice(0, 40);
  const visibleText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18000);

  return {
    title,
    evidence: [
      'URL: ' + url,
      'Page title: ' + (title || 'none'),
      'Meta description: ' + (description || 'none'),
      'Scripts referenced: ' + JSON.stringify(scripts),
      'Form elements found: ' + forms,
      'Internal link paths: ' + JSON.stringify(links),
      'Visible page text (truncated): ' + visibleText
    ].join('\n')
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const entitlement = await getEntitlement(base44, user);
    if (!entitlement.admin && entitlement.remaining <= 0) {
      return Response.json({
        error: 'Each website needs its own paid analysis. Buy access for another website to keep mapping.',
        code: 'payment_required'
      }, { status: 403 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== 'string' || !/^https?:\/\/.+\..+/i.test(url.trim())) {
      return Response.json({ error: 'Please provide a valid http(s) URL.' }, { status: 400 });
    }
    const targetUrl = url.trim();

    let html = '';
    try {
      const res = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LogicMapper/1.0)', Accept: 'text/html,*/*' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000)
      });
      if (!res.ok) {
        return Response.json({ error: 'The site responded with HTTP ' + res.status + ' and could not be analyzed.' }, { status: 502 });
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType && !/text\/html|text\/plain|application\/(xhtml|xml|json)/i.test(contentType)) {
        return Response.json({ error: 'That URL is not an HTML page (' + contentType.split(';')[0] + ').' }, { status: 400 });
      }
      html = (await res.text()).slice(0, 800000);
    } catch (fetchError) {
      const reason = fetchError && fetchError.name === 'TimeoutError' ? 'The request timed out.' : 'The site could not be reached.';
      return Response.json({ error: 'Could not fetch that URL. ' + reason }, { status: 502 });
    }

    const { title, evidence } = extractEvidence(targetUrl, html);

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are a senior full-stack engineer and systems architect performing a reverse-engineering audit of a website. ' +
        'Below is evidence extracted from one page of the site (title, meta, scripts, forms, internal links, and visible text). ' +
        'Infer the application: what it does, its likely page/section structure, the data entities it must manage behind the scenes, ' +
        'any third-party APIs or services it integrates (infer from script URLs and content), its core user flows, likely technical ' +
        'bottlenecks and code smells (with severity), and UX or accessibility issues visible from the content. ' +
        'Base every claim on the evidence; mark inferences as likely, never invent specifics that contradict the evidence.\n\n' +
        'EVIDENCE:\n' + evidence,
      response_json_schema: LOGIC_MAP_SCHEMA
    });

    const record = await base44.entities.SiteAnalysis.create({
      url: targetUrl,
      title: title || targetUrl,
      summary: (llm && llm.app_summary) || '',
      logic_map: llm
    });

    return Response.json({ analysis: record });
  } catch (error) {
    return Response.json({ error: 'Analysis failed: ' + (error && error.message ? error.message : 'Unknown error') }, { status: 500 });
  }
}