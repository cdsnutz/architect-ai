// Pod-run telemetry. One ReaRun record per pod pass, patched stage by stage while
// the pass runs, so the tracker can follow the pods instead of guessing at them.
// Tracking is auxiliary: a failure here is logged and never breaks the analysis.

type StageSeed = { key: string; pods: string[]; label: string };

// The stages a mapping pass actually runs, and the pods that own each one.
export const POD_STAGES: StageSeed[] = [
  { key: 'perimeter', pods: ['Perimeter Scout'], label: 'Inventory the client surface' },
  { key: 'protocol', pods: ['Protocol Analyst'], label: 'Content-negotiation probe' },
  { key: 'map', pods: ['Schema Archaeologist', 'Logic Reconstructor'], label: 'Data model and logic pass' },
  { key: 'write', pods: ['REA Orchestrator'], label: 'Write the dossier' }
];

export const PASTED_POD_STAGES: StageSeed[] = [
  { ...POD_STAGES[0], label: 'Parse the pasted capture' },
  ...POD_STAGES.slice(1)
];

export function mapDetail(llm) {
  if (!llm) return 'No structured output returned';
  const count = (value) => (Array.isArray(value) ? value.length : 0);
  return (
    count(llm.api_contracts) + ' contracts · ' + count(llm.inferred_schema) + ' tables · ' +
    count(llm.ledger_traces) + ' traces · ' + count(llm.state_transitions) + ' transitions'
  );
}

function nowIso() {
  return new Date().toISOString();
}

function describe(error) {
  return error && error.message ? error.message : 'unknown error';
}

export function seedStages(seeds: StageSeed[]) {
  return seeds.map((seed) => ({
    key: seed.key,
    pods: seed.pods,
    label: seed.label,
    status: 'queued',
    detail: '',
    started_at: '',
    finished_at: ''
  }));
}

export async function startRun(base44, targetUrl, mode, seeds: StageSeed[]) {
  try {
    return await base44.entities.ReaRun.create({
      target_url: targetUrl,
      mode,
      status: 'running',
      stages: seedStages(seeds)
    });
  } catch (error) {
    console.log('runTracker: could not open a run — ' + describe(error));
    return null;
  }
}

async function patchStage(base44, runId, key, patch) {
  if (!runId) return;
  try {
    const run = await base44.entities.ReaRun.get(runId);
    const stages = (Array.isArray(run.stages) ? run.stages : []).map((stage) =>
      stage.key === key ? { ...stage, ...patch } : stage
    );
    await base44.entities.ReaRun.update(runId, { stages });
  } catch (error) {
    console.log('runTracker: could not patch stage ' + key + ' — ' + describe(error));
  }
}

export function markRunning(base44, runId, key) {
  return patchStage(base44, runId, key, { status: 'running', started_at: nowIso() });
}

export function markComplete(base44, runId, key, detail, extra: Record<string, any> = {}) {
  return patchStage(base44, runId, key, {
    status: 'complete',
    detail: detail || '',
    finished_at: nowIso(),
    ...extra
  });
}

export function markNeedsInput(base44, runId, key, detail, extra: Record<string, any> = {}) {
  return patchStage(base44, runId, key, {
    status: 'needs_input',
    detail: detail || '',
    finished_at: nowIso(),
    ...extra
  });
}

export function markSkipped(base44, runId, key, detail) {
  return patchStage(base44, runId, key, {
    status: 'skipped',
    detail: detail || '',
    finished_at: nowIso()
  });
}

export async function finishRun(base44, runId, status, extra: { analysis_id?: string; error?: string } = {}) {
  if (!runId) return;
  try {
    const run = await base44.entities.ReaRun.get(runId);
    const stages = (Array.isArray(run.stages) ? run.stages : []).map((stage) => {
      if (status !== 'failed') return stage;
      if (stage.status === 'running') return { ...stage, status: 'failed', finished_at: nowIso() };
      if (stage.status === 'queued') return { ...stage, status: 'failed', detail: 'Not reached' };
      return stage;
    });
    await base44.entities.ReaRun.update(runId, {
      status,
      stages,
      analysis_id: extra.analysis_id || '',
      error: extra.error || '',
      finished_at: nowIso()
    });
  } catch (error) {
    console.log('runTracker: could not close the run — ' + describe(error));
  }
}