import { POD_SCHEMA, masterPrompt } from './pods.ts';

export const LOGIC_MAP_SCHEMA = {
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

export function extractEvidence(url, html) {
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

export const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: { ...LOGIC_MAP_SCHEMA.properties, ...POD_SCHEMA.properties },
  required: [...LOGIC_MAP_SCHEMA.required, ...POD_SCHEMA.required]
};

export function buildPodPrompt(evidence) {
  return (
    masterPrompt() +
    '\n\n## V. Run\nApply the pods to the evidence below, then fill every field of the response schema. Also record the ' +
    'page/section structure, the data entities, third-party integrations, user flows, bottlenecks and UX gaps. ' +
    'Every claim must cite the evidence it came from; where the evidence does not settle a question, write ' +
    '"not observable from this evidence". Each Mermaid diagram must start with "flowchart TD".\n\n' +
    'EVIDENCE:\n' + evidence
  );
}

export async function mapLogic(base44, evidence) {
  return await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: buildPodPrompt(evidence),
    response_json_schema: ANALYSIS_SCHEMA
  });
}