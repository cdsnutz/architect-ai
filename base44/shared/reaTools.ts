/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// REA tool surface: agent connection tokens, the doctor pass, a source-level
// analysis pass and the job-spec builder. All of it runs in the app, and the same
// actions answer over the web endpoint for an agent holding a minted token.

import { PODS, TECHNIQUES } from './pods.ts';
import { LAYERS } from './layers.ts';
import { REA_SKILLS, reaJobSpec } from './rea.ts';

export const MAX_FILES = 12;
export const MAX_FILE_CHARS = 90000;
export const MIN_SOURCE_CHARS = 200;
export const MACHINE_ACTIONS = ['doctor', 'job-spec'];

export const SOURCE_POD_STAGES = [
  { key: 'perimeter', pods: ['Perimeter Scout'], label: 'Inventory modules, requests and models' },
  { key: 'protocol', pods: ['Protocol Analyst'], label: 'Request contract pass' },
  { key: 'map', pods: ['Schema Archaeologist', 'Logic Reconstructor'], label: 'Data model and logic pass' },
  { key: 'write', pods: ['REA Orchestrator'], label: 'Write the dossier' }
];

export function mintToken() {
  return 'rea_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

export async function hashToken(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function unique(values) {
  const out = [];
  values.forEach((value) => {
    if (value && !out.includes(value)) out.push(value);
  });
  return out;
}

function matches(content, pattern) {
  return [...content.matchAll(pattern)].map((match) => match.slice(1).filter(Boolean).join(' '));
}

export function sourceEvidence(files) {
  const parts = [];
  const modules = [];
  let chars = 0;

  files.forEach((file) => {
    const name = String(file.name || 'file').slice(0, 120);
    const content = String(file.content || '');
    chars += content.length;
    modules.push(name);

    const imports = unique(matches(content, /(?:import\s+[^'"]*?from\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"])/g));
    const requests = unique(
      matches(content, /\b(fetch|axios(?:\.\w+)?)\s*\(\s*[`'"]([^`'"]+)[`'"]/g).map((hit) => hit)
    );
    const handlers = unique(
      matches(content, /\b(?:app|router|server)\.(get|post|put|patch|delete)\s*\(\s*[`'"]([^`'"]+)[`'"]/gi)
    );
    const models = unique(
      matches(content, /(?:CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?|model\s+|collection\(\s*['"])(["`]?)(\w+)/gi)
    );
    const env = unique(matches(content, /process\.env\.([A-Z0-9_]+)/g));
    const exported = unique(
      matches(content, /export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class)\s+(\w+)/g)
    );

    parts.push(
      [
        '### File: ' + name,
        'Imports: ' + JSON.stringify(imports.slice(0, 40)),
        'Outbound requests: ' + JSON.stringify(requests.slice(0, 40)),
        'Route handlers: ' + JSON.stringify(handlers.slice(0, 40)),
        'Declared tables / models: ' + JSON.stringify(models.slice(0, 40)),
        'Env vars referenced: ' + JSON.stringify(env.slice(0, 40)),
        'Exported symbols: ' + JSON.stringify(exported.slice(0, 40)),
        'Source excerpt (truncated): ' + content.slice(0, 6000)
      ].join('\n')
    );
  });

  return { modules, chars, evidence: parts.join('\n\n') };
}

export function sourceHeader(label) {
  return (
    'SOURCE-LEVEL PASS — ' + label + '\n' +
    'The evidence below is the target application\'s own source: real modules, real request calls, ' +
    'real route handlers, models and env usage. There is no live host in this pass, so header, cache, ' +
    'latency and content-negotiation observations are not observable and must be reported as such ' +
    'rather than guessed.\n'
  );
}

function ago(iso) {
  if (!iso) return 'never';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  return Math.floor(hours / 24) + 'd ago';
}

export async function runDoctor(base44, scope) {
  const entities = scope.serviceRole ? base44.asServiceRole.entities : base44.entities;
  const owned = scope.serviceRole ? { created_by_id: scope.userId } : {};
  const rows = [];
  const page = (promise) => promise.catch(() => ({ items: [] }));

  rows.push({
    key: 'registry',
    label: 'Pod registry',
    status: PODS.length === 4 && LAYERS.length >= 4 && REA_SKILLS.length >= 10 ? 'pass' : 'fail',
    detail:
      PODS.length + ' pods · ' + LAYERS.length + ' layers · ' + REA_SKILLS.length + ' skills · ' +
      TECHNIQUES.length + ' techniques'
  });

  const connections = await page(entities.ReaConnection.filter({ status: 'active', ...owned }, { limit: 5 }));
  const connection = connections.items[0];
  rows.push({
    key: 'connection',
    label: 'Agent connection',
    status: connection ? 'pass' : 'warn',
    detail: connection
      ? connections.items.length + ' active token(s) · last seen ' + ago(connection.last_seen_at)
      : 'No token minted yet — mint one under Connect REA'
  });

  const runs = await page(entities.ReaRun.filter(owned, { sort: '-created_date', limit: 5 }));
  const lastRun = runs.items[0];
  rows.push({
    key: 'telemetry',
    label: 'Pod telemetry',
    status: !lastRun ? 'warn' : lastRun.status === 'complete' ? 'pass' : lastRun.status === 'failed' ? 'fail' : 'warn',
    detail: lastRun
      ? 'Last pass ' + lastRun.status + ' · ' + ago(lastRun.updated_date || lastRun.created_date) + ' · ' +
        runs.items.length + ' recent run(s)'
      : 'No pod pass recorded yet'
  });

  const dossiers = await page(entities.SiteAnalysis.filter(owned, { sort: '-created_date', limit: 50 }));
  const traced = dossiers.items.filter(
    (item) => item.logic_map && Array.isArray(item.logic_map.ledger_traces) && item.logic_map.ledger_traces.length
  ).length;
  const validated = dossiers.items.filter((item) => item.pipeline_status === 'validated').length;
  rows.push({
    key: 'dossiers',
    label: 'Dossier coverage',
    status: dossiers.items.length && traced ? 'pass' : 'warn',
    detail:
      dossiers.items.length + ' dossiers · ' + traced + ' carry ledger traces · ' + validated + ' validated'
  });

  const latest = dossiers.items[0];
  rows.push({
    key: 'engine',
    label: 'Mapping engine',
    status: latest ? 'pass' : 'warn',
    detail: latest
      ? 'Latest dossier ' + (latest.title || latest.url) + ' · ' + ago(latest.created_date)
      : 'Nothing mapped yet'
  });

  return { rows, checked_at: new Date().toISOString() };
}

export function jobSpecFor(record) {
  const spec = reaJobSpec(record);
  const slug = String(record.title || record.url || 'dossier')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  return {
    file: (slug || 'dossier') + '-rea-job.json',
    spec: {
      ...spec,
      pods: PODS.map((pod) => ({ id: pod.id, name: pod.name, surface: pod.surface })),
      schema_version: 1,
      issued_at: new Date().toISOString()
    }
  };
}