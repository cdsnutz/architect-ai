/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

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
    links,
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
    '\n\n## V. Run\nApply the pods to the evidence below, then fill every field of the response schema.\n' +
    '- Keep every array to at most 8 entries, highest value first.\n' +
    '- Tag each API contract with the UI trigger that fires it and the exact table it reads or writes in ' +
    '`linked_table`; that name must match a `table` in `inferred_schema`. Use "unlinked" only when no table can be ' +
    'justified from the evidence.\n' +
    '- Fill `written_by` on each table with the endpoints that write to it, so the relation is readable in both ' +
    'directions.\n' +
    '- Infer a constraint for every column and cite it: identifier format (UUID v4, nanoid, integer sequence), enum ' +
    'domain and its allowed values, nullability, uniqueness, length or numeric bounds.\n' +
    '- Fill `state_transitions` as a matrix: current_state, trigger, action, next_state, endpoint, table. Use ' +
    '"(initial)" for creation and "(terminal)" for archival or deletion.\n' +
    '- Fill `ledger_traces` with one row per distinct user-visible action — every button, form submit, navigation and filter — up to 8, each naming the exact endpoint it calls and the single table it reads or writes. Never merge two actions into one row, and never leave `table` empty for an action that changes stored data: the journey view draws one path per row.\n' +
    '- Fill `temporal_profile` from the header probe block above: quote the cache-control and validation headers you ' +
    'were given, and set freshness to cached when a max-age or immutable directive is present, revalidated when ETag or ' +
    'Last-Modified appears, live only when the bundle shows a socket or event stream, and unknown otherwise. Cadence is ' +
    'inferred unless a header states it, and inter-update timing is never measured from one pass.\n' +
    '- Fill `dependency_graph` with one node per table, endpoint, screen and shared identifier, the edges between them, ' +
    'and a blast_radius row for each identifier that appears in more than one trace.\n' +
    '- Fill `archetype_matches` only where route shape, status vocabulary or field naming really matches a documented ' +
    'standard. `filled_blanks` lists the fields or rules the archetype supplies, and each one is inferred, never ' +
    'reported as observed. A weak match fills nothing.\n' +
    '- Fill `logic_mirror` with one replacement function per traced behaviour: input, rule as short pseudocode, output, ' +
    'the observed case it was replayed against, and confidence. Use "unverified" when no observed case exercises it.\n' +
    '- Fill `parity_map` with two Mermaid flowcharts (target and mirror) and the gaps between them. A gap row may ' +
    'only contrast the target against the mirror on the axis you actually observed. If the target side of the axis was ' +
    'never observed (for example an unknown transport such as websocket versus polling), write "not observable from ' +
    'this evidence" for that cell instead of naming a mechanism, and never describe the target as live, streaming or ' +
    'socket-based without bundle evidence of a socket or event stream.\n' +
    '- Never cite a mechanism you did not see. A dependency edge or blast-radius row must name the identifier, route or ' +
    'payload position that links it; "foreign key", "full refresh" and similar backend facts are not observable from a ' +
    'client surface, so mark them inferred or omit the row.\n' +
    '- Every entry in `filled_blanks` is a deduction, not a finding: keep it short, and if the archetype match is only ' +
    'the app category rather than a technical contract, set strength to "weak" and fill nothing.\n' +
    '- Also record the page/section structure, the data entities, third-party integrations, user flows, bottlenecks ' +
    'and UX gaps.\n' +
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