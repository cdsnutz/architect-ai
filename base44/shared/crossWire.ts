// The cross-wire: one map that binds the eleven replica stages to the lab's pods,
// the lab's read-only skills, and the in-app agent that owns each stage.
//
// Nothing here invents evidence. Each row states what a stage needs captured and
// which read-only skills can produce it, so a pod runs the same stage the skill
// board scores.

import { SKILLS } from './labSkills.ts';

export type StageWiring = {
  stage: string;
  label: string;
  pods: string[];
  skills: string[];
  agent: string;
  capture: string;
  produces: string;
};

export const CLONE_STAGES = [
  { key: 'inventory', label: 'Capture the site', pods: ['Perimeter Scout'] },
  { key: 'skills', label: 'Run the wired skills', pods: ['Protocol Analyst', 'Schema Archaeologist', 'Logic Reconstructor'] },
  { key: 'contracts', label: 'Synthesize captured contracts', pods: ['Logic Reconstructor'] },
  { key: 'spec', label: 'Compile the rebuild spec', pods: ['REA Orchestrator'] },
  { key: 'clone', label: 'Run the eleven-stage clone', pods: ['REA Orchestrator'] }
];

export const STAGE_WIRING: StageWiring[] = [
  {
    stage: 'recon',
    label: 'Recon',
    pods: ['Perimeter Scout', 'Schema Archaeologist'],
    skills: ['boundary-posture', 'bundle-exposure', 'framework-archaeology', 'sourcemap-exposure'],
    agent: 'analysis_guide',
    capture: 'Bounded same-origin crawl of every reachable page',
    produces: 'pages, routes, forms, bundles'
  },
  {
    stage: 'architect',
    label: 'Architect',
    pods: ['Schema Archaeologist', 'Logic Reconstructor'],
    skills: ['orphaned-read', 'type-drift', 'contract-erosion'],
    agent: 'structure_advisor',
    capture: 'Form actions, endpoint strings and response shapes',
    produces: 'stack, schema, route plan'
  },
  {
    stage: 'design',
    label: 'Design',
    pods: ['Logic Reconstructor'],
    skills: ['bundle-exposure'],
    agent: 'structure_advisor',
    capture: 'Stylesheets and token file you paste',
    produces: 'token contrast report'
  },
  {
    stage: 'build',
    label: 'Build',
    pods: ['Protocol Analyst', 'Logic Reconstructor'],
    skills: ['ghost-write', 'cascade-cartography'],
    agent: 'challenge_coach',
    capture: 'Action paths from the feature matrix',
    produces: 'ordered build queue'
  },
  {
    stage: 'backend',
    label: 'Backend',
    pods: ['Protocol Analyst', 'Schema Archaeologist'],
    skills: ['ghost-write', 'contract-erosion', 'validator-integrity', 'retry-entropy'],
    agent: 'structure_advisor',
    capture: 'Endpoints, validators, retry and auth surfaces',
    produces: 'routes, tables, auth model'
  },
  {
    stage: 'test',
    label: 'Test',
    pods: ['Protocol Analyst', 'Logic Reconstructor'],
    skills: ['silence-mapper', 'variance-key', 'cascade-cartography'],
    agent: 'test_steward',
    capture: 'Lifecycle edges and refusal behaviour',
    produces: 'planned test cases'
  },
  {
    stage: 'diff',
    label: 'Diff',
    pods: ['Logic Reconstructor'],
    skills: ['cascade-cartography', 'orphaned-read'],
    agent: 'run_reviewer',
    capture: 'Feature matrix scored against the clone',
    produces: 'parity score and missing list'
  },
  {
    stage: 'entrepreneur',
    label: 'Entrepreneur',
    pods: ['REA Orchestrator'],
    skills: [],
    agent: 'analysis_guide',
    capture: 'Review rows the operator supplies',
    produces: 'ranked complaints and positioning'
  },
  {
    stage: 'brand',
    label: 'Brand',
    pods: ['Perimeter Scout'],
    skills: ['framework-archaeology'],
    agent: 'challenge_coach',
    capture: 'Deploy bundle plus the original name, domain and colours',
    produces: 'rename sweep hits'
  },
  {
    stage: 'launch',
    label: 'Launch',
    pods: ['REA Orchestrator'],
    skills: [],
    agent: 'onboarding_guide',
    capture: 'Positioning from the dossier',
    produces: 'landing and listing copy'
  },
  {
    stage: 'deploy',
    label: 'Deploy',
    pods: ['REA Orchestrator', 'Perimeter Scout'],
    skills: ['boundary-posture', 'sourcemap-exposure'],
    agent: 'run_reviewer',
    capture: 'Gate results plus deploy bundle',
    produces: 'preflight verdict'
  }
];

export const LAB_PODS = ['Perimeter Scout', 'Protocol Analyst', 'Schema Archaeologist', 'Logic Reconstructor', 'REA Orchestrator'];

export function wiringForStage(stage: string): StageWiring | null {
  return STAGE_WIRING.find((row) => row.stage === stage) || null;
}

export function stagesForPod(pod: string): StageWiring[] {
  return STAGE_WIRING.filter((row) => row.pods.includes(pod));
}

export function wiredSkillIds(): string[] {
  const ids: string[] = [];
  STAGE_WIRING.forEach((row) => row.skills.forEach((id) => { if (!ids.includes(id)) ids.push(id); }));
  return ids;
}

export type ProbeResultRow = {
  skill: string;
  reproduced: boolean;
  observations: string[];
  signal: string;
};

// Attributes each probe to the stages whose wiring names its skill, so a stage
// reports the evidence its own pods produced rather than a summary of everything.
export function stageEvidenceFromProbes(results: ProbeResultRow[]) {
  const byStage: Record<string, { pods: string[]; agent: string; lines: string[]; ran: number; reproduced: number }> = {};
  STAGE_WIRING.forEach((row) => {
    byStage[row.stage] = { pods: row.pods, agent: row.agent, lines: [], ran: 0, reproduced: 0 };
  });

  results.forEach((result) => {
    const skill = SKILLS.find((item) => item.name === result.skill);
    if (!skill) return;
    STAGE_WIRING.filter((row) => row.skills.includes(skill.id)).forEach((row) => {
      const entry = byStage[row.stage];
      entry.ran += 1;
      if (result.reproduced) entry.reproduced += 1;
      if (entry.lines.length < 4) {
        entry.lines.push(
          (result.reproduced ? 'reproduced: ' : 'no signal: ') + skill.name + ' — ' + String(result.signal || '').slice(0, 220)
        );
      }
    });
  });

  return byStage;
}

export function crossWireMatrix() {
  const pods = LAB_PODS.map((pod) => {
    const rows = stagesForPod(pod);
    const skills: string[] = [];
    rows.forEach((row) => row.skills.forEach((id) => { if (!skills.includes(id)) skills.push(id); }));
    return {
      pod,
      stages: rows.map((row) => row.stage),
      agents: [...new Set(rows.map((row) => row.agent))],
      skills: skills.map((id) => {
        const skill = SKILLS.find((item) => item.id === id);
        return { id, name: skill ? skill.name : id };
      })
    };
  });

  return {
    stages: STAGE_WIRING,
    pods,
    skill_count: wiredSkillIds().length,
    clone_stages: CLONE_STAGES
  };
}