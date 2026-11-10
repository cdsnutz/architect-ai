// One validation pass over a dossier. Shared by the single-dossier endpoint and by
// the scheduled sweep, so the rule set lives in exactly one place.

export const VERDICTS = ['verified', 'partial', 'blocked'];

const VALIDATION_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: VERDICTS },
    parity_score: { type: 'number' },
    rationale: { type: 'string' },
    verified_claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: { claim: { type: 'string' }, evidence: { type: 'string' } },
        required: ['claim', 'evidence']
      }
    },
    unverified_claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: { claim: { type: 'string' }, why_unverified: { type: 'string' } },
        required: ['claim', 'why_unverified']
      }
    },
    contradictions: {
      type: 'array',
      items: {
        type: 'object',
        properties: { finding: { type: 'string' }, conflicts_with: { type: 'string' } },
        required: ['finding', 'conflicts_with']
      }
    },
    next_probe: { type: 'string' }
  },
  required: ['verdict', 'parity_score', 'rationale', 'verified_claims', 'unverified_claims', 'contradictions', 'next_probe']
};

function buildPrompt(record: any) {
  return (
    'You are the validation pod of a reverse-engineering engine. You receive a dossier that was inferred from a live web app, and you audit it against its own evidence.\n\n' +
    'Rules that override everything else:\n' +
    '- A claim is verified ONLY when the dossier contains a concrete observation that supports it (a captured response, a header, a visible state, a named route).\n' +
    '- Everything else is unverified. Never upgrade an inference to a fact because it is plausible.\n' +
    '- When two findings cannot both be true, record a contradiction instead of picking a winner.\n' +
    '- parity_score is 0-100: the share of the map that is anchored to evidence, not the share that sounds right.\n' +
    '- verdict is "verified" when the map is usable as-is, "partial" when it is usable but carries unverified load-bearing claims, "blocked" when the map is too thin to build from.\n' +
    '- next_probe must be a single concrete, read-only action that would resolve the largest remaining gap.\n\n' +
    'TARGET: ' + (record.url || 'unknown') + '\n' +
    'ACCESS STATE: ' + (record.access_state || 'public') + '\n\n' +
    'DOSSIER (JSON):\n' + JSON.stringify(record.logic_map || {}, null, 2)
  );
}

export async function validateDossier(base44: any, record: any) {
  const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: buildPrompt(record),
    response_json_schema: VALIDATION_SCHEMA
  });

  const result = typeof llm === 'string' ? safeParse(llm) : llm;
  const verdict = VERDICTS.includes(result?.verdict) ? result.verdict : 'partial';
  const score = Number.isFinite(Number(result?.parity_score)) ? Math.min(100, Math.max(0, Math.round(Number(result.parity_score)))) : 0;

  const validation = {
    verdict,
    parity_score: score,
    rationale: result?.rationale || '',
    verified_claims: result?.verified_claims || [],
    unverified_claims: result?.unverified_claims || [],
    contradictions: result?.contradictions || [],
    next_probe: result?.next_probe || '',
    validated_at: new Date().toISOString()
  };

  const pipelineStatus = verdict === 'blocked' ? 'needs_review' : 'validated';
  const log = Array.isArray(record.pipeline_log) ? record.pipeline_log.slice(-19) : [];

  await base44.asServiceRole.entities.SiteAnalysis.update(record.id, {
    validation,
    pipeline_status: pipelineStatus,
    pipeline_log: [
      ...log,
      {
        step: 'reaValidate',
        status: verdict,
        note: 'Parity ' + score + '/100 · ' + validation.unverified_claims.length + ' unverified',
        at: new Date().toISOString()
      }
    ]
  });

  return { analysis_id: record.id, verdict, parity_score: score, pipeline_status: pipelineStatus, validation };
}

function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}