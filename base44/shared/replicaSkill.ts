// Replica skill set, ported from github.com/Jakeschincariol/replica-skill (MIT).
//
// Eleven staged skills; three of them ship deterministic tools that fit this
// engine without a network call, so they run as app modules here:
//   replica-diff/parity.py     -> scoreParity
//   replica-design/contrast.py -> contrastCheck
//   replica-brand/sweep.py     -> sweepArtifacts
//
// The rest are operator-run stages: they need a build, screenshots, store
// listings or real reviews, which this surface deliberately does not fabricate.

import { STAGE_WIRING } from './crossWire.ts';

export const SKILL_CATALOG = [
  { id: 'recon', command: '/replica-recon', label: 'Recon', purpose: 'Map screens, flows, components and the inferred data model from public pages and your own account.', runner: null },
  { id: 'architect', command: '/replica-architect', label: 'Architect', purpose: 'Plan the stack, schema and API for the rebuild. This engine compiles the same artifacts as a spec.', runner: null },
  { id: 'design', command: '/replica-design', label: 'Design', purpose: 'Rebuild the design system as tokens, with your own assets.', runner: 'contrast' },
  { id: 'build', command: '/replica-build', label: 'Build', purpose: 'Rebuild screen by screen from the recon map, ticking off the feature matrix.', runner: null },
  { id: 'backend', command: '/replica-backend', label: 'Backend', purpose: 'Auth, database, payments and integrations behind the captured contracts.', runner: null },
  { id: 'test', command: '/replica-test', label: 'Test', purpose: 'Click through every flow and log bugs by severity. The run contract carries this stage.', runner: null },
  { id: 'diff', command: '/replica-diff', label: 'Diff', purpose: 'Parity score against the original: features, must-haves done, what is missing and in what order.', runner: 'parity' },
  { id: 'entrepreneur', command: '/replica-entrepreneur', label: 'Entrepreneur', purpose: 'Read real, linked reviews and turn them into fixes and a positioning angle. Needs review data you supply.', runner: null },
  { id: 'brand', command: '/replica-brand', label: 'Brand', purpose: 'Rename and rebrand, then sweep the codebase until nothing of the original is left.', runner: 'sweep' },
  { id: 'launch', command: '/replica-launch', label: 'Launch', purpose: 'Landing page, pricing and store listing, checked against store limits.', runner: null },
  { id: 'deploy', command: '/replica-deploy', label: 'Deploy', purpose: 'Preflight (tests, parity, sweep), production setup and DNS. The deploy bundle carries the config.', runner: null }
];

const WEIGHT = { must: 3, should: 2, could: 1, p0: 3, p1: 2, p2: 1 };
const CREDIT = { yes: 1, done: 1, partial: 0.5, no: 0, '': 0, todo: 0 };
const PRIORITY_NAME = { 3: 'must', 2: 'should', 1: 'could' };

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    if (ch === '\r') continue;
    cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim().length));
}

function escapeCell(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

export function matrixToCsv(rows) {
  const header = ['feature', 'area', 'priority', 'original', 'clone', 'notes'];
  const body = rows.map((row) => header.map((key) => escapeCell(row[key])).join(','));
  return [header.join(','), ...body].join('\n');
}

export function parseFeatureMatrix(text) {
  const table = parseCsv(String(text || ''));
  if (!table.length) throw new Error('The feature matrix is empty.');
  const header = table[0].map((h) => h.trim().toLowerCase());
  for (const need of ['feature', 'priority', 'clone']) {
    if (!header.includes(need)) {
      throw new Error("The matrix has no '" + need + "' column. Needed: feature, area, priority, original, clone, notes.");
    }
  }
  return table.slice(1).map((cells) => {
    const row = {};
    header.forEach((key, index) => {
      if (key) row[key] = (cells[index] || '').trim();
    });
    return row;
  }).filter((row) => row.feature);
}

export function deriveFeatureMatrix(contracts) {
  const rows = [];
  const traces = Array.isArray(contracts.ledger_traces) ? contracts.ledger_traces : [];
  const apis = Array.isArray(contracts.api_contracts) ? contracts.api_contracts : [];
  const transitions = Array.isArray(contracts.state_transitions) ? contracts.state_transitions : [];
  const tables = Array.isArray(contracts.inferred_schema) ? contracts.inferred_schema : [];

  traces.forEach((trace) => {
    const endpoint = String(trace.endpoint || '').trim();
    const table = String(trace.table || '').trim();
    rows.push({
      feature: String(trace.ui_trigger || 'action') + ' -> ' + (endpoint || 'endpoint unobserved'),
      area: 'flows',
      priority: 'must',
      original: 'yes',
      clone: endpoint && table ? 'yes' : 'partial',
      notes: String(trace.evidence || '')
    });
  });

  apis.forEach((api) => {
    const method = String(api.method || 'UNKNOWN').toUpperCase();
    const endpoint = String(api.endpoint || '').trim();
    rows.push({
      feature: method + ' ' + (endpoint || 'endpoint'),
      area: 'api surface',
      priority: method === 'UNKNOWN' ? 'should' : 'must',
      original: 'yes',
      clone: endpoint ? 'yes' : 'partial',
      notes: String(api.evidence || '')
    });
  });

  transitions.forEach((edge) => {
    const from = String(edge.current_state || edge.from_state || '?');
    const to = String(edge.next_state || edge.to_state || '?');
    rows.push({
      feature: String(edge.entity || 'object') + ': ' + from + ' -> ' + to,
      area: 'lifecycle',
      priority: 'must',
      original: 'yes',
      clone: edge.evidence ? 'yes' : 'partial',
      notes: String(edge.trigger || '')
    });
  });

  tables.forEach((table) => {
    const columns = Array.isArray(table.columns) ? table.columns : [];
    rows.push({
      feature: 'table ' + String(table.table || 'unnamed') + ' (' + columns.length + ' columns)',
      area: 'data model',
      priority: 'must',
      original: 'yes',
      clone: columns.length ? 'yes' : 'partial',
      notes: String(table.purpose || '')
    });
  });

  return rows.slice(0, 40);
}

export function scoreParity(rows) {
  const counted = [];
  const skipped = [];
  const extras = [];
  const problems = [];

  rows.forEach((row, index) => {
    const line = index + 2;
    const original = String(row.original || 'yes').toLowerCase() || 'yes';
    const clone = String(row.clone || '').toLowerCase();
    const prio = String(row.priority || '').toLowerCase();

    if (['no', 'n', 'false'].includes(original)) {
      extras.push(row);
      return;
    }
    if (clone === 'skip') {
      skipped.push(row);
      return;
    }
    if (!(prio in WEIGHT)) {
      problems.push("line " + line + ": priority '" + (row.priority || '') + "' is not must/should/could, counted as could");
    }
    if (!(clone in CREDIT)) {
      problems.push("line " + line + ": clone '" + (row.clone || '') + "' is not yes/partial/no/skip, counted as no");
    }
    counted.push({
      ...row,
      weight: WEIGHT[prio] || 1,
      credit: CREDIT[clone] === undefined ? 0 : CREDIT[clone]
    });
  });

  const total = counted.reduce((sum, row) => sum + row.weight, 0);
  const got = counted.reduce((sum, row) => sum + row.weight * row.credit, 0);
  const featureScore = total ? (100 * got) / total : 0;

  const areaMap = {};
  counted.forEach((row) => {
    const area = row.area || '(no area)';
    const bucket = areaMap[area] || [0, 0, 0];
    bucket[0] += row.weight * row.credit;
    bucket[1] += row.weight;
    bucket[2] += 1;
    areaMap[area] = bucket;
  });
  const byArea = Object.keys(areaMap)
    .map((area) => ({
      area,
      score: areaMap[area][1] ? Math.round((100 * areaMap[area][0]) / areaMap[area][1] * 10) / 10 : 0,
      features: areaMap[area][2]
    }))
    .sort((a, b) => a.score - b.score);

  const missing = counted
    .filter((row) => row.credit < 1)
    .sort((a, b) => b.weight - a.weight || a.credit - b.credit || String(a.area || '').localeCompare(String(b.area || '')))
    .map((row) => ({
      feature: row.feature,
      area: row.area || '',
      priority: PRIORITY_NAME[row.weight] || 'could',
      clone: row.clone || 'no',
      notes: row.notes || ''
    }));

  const musts = counted.filter((row) => row.weight === 3);

  return {
    feature_score: Math.round(featureScore * 10) / 10,
    overall: Math.round(featureScore * 10) / 10,
    counted: counted.length,
    must_have_done: musts.filter((row) => row.credit === 1).length,
    must_have_total: musts.length,
    by_area: byArea,
    missing,
    skipped: skipped.map((row) => ({ feature: row.feature, area: row.area || '', notes: row.notes || '' })),
    extras: extras.map((row) => ({ feature: row.feature, area: row.area || '' })),
    problems
  };
}

const HEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const NEEDS = { normal: [4.5, 7], large: [3, 4.5], ui: [3, 3] };

function parseHex(value) {
  const match = HEX.exec(String(value || '').trim());
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function luminance(rgb) {
  const channels = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(fg, bg) {
  const a = luminance(parseHex(fg));
  const b = luminance(parseHex(bg));
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

function flatten(obj, prefix = '', out = {}) {
  if (obj && typeof obj === 'object') {
    if (typeof obj.value === 'string') {
      out[prefix] = obj.value;
      return out;
    }
    if (typeof obj.$value === 'string') {
      out[prefix] = obj.$value;
      return out;
    }
    Object.keys(obj).forEach((key) => {
      if (key.charAt(0) === '$' || key.charAt(0) === '_') return;
      flatten(obj[key], prefix ? prefix + '-' + key : key, out);
    });
  } else if (typeof obj === 'string' && HEX.test(obj.trim())) {
    out[prefix] = obj.trim();
  }
  return out;
}

export function contrastCheck(tokensInput, explicitPairs) {
  let tokens = tokensInput;
  if (typeof tokens === 'string') {
    try {
      tokens = JSON.parse(tokensInput);
    } catch (error) {
      throw new Error('The token file is not valid JSON.');
    }
  }
  if (!tokens || typeof tokens !== 'object') throw new Error('Pass a token object or the token JSON.');

  const source = tokens.color || tokens.colors || tokens.colour || {};
  const flat = flatten(source);
  const colours = {};
  Object.keys(flat).forEach((key) => {
    if (HEX.test(flat[key])) colours[key] = flat[key];
  });

  let pairs = explicitPairs;
  if (!Array.isArray(pairs) || !pairs.length) {
    pairs = Array.isArray(tokens.pairs) && tokens.pairs.length ? tokens.pairs : null;
  }
  if (!pairs) {
    const fg = Object.keys(colours).filter((k) => /(^|-)(text|fg|on)(-|$)/.test(k));
    const bg = Object.keys(colours).filter((k) => /(^|-)(bg|background|surface)(-|$)/.test(k));
    pairs = [];
    fg.forEach((f) => bg.forEach((b) => pairs.push([f, b])));
  }
  if (!pairs.length) throw new Error('No pairs to check. Add a "pairs" list to the token file.');

  const rows = pairs.slice(0, 200).map((pair) => {
    const fg = pair[0];
    const bg = pair[1];
    const size = NEEDS[pair[2]] ? pair[2] : 'normal';
    if (!colours[fg] || !colours[bg]) {
      return { fg, bg, size, error: 'unknown token' };
    }
    const ratio = contrastRatio(colours[fg], colours[bg]);
    const [aa, aaa] = NEEDS[size];
    return {
      fg,
      bg,
      size,
      ratio,
      aa: ratio >= aa,
      aaa: ratio >= aaa,
      fg_hex: colours[fg],
      bg_hex: colours[bg]
    };
  });

  const failing = rows.filter((row) => row.error || !row.aa).length;
  return { rows, pairs: rows.length, failing, clean: failing === 0 };
}

const HEX_FIND = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z])/g;

function normalizeHex(value) {
  let hex = String(value || '').toLowerCase().replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return '#' + hex;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sweepArtifacts(files, options = {}) {
  const avoid = (options.avoid || []).map((n) => String(n).trim()).filter(Boolean);
  const domains = (options.domains || []).map((d) => String(d).trim().toLowerCase()).filter(Boolean);
  const colours = new Set((options.colors || []).filter((c) => HEX.test(String(c || '').trim())).map(normalizeHex));

  if (!avoid.length && !domains.length && !colours.size) {
    throw new Error("Nothing to look for. Give the original app's name, domain or brand colours.");
  }

  const patterns = [];
  avoid.forEach((name) => {
    const parts = name.split(/[\s_-]+/).filter(Boolean).map(escapeRegex);
    patterns.push({ kind: 'name', label: name, rx: new RegExp(parts.join('[\\s_-]?'), 'i') });
  });
  domains.forEach((domain) => {
    patterns.push({ kind: 'domain', label: domain, rx: new RegExp(escapeRegex(domain), 'i') });
  });

  const hits = [];
  const limit = 200;

  (Array.isArray(files) ? files : []).forEach((file) => {
    if (hits.length >= limit) return;
    const path = String((file && file.path) || 'artifact');
    const content = String((file && file.content) || '');

    patterns.forEach((pattern) => {
      if (pattern.kind === 'name' && pattern.rx.test(path)) {
        hits.push({ file: path, line: 0, kind: 'path', match: pattern.label, text: 'file name' });
      }
    });

    content.split('\n').forEach((line, index) => {
      if (hits.length >= limit) return;
      patterns.forEach((pattern) => {
        if (pattern.rx.test(line)) {
          hits.push({ file: path, line: index + 1, kind: pattern.kind, match: pattern.label, text: line.trim().slice(0, 160) });
        }
      });
      if (colours.size) {
        const found = line.match(HEX_FIND) || [];
        found.forEach((raw) => {
          const hex = normalizeHex(raw);
          if (colours.has(hex)) {
            hits.push({ file: path, line: index + 1, kind: 'color', match: hex, text: line.trim().slice(0, 160) });
          }
        });
      }
    });
  });

  const byKind = {};
  hits.forEach((hit) => {
    byKind[hit.kind] = (byKind[hit.kind] || 0) + 1;
  });

  return { hits: hits.slice(0, limit), by_kind: byKind, clean: hits.length === 0 };
}

export function deriveSweepTargets(spec) {
  const title = String((spec && spec.title) || '').trim();
  const head = title.split(' - ')[0].trim();
  const avoid = head && head.length > 2 ? [head] : [];
  const domains = [];
  const rawUrl = String((spec && spec.target_url) || '');
  if (rawUrl) {
    try {
      const host = new URL(rawUrl).hostname.replace(/^www\./, '');
      if (host) domains.push(host);
    } catch (error) {
      domains.length = 0;
    }
  }
  return { avoid, domains, colors: [] };
}

export function gateSummary({ parity, sweep, contrast, threshold = 80 }) {
  const gates = [];

  if (parity) {
    const mustsDone = parity.must_have_total > 0 && parity.must_have_done === parity.must_have_total;
    gates.push({
      key: 'parity',
      pass: mustsDone && parity.feature_score >= threshold,
      score: parity.feature_score,
      label: parity.feature_score + '/100 parity, must-haves ' + parity.must_have_done + '/' + parity.must_have_total
    });
  }
  if (sweep) {
    const score = sweep.hits.length ? Math.max(0, 100 - sweep.hits.length * 10) : 100;
    gates.push({
      key: 'sweep',
      pass: sweep.hits.length === 0,
      score,
      label: sweep.hits.length ? sweep.hits.length + ' brand hits left' : 'brand sweep clean'
    });
  }
  if (contrast) {
    const score = contrast.pairs ? Math.round(100 * (1 - contrast.failing / contrast.pairs)) : 0;
    gates.push({
      key: 'contrast',
      pass: contrast.failing === 0,
      score,
      label: contrast.failing + '/' + contrast.pairs + ' pairs fail AA'
    });
  }

  const score = gates.length ? Math.round(gates.reduce((sum, gate) => sum + gate.score, 0) / gates.length) : 0;
  const verdict = !gates.length ? 'unchecked' : gates.every((gate) => gate.pass) ? 'pass' : 'blocked';
  return { gates, score, verdict, threshold };
}

// --- The eleven-stage pipeline -------------------------------------------------

function stage(key, label, status, summary, details = []) {
  return { key, label, status, summary, details: details.filter(Boolean).slice(0, 12) };
}

function lists(contracts) {
  return {
    apis: Array.isArray(contracts.api_contracts) ? contracts.api_contracts : [],
    tables: Array.isArray(contracts.inferred_schema) ? contracts.inferred_schema : [],
    traces: Array.isArray(contracts.ledger_traces) ? contracts.ledger_traces : [],
    transitions: Array.isArray(contracts.state_transitions) ? contracts.state_transitions : [],
    entities: Array.isArray(contracts.entities) ? contracts.entities : [],
    flows: Array.isArray(contracts.flows) ? contracts.flows : [],
    pages: Array.isArray(contracts.pages) ? contracts.pages : []
  };
}

function contractText(contracts) {
  try {
    return JSON.stringify(contracts || {}).toLowerCase();
  } catch (error) {
    return '';
  }
}

function reconStage(contracts) {
  const info = lists(contracts);
  const observed = info.apis.length + info.traces.length + info.tables.length + info.pages.length + info.flows.length;
  const details = [];
  info.pages.slice(0, 5).forEach((page) => details.push('screen: ' + String(page.name || page.path || page.url || 'unnamed')));
  info.flows.slice(0, 4).forEach((flow) => details.push('flow: ' + String(flow.name || flow.title || flow.trigger || 'unnamed')));
  info.traces.slice(0, 4).forEach((trace) => details.push('flow: ' + String(trace.ui_trigger || 'action') + ' -> ' + String(trace.endpoint || 'unobserved')));
  info.tables.forEach((table) => details.push('data: ' + String(table.table || 'unnamed') + ' (' + (table.columns || []).length + ' columns)'));
  return stage(
    'recon',
    'Recon',
    observed ? 'pass' : 'needs_input',
    observed
      ? info.apis.length + ' endpoints, ' + info.traces.length + ' action paths, ' + info.tables.length + ' tables mapped from captured evidence'
      : 'No captured contracts yet: run a lab pass or compile a spec first',
    details
  );
}

function architectStage(contracts, spec) {
  const info = lists(contracts);
  const stack = (spec && spec.stack) || 'Node 20 + TypeScript + Fastify + Postgres (Neon) + Docker';
  const routes = info.apis.length
    ? info.apis.slice(0, 6).map((api) => String(api.method || 'UNKNOWN').toUpperCase() + ' ' + String(api.endpoint || 'endpoint')).join(', ')
    : 'none captured';
  return stage(
    'architect',
    'Architect',
    info.apis.length && info.tables.length ? 'pass' : 'attention',
    info.tables.length + ' tables and ' + info.apis.length + ' endpoints planned on ' + stack,
    [
      'stack: ' + stack,
      'migrations: neon/schema.sql (' + info.tables.length + ' tables)',
      'routes: ' + routes,
      'tests: Vitest units plus supertest against the real routes',
      'deploy: Docker image to Railway or Fly.io'
    ]
  );
}

function designStage(contrast) {
  if (!contrast) {
    return stage('design', 'Design', 'needs_input', 'Paste the token file to check the palette', [
      'required roles: background, surface, text/base, text/muted, border, primary, primary-foreground',
      'normal text needs 4.5:1, large text 3:1, UI parts and focus rings 3:1'
    ]);
  }
  return stage(
    'design',
    'Design',
    contrast.clean ? 'pass' : 'attention',
    contrast.failing + ' of ' + contrast.pairs + ' token pairs fail AA',
    contrast.rows
      .filter((row) => row.error || !row.aa)
      .slice(0, 6)
      .map((row) => (row.error ? 'unknown token ' + row.fg : row.ratio + ':1 ' + row.fg + ' on ' + row.bg))
  );
}

function buildStage(parity) {
  if (!parity) {
    return stage('build', 'Build', 'needs_input', 'Score parity first so the build order exists', []);
  }
  const order = parity.missing.slice(0, 8).map((item, index) => (index + 1) + '. [' + item.priority + '] ' + (item.area || '-') + ': ' + item.feature);
  const mustsOpen = parity.must_have_total - parity.must_have_done;
  return stage(
    'build',
    'Build',
    mustsOpen ? 'attention' : 'pass',
    mustsOpen ? mustsOpen + ' must-have features still open' : 'Every counted must-have is built',
    order.length ? order : ['nothing missing across the counted matrix']
  );
}

function backendStage(contracts) {
  const info = lists(contracts);
  const text = contractText(contracts);
  const auth = /(auth|login|session|signin|sign-in|oauth|sso|token)/.test(text);
  const payments = /(stripe|payment|checkout|subscription|billing|invoice|price)/.test(text);
  const hosts = [];
  info.apis.forEach((api) => {
    const match = String(api.endpoint || '').match(/^https?:\/\/([^/"']+)/);
    if (match && !hosts.includes(match[1])) hosts.push(match[1]);
  });
  return stage(
    'backend',
    'Backend',
    info.apis.length ? 'pass' : 'attention',
    info.apis.length + ' routes, ' + info.tables.length + ' tables' + (auth ? ', auth surface detected' : ', no auth surface observed'),
    [
      'database: ' + (info.tables.length ? info.tables.map((table) => String(table.table || 'unnamed')).join(', ') : 'none captured'),
      'auth: ' + (auth ? 'required, model it explicitly rather than reusing the target login' : 'not observed in the captured contracts'),
      'payments: ' + (payments ? 'billing surface detected, use your own provider account' : 'none observed'),
      'integrations: ' + (hosts.length ? hosts.join(', ') : 'no external hosts observed'),
      'ownership: rebuild behaviour only, never the target credentials or private APIs'
    ]
  );
}

function testStage(contracts) {
  const info = lists(contracts);
  const cases = [];
  info.traces.slice(0, 5).forEach((trace) => cases.push('happy: ' + String(trace.ui_trigger || 'action') + ' writes ' + String(trace.table || 'the documented table')));
  info.apis.slice(0, 4).forEach((api) => cases.push('contract: ' + String(api.endpoint || 'endpoint') + ' returns the captured shape and rejects a malformed body'));
  info.transitions.slice(0, 4).forEach((edge) => cases.push('state: ' + String(edge.current_state || '?') + ' + ' + String(edge.trigger || '?') + ' -> ' + String(edge.next_state || '?') + ', every other trigger rejected'));
  cases.push('edge: double submit on the primary action creates no duplicate row');
  const total = info.traces.length + info.apis.length + info.transitions.length;
  return stage(
    'test',
    'Test',
    total ? 'pass' : 'needs_input',
    cases.length + ' planned cases from ' + total + ' captured contracts',
    cases
  );
}

function diffStage(parity) {
  if (!parity) return stage('diff', 'Diff', 'needs_input', 'Run the parity matrix to score the clone', []);
  const mustsDone = parity.must_have_total > 0 && parity.must_have_done === parity.must_have_total;
  return stage(
    'diff',
    'Diff',
    mustsDone && parity.feature_score >= 80 ? 'pass' : 'attention',
    parity.feature_score + '/100 parity, must-haves ' + parity.must_have_done + '/' + parity.must_have_total,
    parity.by_area.slice(0, 6).map((area) => area.area + ': ' + area.score + ' (' + area.features + ')')
  );
}

function entrepreneurStage() {
  return stage(
    'entrepreneur',
    'Entrepreneur',
    'needs_input',
    'Needs real review rows; nothing is invented here',
    [
      'paste a CSV with review, source, url, rating and date columns',
      'every quoted complaint keeps its row link, themes under three reviews are marked thin',
      'output: ranked complaints, fix plan and a positioning angle for the clone'
    ]
  );
}

function brandStage(sweep) {
  if (!sweep) return stage('brand', 'Brand', 'needs_input', 'Run the brand sweep to see what still carries the original', []);
  const hits = sweep.hits || [];
  return stage(
    'brand',
    'Brand',
    hits.length ? 'attention' : 'pass',
    hits.length ? hits.length + ' artifacts still carry the original name, domain or colours' : 'Clean: nothing of the original found in the artifacts',
    [
      ...hits.slice(0, 6).map((hit) => hit.kind + ' ' + hit.file + (hit.line ? ':' + hit.line : '') + ' -> ' + hit.match),
      'rename checklist: app name, package name, fly app, image tag, domain, palette'
    ]
  );
}

function launchStage(spec) {
  const title = String((spec && spec.title) || 'the rebuilt app');
  return stage(
    'launch',
    'Launch',
    'attention',
    'Landing scaffold written; the listing copy is yours to own',
    [
      'headline: rebuild of ' + title + ', in your own words',
      'sections: hero, proof, pricing, FAQ, footer',
      'App Store name 30 chars, subtitle 30, keywords 100; Play title 30, short description 80',
      'no ranking claims in the title, no competitor name in the listing'
    ]
  );
}

function deployStage(stages, bundle, sweep, parity, contrast) {
  const blockers = stages.filter((item) => item.status === 'attention').map((item) => item.key);
  const pending = stages.filter((item) => item.status === 'needs_input').map((item) => item.key);
  const files = Array.isArray(bundle) ? bundle.map((file) => file.path).filter(Boolean) : [];
  const ready = !blockers.length && sweep && sweep.clean && parity && contrast && contrast.failing === 0;
  return stage(
    'deploy',
    'Deploy',
    ready ? 'pass' : 'attention',
    ready ? 'Preflight clear: ship from your own Railway or Fly account' : 'Blocked by ' + (blockers.join(', ') || 'missing gates'),
    [
      'bundle: ' + (files.length ? files.join(', ') : 'none compiled'),
      blockers.length ? 'blocking stages: ' + blockers.join(', ') : 'no blocking stage',
      pending.length ? 'waiting on input: ' + pending.join(', ') : 'no stage waiting on input',
      'deploy runs from your accounts; this app holds no deployment credentials'
    ]
  );
}

function cloneHandoff(spec, contracts, stages) {
  const info = lists(contracts);
  const title = String((spec && spec.title) || 'Untitled rebuild');
  const lines = [
    '# ' + title + ' - 1:1 clone handoff',
    '',
    'Source surface: ' + ((spec && spec.target_url) || 'not stated'),
    'Compiled from captured contracts plus the eleven replica skill stages. Rebuild behaviour and flows, never code,',
    'assets, copy or private APIs from the source.',
    '',
    '## Stage board',
    '',
    '| stage | status | read |',
    '| --- | --- | --- |',
    ...stages.map((item) => '| ' + item.label + ' | ' + item.status + ' | ' + item.summary + ' |'),
    '',
    '## Captured surface',
    '',
    '- endpoints: ' + info.apis.length,
    '- action paths: ' + info.traces.length,
    '- lifecycle edges: ' + info.transitions.length,
    '- tables: ' + info.tables.length,
    ''
  ];
  stages.forEach((item) => {
    lines.push('## ' + item.label);
    lines.push('');
    if (item.agent) lines.push('owner: ' + item.agent + (item.pods && item.pods.length ? ' · pods: ' + item.pods.join(', ') : ''));
    lines.push(item.summary);
    if (item.details.length) {
      lines.push('');
      item.details.forEach((detail) => lines.push('- ' + detail));
    }
    lines.push('');
  });
  lines.push('## Build order');
  lines.push('');
  lines.push('1. Apply the schema and seeds, then boot /api/health.');
  lines.push('2. Implement every captured endpoint and its action path.');
  lines.push('3. Enforce the lifecycle edges and reject every other trigger.');
  lines.push('4. Cover the planned test cases, then post the run transcript to the lab to capture performance.');
  lines.push('5. Clear the parity, brand and contrast gates before deploying.');
  return lines.join('\n');
}

export function runSkillPipeline(context) {
  const spec = context.spec || null;
  const contracts = context.contracts || {};
  const stages = [
    reconStage(contracts),
    architectStage(contracts, spec),
    designStage(context.contrast || null),
    buildStage(context.parity || null),
    backendStage(contracts),
    testStage(contracts),
    diffStage(context.parity || null),
    entrepreneurStage(),
    brandStage(context.sweep || null),
    launchStage(spec)
  ];
  stages.push(deployStage(stages, spec && spec.deploy_bundle, context.sweep || null, context.parity || null, context.contrast || null));

  // Every stage carries its wired pods, owning agent and the probes its own
  // skills produced, so the board shows who ran what and on what evidence.
  const evidence = context.evidence || {};
  const wired = stages.map((item) => {
    const row = STAGE_WIRING.find((entry) => entry.stage === item.key);
    const observed = evidence[item.key];
    const details = [...item.details];
    if (observed && observed.ran) {
      details.push('probes: ' + observed.reproduced + '/' + observed.ran + ' reproduced');
      observed.lines.forEach((line) => details.push(line));
    }
    return {
      ...item,
      agent: row ? row.agent : '',
      pods: row ? row.pods : [],
      probes_run: observed ? observed.ran : 0,
      probes_reproduced: observed ? observed.reproduced : 0,
      details: details.slice(0, 12)
    };
  });

  const counts = {
    pass: wired.filter((item) => item.status === 'pass').length,
    attention: wired.filter((item) => item.status === 'attention').length,
    needs_input: wired.filter((item) => item.status === 'needs_input').length
  };
  const ready = wired.every((item) => item.status === 'pass');

  return {
    stages: wired,
    stage_counts: counts,
    ready_to_ship: ready,
    clone_handoff: cloneHandoff(spec, contracts, wired)
  };
}