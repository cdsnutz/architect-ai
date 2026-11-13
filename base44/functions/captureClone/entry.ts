import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { CLONE_STAGES, STAGE_WIRING, crossWireMatrix, wiredSkillIds } from '../../shared/crossWire.ts';
import { SKILLS } from '../../shared/labSkills.ts';
import { selectProbes, runProbe, formatProbes, assertPublicUrl } from '../../shared/readOnly.ts';
import { captureSite } from '../../shared/siteCapture.ts';
import { compileSpec } from '../../shared/rebuildSpec.ts';
import { deriveFeatureMatrix, scoreParity, sweepArtifacts, deriveSweepTargets, runSkillPipeline } from '../../shared/replicaSkill.ts';
import { startRun, markRunning, markComplete, finishRun } from '../../shared/runTracker.ts';
import { seedStages, stageRunning, stageComplete } from '../../shared/lab.ts';

const DEFAULT_STACK = 'Node 20 + TypeScript + Fastify + Postgres (Neon) + Docker';

const CONTRACTS_SCHEMA = {
  type: 'object',
  properties: {
    api_contracts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          method: { type: 'string' },
          endpoint: { type: 'string' },
          ui_trigger: { type: 'string' },
          evidence: { type: 'string' }
        },
        required: ['endpoint', 'evidence']
      }
    },
    inferred_schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          table: { type: 'string' },
          purpose: { type: 'string' },
          columns: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, type: { type: 'string' } },
              required: ['name', 'type']
            }
          }
        },
        required: ['table', 'purpose']
      }
    },
    state_transitions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          entity: { type: 'string' },
          current_state: { type: 'string' },
          trigger: { type: 'string' },
          next_state: { type: 'string' },
          evidence: { type: 'string' }
        },
        required: ['entity', 'current_state', 'next_state']
      }
    },
    ledger_traces: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ui_trigger: { type: 'string' },
          endpoint: { type: 'string' },
          table: { type: 'string' },
          evidence: { type: 'string' }
        },
        required: ['ui_trigger', 'endpoint', 'evidence']
      }
    },
    entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, likely_fields: { type: 'array', items: { type: 'string' } } },
        required: ['name']
      }
    },
    flows: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, steps: { type: 'array', items: { type: 'string' } } },
        required: ['name']
      }
    },
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, path: { type: 'string' }, purpose: { type: 'string' } },
        required: ['name', 'path']
      }
    }
  },
  required: ['api_contracts', 'inferred_schema', 'state_transitions', 'ledger_traces', 'entities', 'flows', 'pages']
};

function asArray(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];
}

function buildPrompt(capture, probes, target) {
  const skillLines = STAGE_WIRING.map(
    (row) => '- stage ' + row.stage + ' (' + row.pods.join(', ') + '): needs ' + row.capture + ' -> ' + row.produces
  ).join('\n');
  const pageLines = capture.pages
    .map(
      (page) =>
        '- ' + page.path + ' [' + page.status + '] ' + (page.title || 'untitled') +
        ' | forms ' + page.forms.length + ' | scripts ' + page.scripts.length + ' | links ' + page.internal_links
    )
    .join('\n');

  return (
    'You are the Logic Reconstructor pod for ArchitectAI, turning a read-only capture of ' + target +
    ' into contracts for a behavioural rebuild.\n\n' +
    'HARD RULES:\n' +
    '- Use only what the capture and probe output below literally contain. If a table name, verb or header is not shown, ' +
    'write "not observable" in that field rather than inventing one.\n' +
    '- api_contracts: one row per endpoint or form action the capture actually exposed. Method is "UNKNOWN" when the page ' +
    'did not state it.\n' +
    '- inferred_schema: one row per data object the pages and forms imply, with only the columns the inputs name.\n' +
    '- state_transitions: only edges the surface states (a status in a link, a step in a flow). Otherwise return an empty array.\n' +
    '- ledger_traces: action -> endpoint -> table, only where the endpoint is captured. Table "not observable" when unknown.\n' +
    '- pages: every captured path, named by its title.\n' +
    '- Never claim to have seen a POST body, a database row or a server log.\n\n' +
    'STAGE WIRING (what each stage needs):\n' + skillLines + '\n\n' +
    'CAPTURED PAGES (' + capture.page_count + '):\n' + pageLines + '\n\n' +
    'FORMS: ' + JSON.stringify(capture.forms) + '\n\n' +
    'READ-ONLY PROBE OUTPUT:\n' + probes
  );
}

export default async function (req) {
  let specId = null;
  let telemetryId = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const requestId = typeof body.data_request_id === 'string' ? body.data_request_id : '';
    if (!requestId) {
      return Response.json({ error: 'Pass a data_request_id whose authorized targets name the site to capture.' }, { status: 400 });
    }

    const source = await base44.entities.DataRequest.get(requestId).catch(() => null);
    if (!source) return Response.json({ error: 'That data request was not found.' }, { status: 404 });
    if (source.created_by_id && source.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targets = [];
    for (const raw of Array.isArray(source.authorized_targets) ? source.authorized_targets : []) {
      try {
        const safe = assertPublicUrl(raw);
        if (!targets.includes(safe)) targets.push(safe);
      } catch {
        // Drop a host the engine may no longer probe.
      }
    }
    let wanted = targets[0];
    if (typeof body.target_url === 'string' && body.target_url) {
      let probe = '';
      try {
        probe = assertPublicUrl(body.target_url);
      } catch {
        probe = '';
      }
      const match = probe
        ? targets.find((item) => item === probe || new URL(item).origin === new URL(probe).origin)
        : '';
      if (!match) {
        return Response.json(
          { error: 'That host is not authorized on this data request. Authorize it on the request first.' },
          { status: 403 }
        );
      }
      wanted = match;
    }
    if (!wanted) {
      return Response.json({ error: 'That data request has no authorized host to capture.' }, { status: 400 });
    }

    const skillIds = wiredSkillIds();
    const skills = SKILLS.filter((skill) => skillIds.includes(skill.id));
    const stack = typeof body.stack === 'string' && body.stack.trim() ? body.stack.trim() : DEFAULT_STACK;

    const seed = await base44.entities.RebuildSpec.create({
      title: 'Capture of ' + wanted,
      target_url: wanted,
      source_request_id: source.id,
      stack,
      contracts: {},
      contract_counts: {},
      status: 'running',
      notes: 'Cross-wire run in the lab. ' + skills.length + ' wired skills across ' + STAGE_WIRING.length + ' replica stages.'
    });
    specId = seed.id;

    const telemetry = await startRun(base44, wanted, 'live', CLONE_STAGES);
    telemetryId = telemetry ? telemetry.id : null;

    // 1. Capture the site.
    await stageRunning(base44, 'RebuildSpec', specId, 'inventory');
    await markRunning(base44, telemetryId, 'inventory');
    const capture = await captureSite(wanted);
    const captureDetail = capture.page_count + ' pages · ' + capture.route_paths.length + ' routes · ' + capture.forms.length + ' forms';
    await stageComplete(base44, 'RebuildSpec', specId, 'inventory', captureDetail);
    await markComplete(base44, telemetryId, 'inventory', captureDetail);

    // 2. Run every wired skill against the captured host.
    await stageRunning(base44, 'RebuildSpec', specId, 'skills');
    await markRunning(base44, telemetryId, 'skills');
    const pairs = selectProbes(skills, [wanted], Math.max(6, skills.length));
    const results = await Promise.all(pairs.map((pair) => runProbe(pair.probe, pair.skill, pair.target)));
    const reproduced = results.filter((result) => result.reproduced).length;
    const skillsDetail = results.length + ' probes · ' + reproduced + ' reproduced';
    await stageComplete(base44, 'RebuildSpec', specId, 'skills', skillsDetail);
    await markComplete(base44, telemetryId, 'skills', skillsDetail);

    // 3. Synthesize the contracts from capture plus probe output.
    await stageRunning(base44, 'RebuildSpec', specId, 'contracts');
    await markRunning(base44, telemetryId, 'contracts');
    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildPrompt(capture, formatProbes(results), wanted),
      response_json_schema: CONTRACTS_SCHEMA
    });
    const contracts = {
      api_contracts: asArray(llm && llm.api_contracts).slice(0, 40),
      inferred_schema: asArray(llm && llm.inferred_schema).slice(0, 20),
      state_transitions: asArray(llm && llm.state_transitions).slice(0, 30),
      ledger_traces: asArray(llm && llm.ledger_traces).slice(0, 30),
      entities: asArray(llm && llm.entities).slice(0, 20),
      flows: asArray(llm && llm.flows).slice(0, 20),
      pages: asArray(llm && llm.pages).slice(0, 20),
      capture: {
        page_count: capture.page_count,
        route_paths: capture.route_paths,
        forms: capture.forms,
        bundles: capture.bundles,
        external_hosts: capture.external_hosts,
        total_bytes: capture.total_bytes,
        limits: capture.limits,
        captured_at: capture.captured_at
      }
    };
    const contractsDetail =
      contracts.api_contracts.length + ' endpoints · ' + contracts.inferred_schema.length + ' tables · ' +
      contracts.ledger_traces.length + ' traces';
    await stageComplete(base44, 'RebuildSpec', specId, 'contracts', contractsDetail);
    await markComplete(base44, telemetryId, 'contracts', contractsDetail);

    // 4. Compile the rebuild spec and deploy bundle.
    await stageRunning(base44, 'RebuildSpec', specId, 'spec');
    await markRunning(base44, telemetryId, 'spec');
    const meta = { title: capture.pages[0] && capture.pages[0].title ? capture.pages[0].title : wanted, target_url: wanted, stack };
    const compiled = compileSpec(contracts, meta);
    const specDetail = compiled.deploy_bundle.length + ' deploy files · ' + compiled.contract_counts.api_contracts + ' routes';
    await stageComplete(base44, 'RebuildSpec', specId, 'spec', specDetail);
    await markComplete(base44, telemetryId, 'spec', specDetail);

    // 5. Run the eleven-stage clone board over what was captured.
    await stageRunning(base44, 'RebuildSpec', specId, 'clone');
    await markRunning(base44, telemetryId, 'clone');
    const parity = scoreParity(deriveFeatureMatrix(contracts));
    const sweep = sweepArtifacts(compiled.deploy_bundle, deriveSweepTargets({ title: meta.title, target_url: wanted }));
    const pipeline = runSkillPipeline({ spec: { ...meta, deploy_bundle: compiled.deploy_bundle }, contracts, parity, sweep, contrast: null });

    const cloneDetail =
      pipeline.stage_counts.pass + '/' + pipeline.stages.length + ' stages pass · parity ' + parity.feature_score +
      ' · ' + pipeline.stage_counts.attention + ' open';
    await stageComplete(base44, 'RebuildSpec', specId, 'clone', cloneDetail);
    await markComplete(base44, telemetryId, 'clone', cloneDetail);
    await finishRun(base44, telemetryId, 'complete', { analysis_id: specId });

    const saved = await base44.entities.RebuildSpec.update(specId, {
      title: meta.title,
      contracts,
      contract_counts: compiled.contract_counts,
      spec_markdown: compiled.spec_markdown,
      runnable_spec: compiled.runnable_spec,
      deploy_bundle: compiled.deploy_bundle,
      status: 'captured',
      replica: {
        parity,
        sweep,
        stages: pipeline.stages,
        stage_counts: pipeline.stage_counts,
        ready_to_ship: pipeline.ready_to_ship,
        clone_handoff: pipeline.clone_handoff,
        wiring: crossWireMatrix(),
        checked_at: new Date().toISOString(),
        checked_by: user.email || user.id
      },
      notes: 'Captured ' + capture.page_count + ' pages and ' + results.length + ' probes. ' + capture.limits
    });

    return Response.json({
      spec: saved,
      capture: {
        page_count: capture.page_count,
        route_paths: capture.route_paths,
        forms: capture.forms,
        bundles: capture.bundles,
        external_hosts: capture.external_hosts,
        total_bytes: capture.total_bytes,
        limits: capture.limits
      },
      wiring: crossWireMatrix()
    });
  } catch (error) {
    const reason = error && error.message ? error.message : 'unknown error';
    console.log('captureClone failed: ' + reason);
    try {
      const base44 = createClientFromRequest(req);
      if (specId) {
        await base44.entities.RebuildSpec.update(specId, { status: 'failed', notes: 'Cross-wire run failed: ' + reason });
      }
      if (telemetryId) await finishRun(base44, telemetryId, 'failed', { error: reason });
    } catch (cleanupError) {
      console.log('captureClone cleanup failed: ' + (cleanupError && cleanupError.message));
    }
    return Response.json({ error: 'The capture and clone run failed: ' + reason }, { status: 500 });
  }
}