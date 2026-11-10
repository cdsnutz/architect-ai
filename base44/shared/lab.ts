// Schemas, prompts and stage telemetry for the Engineering Challenge Lab.
// The prompt contract is the part that matters: a claim is only "observed" when the
// probe output states it, and anything the read surface cannot settle must be named
// as not observable instead of being filled in.

export const LAB_STAGES = [
  { key: 'inventory', label: 'Inventory authorized surfaces', pods: ['Perimeter Scout'] },
  { key: 'skills', label: 'Run unconventional skills', pods: ['Protocol Analyst', 'Schema Archaeologist'] },
  { key: 'synthesize', label: 'Synthesize findings', pods: ['Logic Reconstructor'] },
  { key: 'dossier', label: 'Write the dossier', pods: ['REA Orchestrator'] }
];

export const CHALLENGE_STAGES = [
  { key: 'scope', label: 'Scope the challenge pack', pods: ['REA Orchestrator'] },
  { key: 'skills', label: 'Run the pack skill', pods: ['Perimeter Scout', 'Protocol Analyst', 'Schema Archaeologist'] },
  { key: 'cascade', label: 'Map the cascade', pods: ['Logic Reconstructor'] },
  { key: 'dossier', label: 'Write the challenge dossier', pods: ['REA Orchestrator'] }
];

export const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    intent: { type: 'string' },
    approach: { type: 'string' },
    targets: {
      type: 'array',
      items: {
        type: 'object',
        properties: { url: { type: 'string' }, why: { type: 'string' } },
        required: ['url', 'why']
      }
    },
    questions: { type: 'array', items: { type: 'string' } },
    evidence_needed: { type: 'array', items: { type: 'string' } },
    probe_steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          step: { type: 'string' },
          method: { type: 'string' },
          target: { type: 'string' },
          why: { type: 'string' }
        },
        required: ['step', 'method', 'target', 'why']
      }
    },
    skills: { type: 'array', items: { type: 'string' } },
    pods: { type: 'array', items: { type: 'string' } }
  },
  required: ['title', 'intent', 'targets', 'questions', 'probe_steps', 'skills', 'pods']
};

export const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    confidence: { type: 'number' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          skill: { type: 'string' },
          pod: { type: 'string' },
          claim: { type: 'string' },
          observed: { type: 'boolean' },
          confidence: { type: 'number' },
          evidence: { type: 'array', items: { type: 'string' } },
          gap: { type: 'string' },
          next_probe: { type: 'string' }
        },
        required: ['skill', 'pod', 'claim', 'observed', 'evidence']
      }
    },
    gaps: { type: 'array', items: { type: 'string' } },
    unverified: { type: 'array', items: { type: 'string' } },
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
        required: ['ui_trigger', 'endpoint', 'table', 'evidence']
      }
    }
  },
  required: ['summary', 'confidence', 'findings', 'gaps', 'unverified', 'ledger_traces']
};

export const DOSSIER_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string' },
    observed: { type: 'array', items: { type: 'string' } },
    inferred: { type: 'array', items: { type: 'string' } },
    skill_results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          skill: { type: 'string' },
          observed: { type: 'boolean' },
          signal: { type: 'string' }
        },
        required: ['skill', 'observed', 'signal']
      }
    },
    falsifiers: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    next_probes: { type: 'array', items: { type: 'string' } }
  },
  required: ['verdict', 'observed', 'inferred', 'skill_results', 'falsifiers', 'risks', 'next_probes']
};

const GUARDRAIL =
  'HARD RULES:\n' +
  '- This engine observes only. It issues anonymous GET/HEAD requests. It never writes, never logs in, ' +
  'never sends a request body, and never proposes an action that changes a system.\n' +
  '- A claim is `observed` only when the probe output above literally states it. Everything else is inferred.\n' +
  '- Where the evidence does not settle a question, write "not observable from this evidence". Never name a ' +
  'mechanism, table, table schema, header or protocol that the probe output does not show.\n' +
  '- Never claim to have seen a POST body, a database row, a server log or a credential. Those are outside a ' +
  'read surface by definition.\n';

export function buildPlanPrompt({
  request,
  focus,
  skills,
  hosts
}: {
  request: string;
  focus: string;
  skills: { name: string; thesis: string; proves: string; pods: string[] }[];
  hosts: string[];
}): string {
  const skillList = skills
    .map((skill) => '- ' + skill.name + ' (' + skill.pods.join(', ') + '): ' + skill.proves)
    .join('\n');
  return (
    'You are the Lab Conductor for ArchitectAI, an engineering reverse-engineering lab. Turn the operator request ' +
    'below into a reviewable, strictly read-only probe plan.\n\n' +
    GUARDRAIL +
    '\n' +
    'PLAN RULES:\n' +
    '- `targets`: use ONLY these authorized URLs, and never invent a host or path that is not in them: ' +
    (hosts.length ? JSON.stringify(hosts) : 'NONE — the operator authorized no host, so targets must be an empty array') + '\n' +
    '- Every `probe_steps` entry must have method GET or HEAD. Each step names the target URL it reads and why that read ' +
    'answers one of the questions. Use 3 to 5 steps.\n' +
    '- `questions`: 3 to 5 questions whose answers the probes could actually settle. If a question needs a write, a ' +
    'credential or a server log, leave it out and name that limit in `evidence_needed` instead.\n' +
    '- `skills`: choose 2 to 4 names, verbatim, from this catalog:\n' +
    skillList +
    '\n- `pods`: choose from Perimeter Scout, Protocol Analyst, Schema Archaeologist, Logic Reconstructor.\n' +
    '- `intent`: restate what the operator actually needs, in one or two sentences, without overselling what a read ' +
    'surface can prove.\n\n' +
    'Focus: ' + focus + '\n' +
    'OPERATOR REQUEST:\n' + request
  );
}

export function buildFindingsPrompt({
  request,
  focus,
  skills,
  probes
}: {
  request: string;
  focus: string;
  skills: { name: string; pod?: string; proves: string; falsifier: string }[];
  probes: string;
}): string {
  const skillList = skills
    .map(
      (skill) =>
        '- ' + skill.name + ': proves ' + skill.proves + ' | falsifier: ' + skill.falsifier
    )
    .join('\n');
  return (
    'You are the pod analyst for ArchitectAI. Convert the read-only probe output below into findings, each attributed ' +
    'to the skill that produced it.\n\n' +
    GUARDRAIL +
    '\n' +
    'OUTPUT RULES:\n' +
    '- 2 to 5 findings. One finding per distinct thing the probe output shows or fails to show.\n' +
    '- `evidence`: quote the actual observation strings (status, content type, bytes, headers, shape). No paraphrase ' +
    'of a mechanism the output does not contain.\n' +
    '- `confidence`: 0-100, and keep an inferred finding under 60.\n' +
    '- `gap`: what the read surface could not settle for this finding. `next_probe`: the single next read-only read ' +
    'that would settle it, or "requires an authorized write path" when no read can.\n' +
    '- `ledger_traces`: one row per user action -> data request -> database write, only where the evidence supports the ' +
    'endpoint. When the table cannot be derived from a read surface, write "not observable" in `table` and say why in ' +
    '`evidence`. Never invent a table name to make the row look complete.\n' +
    '- `unverified`: what this pass proves nothing about. `gaps`: where the engine itself could not reach.\n' +
    '- `summary`: two sentences a staff engineer could act on.\n\n' +
    'Skills in play:\n' + skillList + '\n\n' +
    'Focus: ' + focus + '\n' +
    'Operator request: ' + request + '\n\n' +
    'READ-ONLY PROBE OUTPUT:\n' + probes
  );
}

export function buildDossierPrompt({
  packName,
  question,
  skills,
  probes,
  priorFindings
}: {
  packName: string;
  question: string;
  skills: { name: string; falsifier: string }[];
  probes: string;
  priorFindings: string;
}): string {
  return (
    'You are the REA Orchestrator writing a challenge dossier for ArchitectAI.\n\n' +
    GUARDRAIL +
    '\n' +
    'CHALLENGE: ' + packName + '\n' +
    'Question this pack exists to answer: ' + question + '\n\n' +
    'DOSSIER RULES:\n' +
    '- `verdict`: three sentences maximum. State what the read surface proved and what it cannot.\n' +
    '- `observed`: bullets that the probe output literally states. `inferred`: bullets that follow from it but were ' +
    'not seen. Never put the same bullet in both.\n' +
    '- `skill_results`: one entry per skill below, with `observed` true only when its probe produced a reproduced signal.\n' +
    '- `falsifiers`: the exact finding that would void the verdict. `risks`: what a team would ship wrong if they ' +
    'trusted this dossier too far.\n' +
    '- `next_probes`: 2 to 4 ordered read-only reads, each naming the target and what it would settle.\n\n' +
    'Skills:\n' + skills.map((skill) => '- ' + skill.name + ' | falsifier: ' + skill.falsifier).join('\n') + '\n\n' +
    'PRIOR FINDINGS FROM THE DATA REQUEST:\n' + (priorFindings || 'none') + '\n\n' +
    'PROBE OUTPUT:\n' + probes
  );
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function cleanText(value: unknown, cap = 600): string {
  return typeof value === 'string' ? value.trim().slice(0, cap) : '';
}

export function normalizePlan(
  llm: Record<string, unknown> | null,
  { authorized, skills }: { authorized: string[]; skills: { name: string }[] }
): Record<string, unknown> {
  const raw = llm || {};
  const allowed = new Set(authorized);
  const catalogNames = new Set(skills.map((skill) => skill.name));

  const targets = asArray(raw.targets)
    .map((target) => {
      const entry = target as { url?: string; why?: string };
      const url = cleanText(entry.url, 400);
      return { url, why: cleanText(entry.why, 240) };
    })
    .filter((target) => target.url && allowed.has(target.url));

  for (const url of authorized) {
    if (!targets.some((target) => target.url === url)) {
      targets.push({ url, why: 'Authorized by the operator for this request.' });
    }
  }

  const steps = asArray(raw.probe_steps)
    .map((step) => {
      const entry = step as { step?: string; method?: string; target?: string; why?: string };
      const method = cleanText(entry.method, 12).toUpperCase() || 'GET';
      return {
        step: cleanText(entry.step, 160),
        method: /^HEAD$/.test(method) ? 'HEAD' : 'GET',
        target: cleanText(entry.target, 400),
        why: cleanText(entry.why, 240)
      };
    })
    .filter((step) => step.step && targets.some((target) => target.url === step.target))
    .slice(0, 5);

  const chosen = asArray(raw.skills)
    .map((name) => cleanText(name, 80))
    .filter((name) => catalogNames.has(name));

  return {
    title: cleanText(raw.title, 120),
    intent: cleanText(raw.intent, 600),
    approach: cleanText(raw.approach, 600),
    targets,
    questions: asArray(raw.questions).map((q) => cleanText(q, 240)).filter(Boolean).slice(0, 5),
    evidence_needed: asArray(raw.evidence_needed).map((q) => cleanText(q, 240)).filter(Boolean).slice(0, 5),
    probe_steps: steps,
    skills: chosen.length ? chosen : skills.slice(0, 3).map((skill) => skill.name),
    pods: asArray(raw.pods).map((pod) => cleanText(pod, 60)).filter(Boolean).slice(0, 4)
  };
}

export function normalizeFindings(llm: Record<string, unknown> | null): Record<string, unknown>[] {
  const raw = llm || {};
  return asArray(raw.findings)
    .map((finding) => {
      const entry = finding as Record<string, unknown>;
      const confidence = Number(entry.confidence);
      return {
        skill: cleanText(entry.skill, 80),
        pod: cleanText(entry.pod, 60),
        claim: cleanText(entry.claim, 800),
        observed: entry.observed === true,
        confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(100, Math.round(confidence))) : 0,
        evidence: asArray(entry.evidence).map((item) => cleanText(item, 300)).filter(Boolean).slice(0, 6),
        gap: cleanText(entry.gap, 400),
        next_probe: cleanText(entry.next_probe, 400)
      };
    })
    .filter((finding) => finding.claim)
    .slice(0, 6);
}

export function normalizeTraces(llm: Record<string, unknown> | null): Record<string, string>[] {
  const raw = llm || {};
  return asArray(raw.ledger_traces)
    .map((trace) => {
      const entry = trace as Record<string, unknown>;
      return {
        ui_trigger: cleanText(entry.ui_trigger, 160),
        endpoint: cleanText(entry.endpoint, 200),
        table: cleanText(entry.table, 120) || 'not observable',
        evidence: cleanText(entry.evidence, 300)
      };
    })
    .filter((trace) => trace.ui_trigger || trace.endpoint)
    .slice(0, 8);
}

export function clampConfidence(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

export function seedStages(seeds: { key: string; label: string; pods: string[] }[]) {
  return seeds.map((seed) => ({
    key: seed.key,
    label: seed.label,
    pods: seed.pods,
    status: 'queued',
    detail: '',
    started_at: '',
    finished_at: ''
  }));
}

export async function patchStage(
  base44: any,
  entityName: string,
  id: string,
  key: string,
  patch: Record<string, string>
) {
  if (!id) return;
  try {
    const record = await base44.entities[entityName].get(id);
    const stages = (Array.isArray(record.stages) ? record.stages : []).map((stage: any) =>
      stage.key === key ? { ...stage, ...patch } : stage
    );
    await base44.entities[entityName].update(id, { stages });
  } catch (error) {
    console.log('lab: could not patch stage ' + key + ' — ' + (error && error.message));
  }
}

export function stageRunning(base44: any, entityName: string, id: string, key: string) {
  return patchStage(base44, entityName, id, key, { status: 'running', started_at: new Date().toISOString() });
}

export function stageComplete(base44: any, entityName: string, id: string, key: string, detail: string) {
  return patchStage(base44, entityName, id, key, {
    status: 'complete',
    detail: detail || '',
    finished_at: new Date().toISOString()
  });
}