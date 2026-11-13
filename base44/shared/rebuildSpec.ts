/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Deterministic rebuild-spec compiler.
//
// Reads captured contracts (api_contracts, inferred_schema, state_transitions,
// ledger_traces) and emits three artifacts with no network calls and no claim
// beyond what the evidence established:
//   1. specMarkdown  - the Claude Code handoff document
//   2. runnableSpec  - the run contract the lab executes and reports against
//   3. deployBundle  - Dockerfile / railway.json / fly.toml / Neon schema / env
//
// Anything the contracts do not settle is emitted as an explicit open question
// instead of being guessed.

const TYPE_MAP = {
  string: 'text',
  text: 'text',
  number: 'numeric',
  integer: 'integer',
  int: 'integer',
  boolean: 'boolean',
  bool: 'boolean',
  date: 'date',
  datetime: 'timestamptz',
  timestamp: 'timestamptz',
  'date-time': 'timestamptz',
  json: 'jsonb',
  object: 'jsonb',
  array: 'jsonb',
  uuid: 'uuid',
  email: 'text',
  url: 'text',
  enum: 'text'
};

export function sqlType(type) {
  const key = String(type || '').trim().toLowerCase().replace(/<.*$/, '').split(/[\s(]/)[0];
  return TYPE_MAP[key] || 'text';
}

export function slug(text) {
  return String(text || 'rebuild')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'rebuild';
}

function asArray(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];
}

function str(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function contractsFromAnalysis(record) {
  const map = (record && record.logic_map) || {};
  return {
    api_contracts: asArray(map.api_contracts),
    inferred_schema: asArray(map.inferred_schema),
    state_transitions: asArray(map.state_transitions),
    ledger_traces: asArray(map.ledger_traces),
    entities: asArray(map.data_entities),
    flows: asArray(map.user_flows),
    pages: asArray(map.page_structure)
  };
}

export function contractsFromRequest(record) {
  const traces = asArray(record && record.ledger_traces).map((trace) => ({
    ui_trigger: str(trace.ui_trigger) || 'unstated action',
    endpoint: str(trace.endpoint),
    table: str(trace.table),
    evidence: str(trace.evidence)
  }));
  return {
    api_contracts: traces
      .filter((trace) => trace.endpoint)
      .map((trace) => ({
        method: 'UNKNOWN',
        endpoint: trace.endpoint,
        ui_trigger: trace.ui_trigger,
        linked_table: trace.table || 'unlinked',
        evidence: trace.evidence
      })),
    inferred_schema: [],
    state_transitions: [],
    ledger_traces: traces,
    entities: [],
    flows: [],
    pages: []
  };
}

export function countContracts(contracts) {
  return {
    api_contracts: contracts.api_contracts.length,
    inferred_schema: contracts.inferred_schema.length,
    state_transitions: contracts.state_transitions.length,
    ledger_traces: contracts.ledger_traces.length
  };
}

export function contractGaps(contracts) {
  const gaps = [];
  if (!contracts.inferred_schema.length) gaps.push('No inferred schema captured: the database layer is unmodelled.');
  if (!contracts.api_contracts.length) gaps.push('No API contracts captured: the request surface is unmodelled.');
  if (!contracts.state_transitions.length) gaps.push('No state transitions captured: lifecycle rules must be decided, not copied.');
  if (!contracts.ledger_traces.length) gaps.push('No ledger traces captured: no action-to-write path is proven.');
  contracts.api_contracts.forEach((c) => {
    if (!str(c.method) || str(c.method).toUpperCase() === 'UNKNOWN') {
      gaps.push('Method unobserved for ' + (str(c.endpoint) || 'an endpoint') + ' (read-only probing cannot mutate, so verbs are unresolved).');
    }
  });
  return gaps;
}

export function schemaSql(contracts) {
  const tables = contracts.inferred_schema.length
    ? contracts.inferred_schema
    : contracts.entities.map((e) => ({
        table: e.name,
        columns: (e.likely_fields || []).map((field) => ({ name: field, type: 'text' }))
      }));

  if (!tables.length) return '-- No table structure captured. Model the schema from the spec before running build.\n';

  const statements = tables
    .filter((table) => str(table.table))
    .map((table) => {
      const name = slug(table.table).replace(/-/g, '_');
      const columns = (table.columns || []).filter((col) => str(col && col.name));
      const body = columns.map((col) => {
        const constraints = Array.isArray(col.constraints) ? col.constraints : [];
        const notNull = constraints.some((c) => /required|not.?null/i.test(String(c)));
        const unique = constraints.some((c) => /unique/i.test(String(c)));
        return '  ' + slug(col.name).replace(/-/g, '_') + ' ' + sqlType(col.type) +
          (notNull ? ' not null' : '') + (unique ? ' unique' : '');
      });
      body.unshift('  id uuid primary key default gen_random_uuid()');
      body.push('  created_at timestamptz not null default now()');
      body.push('  updated_at timestamptz not null default now()');
      return '-- ' + (str(table.purpose) || 'captured table') + '\ncreate table if not exists ' + name + ' (\n' + body.join(',\n') + '\n);';
    });

  return statements.length
    ? 'create extension if not exists "pgcrypto";\n\n' + statements.join('\n\n') + '\n'
    : '-- No table structure captured.\n';
}

export function routeTable(contracts) {
  if (!contracts.api_contracts.length) return '| verb | path | trigger | table | evidence |\n| --- | --- | --- | --- | --- |\n| TBD | TBD | no contract captured | TBD | none |';
  const rows = contracts.api_contracts.map((c) => {
    const verb = (str(c.method) || 'UNKNOWN').toUpperCase();
    return '| ' + verb + ' | `' + (str(c.endpoint) || 'TBD') + '` | ' + (str(c.ui_trigger) || 'unstated') +
      ' | ' + (str(c.linked_table) || 'unlinked') + ' | ' + (str(c.evidence) || 'observed only') + ' |';
  });
  return '| verb | path | trigger | table | evidence |\n| --- | --- | --- | --- | --- |\n' + rows.join('\n');
}

export function transitionTable(contracts) {
  if (!contracts.state_transitions.length) return '_No lifecycle edges captured._';
  const rows = contracts.state_transitions.map((t) =>
    '| ' + (str(t.entity) || 'object') + ' | ' + (str(t.current_state) || str(t.from_state) || '?') + ' | ' +
    (str(t.trigger) || '?') + ' | ' + (str(t.next_state) || str(t.to_state) || '?') + ' | ' + (str(t.endpoint) || '-') + ' |'
  );
  return '| entity | from | trigger | to | endpoint |\n| --- | --- | --- | --- | --- |\n' + rows.join('\n');
}

export function traceList(contracts) {
  if (!contracts.ledger_traces.length) return '_No action-to-write path captured._';
  return contracts.ledger_traces
    .map((t, i) => (i + 1) + '. `' + (str(t.ui_trigger) || 'action') + '` -> `' + (str(t.endpoint) || 'endpoint unobserved') +
      '` -> table `' + (str(t.table) || 'unlinked') + '`' + (str(t.evidence) ? '  \n   evidence: ' + str(t.evidence) : ''))
    .join('\n');
}

export function acceptanceCriteria(contracts) {
  const lines = [];
  contracts.ledger_traces.forEach((t) => {
    lines.push('- [ ] `' + (str(t.ui_trigger) || 'action') + '` reaches `' + (str(t.endpoint) || 'its handler') +
      '` and changes `' + (str(t.table) || 'the documented table') + '`; verified by an integration test.');
  });
  contracts.api_contracts.forEach((c) => {
    lines.push('- [ ] `' + ((str(c.method) || 'UNKNOWN').toUpperCase()) + ' ' + (str(c.endpoint) || 'endpoint') +
      '` returns the captured response shape for a valid request and rejects a malformed one.');
  });
  contracts.state_transitions.forEach((t) => {
    lines.push('- [ ] `' + (str(t.current_state) || '?') + '` + `' + (str(t.trigger) || '?') + '` lands in `' +
      (str(t.next_state) || '?') + '`, and every other trigger is rejected.');
  });
  if (!lines.length) lines.push('- [ ] No contract captured, so no parity assertion can be made yet. Capture contracts first.');
  return lines.join('\n');
}

export function specMarkdown(contracts, meta) {
  const gaps = contractGaps(contracts);
  return [
    '# ' + meta.title + ' - Rebuild Specification',
    '',
    'Source surface: ' + (meta.target_url || 'not stated'),
    'Compiled: ' + new Date().toISOString().slice(0, 10) + ' from captured contracts only.',
    'Target stack: ' + meta.stack,
    '',
    '## 0. Evidence rules',
    '',
    'Act as a senior full-stack engineer. Build the application below from these contracts.',
    'Where a contract is marked UNKNOWN or inferring a verb, choose an implementation and record the decision in',
    '`DECISIONS.md`. Never present an inference as an observed fact, and never claim parity for a behavior that',
    'has no contract behind it.',
    '',
    gaps.length ? 'Known evidence gaps:\n\n' + gaps.map((g) => '- ' + g).join('\n') : 'No evidence gaps were detected across the captured contract classes.',
    '',
    '## 1. Stack',
    '',
    '- Runtime: Node 20, TypeScript, single service',
    '- HTTP: Fastify (routes in `src/routes`, one module per contract class)',
    '- Data: Postgres on Neon, plain SQL migrations in `neon/`',
    '- Tests: Vitest for units, supertest against the real routes',
    '- Deploy: Docker image to Railway or Fly.io',
    '',
    '## 2. Data model',
    '',
    contracts.inferred_schema.length + ' table(s) and ' + contracts.entities.length + ' inferred entity record(s) were captured.',
    'The DDL in `neon/schema.sql` is the starting schema. Add indexes for every column used in a filter or join.',
    '',
    '## 3. API surface',
    '',
    routeTable(contracts),
    '',
    '## 4. Lifecycle rules',
    '',
    transitionTable(contracts),
    '',
    '## 5. Action to write paths',
    '',
    traceList(contracts),
    '',
    '## 6. Acceptance criteria',
    '',
    acceptanceCriteria(contracts),
    '',
    '## 7. Seed data',
    '',
    'Populate every table with realistic placeholder records: at least 3 per table, covering each state in the',
    'lifecycle table so the run contract can exercise real transitions.',
    '',
    '## 8. Build phases',
    '',
    '1. Schema and migrations: `neon/schema.sql` applies to a clean Neon branch, seeds load.',
    '2. Routes and handlers: every row in section 3 exists and answers.',
    '3. Lifecycle enforcement: every edge in section 4 works, every other trigger is rejected.',
    '4. Run the contract: `npm run build && npm test`, then serve and pass the probe stage.',
    '',
    '## 9. Deploy',
    '',
    'The deploy bundle ships `Dockerfile`, `railway.json`, `fly.toml`, `neon/schema.sql` and `.env.example`.',
    'Deployment itself runs from your own Railway / Fly account and your own Neon project.',
    '',
    '## 10. Handoff',
    '',
    'Paste sections 0-9 into Claude Code together with the deploy bundle, run it locally, then post the run',
    'output back into the lab so performance is captured against this spec.',
    '',
    '## 11. Replica gates',
    '',
    'Before the deploy stage, run the replica skill gates on this spec: parity against the feature matrix, a brand',
    'sweep for anything still carrying the original name, domain or colours, and a WCAG contrast pass on the design',
    'tokens. Any blocked gate stops the launch; the results are stored on the spec, not in this document.'
  ].join('\n');
}

export function runnableSpec(contracts, meta) {
  const app = slug(meta.title);
  const endpoints = contracts.api_contracts
    .map((c) => str(c.endpoint))
    .filter((endpoint) => endpoint.startsWith('/'));

  return {
    schema_version: 1,
    kind: 'rebuild-run',
    title: meta.title,
    stack: meta.stack,
    stages: [
      { key: 'install', run: 'npm ci', expect: 'exit 0', fail_fast: true },
      { key: 'migrate', run: 'psql "$DATABASE_URL" -f neon/schema.sql', expect: 'exit 0' },
      { key: 'build', run: 'npm run build', expect: 'exit 0', fail_fast: true },
      { key: 'test', run: 'npm test -- --run', expect: 'exit 0', capture: ['test_passed', 'test_failed'] },
      { key: 'serve', run: 'npm run start &', wait_for: 'http://localhost:3000/api/health', timeout_s: 60 },
      {
        key: 'probe',
        run: 'for p in ' + (endpoints.length ? endpoints.join(' ') : '/api/health') + '; do curl -s -o /dev/null -w "$p %{http_code} %{time_total}\\n" "http://localhost:3000$p"; done',
        capture: ['endpoints_total', 'endpoints_ok', 'p95_latency_ms']
      },
      {
        key: 'replica-gates',
        run: 'replicaSkill { action: "run_all", spec_id }',
        expect: 'parity must-haves done, brand sweep clean, contrast AA pass',
        capture: ['parity_score', 'sweep_hits', 'contrast_fails']
      }
    ],
    capture: {
      post_to: 'captureRunOutput',
      fields: ['spec_id', 'stdout', 'exit_code', 'metrics'],
      metrics: ['build_seconds', 'test_passed', 'test_failed', 'endpoints_total', 'endpoints_ok', 'p95_latency_ms', 'parity_score', 'sweep_hits', 'contrast_fails']
    },
    run_contract: 'Every stage runs against the rebuilt app on your machine. Post the transcript and metrics back to the lab to capture performance.',
    app_name: app
  };
}

export function deployBundle(contracts, meta) {
  const app = slug(meta.title);
  const endpoints = contracts.api_contracts.map((c) => str(c.endpoint)).filter((e) => e.startsWith('/'));

  const dockerfile = [
    'FROM node:20-alpine AS build',
    'WORKDIR /app',
    'COPY package*.json ./',
    'RUN npm ci',
    'COPY . .',
    'RUN npm run build',
    '',
    'FROM node:20-alpine',
    'WORKDIR /app',
    'ENV NODE_ENV=production',
    'COPY --from=build /app/node_modules ./node_modules',
    'COPY --from=build /app/dist ./dist',
    'COPY --from=build /app/package.json ./package.json',
    'EXPOSE 3000',
    'CMD ["node", "dist/server.js"]'
  ].join('\n');

  const railway = JSON.stringify(
    {
      $schema: 'https://railway.com/railway.schema.json',
      build: { builder: 'DOCKERFILE', dockerfilePath: 'Dockerfile' },
      deploy: {
        startCommand: 'node dist/server.js',
        healthcheckPath: '/api/health',
        healthcheckTimeout: 120,
        restartPolicyType: 'ON_FAILURE',
        numReplicas: 1
      }
    },
    null,
    2
  );

  const fly = [
    'app = "' + app + '"',
    'primary_region = "iad"',
    '',
    '[build]',
    '  dockerfile = "Dockerfile"',
    '',
    '[env]',
    '  NODE_ENV = "production"',
    '  PORT = "3000"',
    '',
    '[http_service]',
    '  internal_port = 3000',
    '  force_https = true',
    '  auto_stop_machines = "stop"',
    '  auto_start_machines = true',
    '  min_machines_running = 0',
    '',
    '[[http_service.checks]]',
    '  interval = "30s"',
    '  timeout = "5s"',
    '  grace_period = "20s"',
    '  method = "GET"',
    '  path = "/api/health"',
    '',
    '[vm]',
    '  memory = "512mb"',
    '  cpu_kind = "shared"',
    '  cpus = 1'
  ].join('\n');

  const env = [
    '# Neon pooled connection string (host contains -pooler)',
    'DATABASE_URL=postgres://user:password@ep-xxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    'PORT=3000',
    'NODE_ENV=production'
  ].join('\n');

  const deployNotes = [
    '# Deploy: Neon + Railway + Fly.io',
    '',
    '## 1. Neon (database)',
    '',
    '```bash',
    'neonctl projects create --name ' + app,
    'neonctl connection-string --project-id <id> --pooled   # -> DATABASE_URL',
    'psql "$DATABASE_URL" -f neon/schema.sql',
    '```',
    '',
    'Copy the pooled connection string; both platforms read the same `DATABASE_URL`.',
    '',
    '## 2. Railway',
    '',
    '```bash',
    'npm i -g @railway/cli',
    'railway login',
    'railway init -n ' + app,
    'railway variables --set DATABASE_URL="$DATABASE_URL"',
    'railway up',
    'railway domain',
    '```',
    '',
    '`railway.json` pins the Dockerfile build and the `/api/health` healthcheck.',
    '',
    '## 3. Fly.io',
    '',
    '```bash',
    'fly auth login',
    'fly launch --name ' + app + ' --no-deploy --copy-config',
    'fly secrets set DATABASE_URL="$DATABASE_URL"',
    'fly deploy',
    'fly status',
    '```',
    '',
    '## 4. Verify',
    '',
    endpoints.length
      ? endpoints.map((e) => '```bash\ncurl -i https://<your-host>' + e + '\n```').join('\n')
      : '```bash\ncurl -i https://<your-host>/api/health\n```',
    '',
    'Deployment runs from your own accounts; nothing here holds your credentials.'
  ].join('\n');

  return [
    { path: 'Dockerfile', content: dockerfile, note: 'Multi-stage Node 20 build used by both Railway and Fly.' },
    { path: 'railway.json', content: railway, note: 'Dockerfile build plus HTTP healthcheck.' },
    { path: 'fly.toml', content: fly, note: 'Fly app config with a health check on /api/health.' },
    { path: '.env.example', content: env, note: 'Copy to .env; the same DATABASE_URL works on every target.' },
    { path: 'neon/schema.sql', content: schemaSql(contracts), note: 'Captured schema rendered as Postgres DDL.' },
    { path: 'DEPLOY.md', content: deployNotes, note: 'Exact commands for Neon, Railway and Fly.io.' }
  ];
}

export function compileSpec(contracts, meta) {
  return {
    contracts,
    contract_counts: countContracts(contracts),
    spec_markdown: specMarkdown(contracts, meta),
    runnable_spec: runnableSpec(contracts, meta),
    deploy_bundle: deployBundle(contracts, meta)
  };
}