/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// The Sovereign Mirror pipeline: one orchestration over the read-only evidence
// this lab already collects. Pods own stages, each agent states the skill it
// ran and what that skill could actually reach, and the mirror is gated on a
// measured symmetry score rather than on resemblance.
//
// Three things the brief asks for are refused by design, and the run says so
// in the stage that would have done them:
//   - hidden-asset discovery is bounded prediction plus confirmation, never a
//     fuzz sweep;
//   - state synchronisation inventories key names only, so no session value is
//     ever read, stored or injected;
//   - the mirror is emitted as a deployable artifact for a target you are
//     authorised to rebuild, never re-served from a proxy.

import { assertPublicUrl } from './readOnly.ts';
import { assertAuthorization, runSymmetryPass } from './symmetry.ts';
import { captureSite } from './siteCapture.ts';
import { readBundleIntelligence } from './bundleIntel.ts';
import { runFeedbackLoop } from './assetLoop.ts';

const UA = 'REVENGINE-SovereignMirror/1.0 (+authorized read-only pass)';
const MAX_SCRIPTS = 3;
const SCRIPT_CAP = 400000;

export const MIRROR_PODS = [
  {
    id: 'recon',
    name: 'POD A · Reconnaissance',
    thesis: 'The signal',
    agents: [
      { name: 'Shannon-Scout', module: 'Shannon', skill: 'Asset_Entropy_Probe' },
      { name: 'Topology-Mapper', module: 'Graph theory', skill: 'Topology_Map' }
    ]
  },
  {
    id: 'reverse',
    name: 'POD B · Reverse engineering',
    thesis: 'The brain',
    agents: [
      { name: 'Ghidra-Decoder', module: 'Ghidra', skill: 'JS_Bundle_Reversal' },
      { name: 'REA-Logic-Agent', module: 'REA agents', skill: 'State_Machine_Map' }
    ]
  },
  {
    id: 'reconstruct',
    name: 'POD C · Reconstruction',
    thesis: 'The body',
    agents: [
      { name: 'Replica-Weaver', module: 'Replica', skill: 'DOM_Capture' },
      { name: 'Symmetry-Engineer', module: 'Latency PID', skill: 'Temporal_Symmetry' }
    ]
  }
];

// What each skill is allowed to reach, stated once so a stage cannot overclaim.
export const SKILLS = [
  {
    key: 'Asset_Entropy_Probe',
    agent: 'Shannon-Scout',
    reach: 'bounded',
    detail: 'Indexed asset families are predicted and probed inside a fixed budget. A predicted sibling is an inference until a response confirms it.'
  },
  {
    key: 'Topology_Map',
    agent: 'Topology-Mapper',
    reach: 'bounded',
    detail: 'Directed graph of what the served document and call sites actually name. Navigation links are tagged apart from load dependencies.'
  },
  {
    key: 'JS_Bundle_Reversal',
    agent: 'Ghidra-Decoder',
    reach: 'bounded',
    detail: 'The public bundle is treated as the binary: the build manifest is the symbol table, the chunk graph is the call graph, and route strings are recovered from the chunks. When the payload is obfuscated the reader switches to pattern matching instead of literal reading. No payload is executed and no obfuscated string is decoded.'
  },
  {
    key: 'Live_Feedback_Loop',
    agent: 'Shannon-Scout',
    reach: 'bounded',
    detail: 'Each round confirms what the transition model predicted, writes the confirmation back into the graph and re-plans inside a fixed probe budget. The loop closes on evidence; it never sweeps the asset space.'
  },
  {
    key: 'Pod_Latency_Tuning',
    agent: 'Symmetry-Engineer',
    reach: 'bounded',
    detail: 'Measured pod durations are reconciled against the origin signature and expressed as one tuned hold plus per-agent budgets. The engineer is the last agent to touch the run, so the number it publishes is the number that ships.'
  },
  {
    key: 'State_Machine_Map',
    agent: 'REA-Logic-Agent',
    reach: 'bounded',
    detail: 'Transition classes are derived from observed triggers and state key names. Transition bodies that need an authenticated session stay labelled unverified.'
  },
  {
    key: 'DOM_Capture',
    agent: 'Replica-Weaver',
    reach: 'bounded',
    detail: 'Page inventory, asset manifest and byte totals are captured. Assets are catalogued for your own rebuild, never inlined and re-served from here.'
  },
  {
    key: 'Temporal_Symmetry',
    agent: 'Symmetry-Engineer',
    reach: 'bounded',
    detail: 'Round-trip percentiles and jitter are measured, then expressed as a PID setpoint you apply on your own edge. The lab never sits in the request path.'
  },
  {
    key: 'State_Synchronization',
    agent: 'REA-Logic-Agent',
    reach: 'refused',
    detail: 'Mirroring a live session means capturing and replaying someone\'s credentials. Key names are inventoried; values are never read, stored or injected.'
  },
  {
    key: 'Sovereign_Rehost',
    agent: 'Replica-Weaver',
    reach: 'refused',
    detail: 'Serving a copy of another origin is content re-hosting. The run emits a deployable artifact and commands for a surface you are authorised to rebuild.'
  }
];

export const STAGE_SEEDS = [
  { key: 'discovery', label: 'Step 1 · Discovery', pods: ['recon'], agents: ['Shannon-Scout', 'Topology-Mapper'] },
  { key: 'reversal', label: 'Step 2 · Reversal', pods: ['reverse'], agents: ['Ghidra-Decoder', 'REA-Logic-Agent'] },
  { key: 'capture', label: 'Step 3 · Capture', pods: ['reconstruct'], agents: ['Replica-Weaver'] },
  { key: 'virtualization', label: 'Step 4 · Virtualization', pods: ['reconstruct'], agents: ['Symmetry-Engineer'] },
  { key: 'loop', label: 'Step 5 · Live loop', pods: ['recon'], agents: ['Shannon-Scout'] },
  { key: 'validation', label: 'Validation · Symmetry gate', pods: ['recon', 'reverse', 'reconstruct'], agents: ['REA-Logic-Agent'] },
  { key: 'tuning', label: 'Final · Tune', pods: ['reconstruct'], agents: ['Symmetry-Engineer'] }
];

export const MIRROR_GATE = 99;

function nowIso() {
  return new Date().toISOString();
}

function describe(error: any) {
  return error && error.message ? error.message : 'unknown error';
}

function seedStages() {
  return STAGE_SEEDS.map((seed) => ({
    key: seed.key,
    label: seed.label,
    pods: seed.pods,
    agents: seed.agents,
    status: 'queued',
    detail: '',
    skills: [] as string[],
    started_at: '',
    finished_at: ''
  }));
}

function close(stage, patch) {
  return { ...stage, ...patch, finished_at: nowIso() };
}

// The bundle read lives in bundleIntel.ts: manifest as symbol table, chunk graph
// as call graph, and a pattern-matching reader when the payload is obfuscated.

function transitionClasses(graph: any) {
  const counts: Record<string, number> = {};
  for (const edge of graph.edges || []) {
    const key = String(edge.trigger || 'unknown');
    counts[key] = (counts[key] || 0) + 1;
  }
  const rows = Object.entries(counts)
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count);
  return {
    rows,
    note: rows.length
      ? rows.length + ' trigger class(es) observed. Each class is a state transition the rebuild has to reproduce; the bodies behind them need an authorized session to confirm.'
      : 'No trigger was observed, so no transition could be classified.'
  };
}

function artifactBundle(input: {
  target: string;
  pass: any;
  capture: any;
  routes: string[];
  latency: any;
}) {
  const { target, pass, capture, routes, latency } = input;
  const manifest = {
    target,
    captured_at: nowIso(),
    graph: { nodes: pass.graph.counts.nodes, edges: pass.graph.counts.edges, counts: pass.graph.counts },
    entropy: { probed: pass.entropy.probed, confirmed: pass.entropy.confirmed },
    routes,
    state_keys: pass.state,
    latency: pass.latency,
    pages: capture ? capture.routes || capture.pages || [] : []
  };

  return [
    {
      path: 'mirror/manifest.json',
      note: 'Everything the pass observed, in one machine-readable file.',
      content: JSON.stringify(manifest, null, 2)
    },
    {
      path: 'mirror/STATE_KEYS.md',
      note: 'Key names only. Values were never read, so none can leak.',
      content: [
        '# State keys inventoried',
        '',
        'Cookies: ' + (pass.state.cookie_names.join(', ') || 'none visible'),
        'localStorage: ' + (pass.state.local_keys.join(', ') || 'none visible'),
        'sessionStorage: ' + (pass.state.session_keys.join(', ') || 'none visible'),
        '',
        pass.state.note
      ].join('\n')
    },
    {
      path: 'mirror/LATENCY.md',
      note: 'The PID setpoint a mirror on your own edge should hold.',
      content: [
        '# Temporal signature',
        '',
        'Samples: ' + latency.samples,
        'p50 / p95: ' + (latency.target ? latency.target.p50 + ' / ' + latency.target.p95 + ' ms' : 'not measured'),
        'Jitter: ' + (latency.target ? '±' + latency.target.jitter + ' ms' : 'not measured'),
        'PID setpoint: ' + (latency.pid ? latency.pid.setpoint_ms + ' ms ±' + latency.pid.tolerance_ms : 'not measured'),
        'Hold to add at your edge: ' + (latency.hold_ms !== undefined ? latency.hold_ms + ' ms' : 'not measured'),
        '',
        latency.guidance || latency.note || ''
      ].join('\n')
    },
    {
      path: 'mirror/DEPLOY.md',
      note: 'Handoff. Nothing here is served from the lab.',
      content: [
        '# Deploy the mirror on your own infrastructure',
        '',
        'This pass produced evidence and an inventory, not a re-hosted copy. The mirror is built',
        'from your own rebuild against these contracts, on a surface you are authorised to run.',
        '',
        '```',
        'fly launch --name sovereign-mirror --no-deploy',
        'fly deploy',
        '```',
        '',
        'Apply the latency setpoint from LATENCY.md at your edge, then re-run this pipeline with',
        'candidate_url pointed at your deploy to score symmetry against the origin.'
      ].join('\n')
    }
  ];
}

// Pod latency reconciliation. Pods run in sequence, so their durations add up,
// and Symmetry-Engineer reconciles the total against the origin signature last.
// Nothing is delayed here: the pass is off the request path. The output is the
// hold plus the per-agent budget your deployment should be tuned to.
export function tunePods(stages: any[], latency: any, loop: any) {
  const timings = stages
    .filter((stage) => stage.key !== 'tuning' && stage.started_at && stage.finished_at)
    .map((stage) => ({
      key: stage.key,
      label: stage.label,
      agents: stage.agents || [],
      ms: Math.max(0, new Date(stage.finished_at).getTime() - new Date(stage.started_at).getTime())
    }));

  const total = timings.reduce((sum, part) => sum + part.ms, 0);
  const setpoint = latency && latency.pid ? latency.pid.setpoint_ms : null;
  const hold = latency && latency.hold_ms !== undefined ? latency.hold_ms : null;
  // The signature is setpoint = hold + your own serve. The hold is the only thing
  // tuning adds to a visitor's clock; pod durations stay build-time overhead.
  const serveBudget = setpoint !== null && hold !== null ? setpoint - hold : null;
  const trimTargets = [...timings]
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 3)
    .map((part) => ({ agents: part.agents.join(' + '), key: part.key, ms: part.ms }));

  const verdict = setpoint === null || hold === null ? 'unmeasured' : 'tuned';
  const note =
    verdict === 'unmeasured'
      ? 'No timing setpoint came back from the origin, so there is no signature to tune the rebuild against.'
      : 'Pod lag totals ' + total + ' ms and none of it reaches a visitor: this pass runs off the request path. What ships is a ' +
        hold + ' ms hold at your edge inside a ' + setpoint + ' ms signature, leaving ' + serveBudget +
        ' ms for your own serve. The engineer publishes the slowest pods (' +
        (trimTargets.map((target) => target.agents + ' ' + target.ms + ' ms').join(', ') || 'none') +
        ') as trim targets instead of concealing them: padding a mirror to hide real processing is what makes it read as artificial.';

  return {
    gatekeeper: 'Symmetry-Engineer',
    order: timings.map((part) => part.key),
    timings,
    total_ms: total,
    setpoint_ms: setpoint,
    serve_budget_ms: serveBudget,
    hold_ms: hold,
    trim_targets: trimTargets,
    loop_state: loop ? loop.verdict : 'unknown',
    loop_surface: loop && loop.surface ? loop.surface : null,
    verdict,
    note
  };
}

export async function runSovereignMirror(body: any) {
  const target = assertPublicUrl(body.target_url);
  const candidate = typeof body.candidate_url === 'string' && body.candidate_url.trim()
    ? assertPublicUrl(body.candidate_url)
    : '';
  const grant = await assertAuthorization(body.auth_basis, body.attestation, target);

  let stages = seedStages();
  const touch = (key: string, patch: any) => {
    stages = stages.map((stage) => (stage.key === key ? { ...stage, ...patch } : stage));
  };

  // Step 1 — discovery. Shannon entropy families plus the dependency graph.
  touch('discovery', { status: 'running', started_at: nowIso() });
  const pass = await runSymmetryPass({ target, candidate: candidate || undefined });
  const origin = new URL(target).origin;
  touch(
    'discovery',
    close(
      stages.find((stage) => stage.key === 'discovery'),
      {
        status: 'complete',
        skills: ['Asset_Entropy_Probe', 'Topology_Map'],
        detail:
          pass.graph.counts.nodes + ' nodes · ' + pass.graph.counts.edges + ' edges · ' +
          pass.entropy.probed + ' predicted siblings probed, ' + pass.entropy.confirmed + ' confirmed'
      }
    )
  );

  // Step 2 — reversal. Static literals from public bundles, then transition classes.
  touch('reversal', { status: 'running', started_at: nowIso() });
  const scripts = (pass.graph.nodes || []).filter((n: any) => n.kind === 'script' && n.url.startsWith(origin)).map((n: any) => n.url);
  const reversal = await readBundleIntelligence(origin, scripts, MAX_SCRIPTS, SCRIPT_CAP);
  const transitions = transitionClasses(pass.graph);
  touch(
    'reversal',
    close(stages.find((stage) => stage.key === 'reversal'), {
      status: 'complete',
      skills: ['JS_Bundle_Reversal', 'State_Machine_Map'],
      detail:
        reversal.routes.length + ' route/endpoint candidate(s) via ' + reversal.mode + ' reading · ' +
        (reversal.manifest ? reversal.manifest.kind + ' manifest mapped to ' + reversal.manifest.chunks + ' chunk(s)' : 'no build manifest published') +
        ' · ' + transitions.rows.length + ' transition class(es)'
    })
  );

  // Step 3 — capture. Page and asset inventory for your own rebuild.
  touch('capture', { status: 'running', started_at: nowIso() });
  let capture: any = null;
  let captureError = '';
  try {
    capture = await captureSite(target, { maxPages: 6 });
  } catch (error: any) {
    captureError = describe(error);
  }
  touch(
    'capture',
    close(stages.find((stage) => stage.key === 'capture'), {
      status: capture ? 'complete' : 'failed',
      skills: ['DOM_Capture'],
      detail: capture
        ? (capture.page_count || (capture.pages || []).length) + ' page(s) inventoried · assets catalogued, nothing inlined or re-served'
        : 'Capture failed: ' + captureError
    })
  );

  // Step 4 — virtualization. Timing setpoint and the state-sync refusal.
  touch('virtualization', { status: 'running', started_at: nowIso() });
  const latency = pass.latency || {};
  const setpoint = latency.pid
    ? {
        setpoint_ms: latency.pid.setpoint_ms,
        tolerance_ms: latency.pid.tolerance_ms,
        hold_ms: latency.hold_ms,
        band_ms: latency.band_ms,
        basis: latency.signature,
        note: latency.guidance
      }
    : {
        setpoint_ms: null,
        hold_ms: 0,
        basis: 'no timing sample',
        note: 'Run again against a reachable origin to measure a setpoint.'
      };
  touch(
    'virtualization',
    close(stages.find((stage) => stage.key === 'virtualization'), {
      status: 'complete',
      skills: ['Temporal_Symmetry'],
      detail: latency.samples
        ? latency.samples + ' timing sample(s) · jitter ±' + (latency.target ? latency.target.jitter : 0) + ' ms · setpoint ready'
        : 'No timing sample came back, so the setpoint is unmeasured.'
    })
  );

  // Step 5 — the live loop. Shannon-Scout does not stop at one pass: it confirms
  // what the model predicted, writes the confirmation back and predicts again.
  touch('loop', { status: 'running', started_at: nowIso() });
  const walk = ['document', ...(pass.graph.edges || []).filter((edge: any) => edge.trigger !== 'document_link').map((edge: any) => edge.to)];
  const loop = await runFeedbackLoop({
    origin,
    surface: candidate ? new URL(candidate).origin : origin,
    plan: pass.markov ? pass.markov.plan : [],
    nodes: pass.graph.nodes || [],
    edges: pass.graph.edges || [],
    walk,
    budget: 8,
    rounds: 2
  });
  touch(
    'loop',
    close(stages.find((stage) => stage.key === 'loop'), {
      status: 'complete',
      skills: ['Live_Feedback_Loop'],
      detail:
        loop.probed + ' predicted asset(s) probed ' + (loop.probes_your_deploy ? 'against your deploy' : 'against the origin') +
        ' across ' + loop.rounds.length + ' round(s) · ' + loop.confirmed.length + ' confirmed · ' +
        loop.missing.length + ' absent · state: ' + loop.verdict
    })
  );

  // Validation — the gate is measured, never asserted.
  const score = pass.fidelity.score;
  const blockers = (pass.fidelity.components || [])
    .filter((part: any) => part.earned < part.weight)
    .map((part: any) => part.name + ' (' + part.earned + '/' + part.weight + ')');
  const passed = score >= MIRROR_GATE;
  touch(
    'validation',
    close(stages.find((stage) => stage.key === 'validation'), {
      status: passed ? 'complete' : 'needs_input',
      skills: [],
      detail: passed
        ? 'Symmetry ' + score + '% clears the ' + MIRROR_GATE + '% gate.'
        : 'Symmetry ' + score + '% is below the ' + MIRROR_GATE + '% gate. Blocking components: ' + (blockers.join(', ') || 'none listed')
    })
  );

  // Final — tuning. Symmetry-Engineer touches the run last, after every pod has
  // reported, so the number it publishes is the number the rebuild ships with.
  touch('tuning', { status: 'running', started_at: nowIso() });
  const tuning = tunePods(stages, latency, loop);
  touch(
    'tuning',
    close(stages.find((stage) => stage.key === 'tuning'), {
      status: 'complete',
      skills: ['Pod_Latency_Tuning', 'Temporal_Symmetry'],
      detail:
        tuning.setpoint_ms === null || tuning.hold_ms === null
          ? 'No setpoint measured, so tuning stays unmeasured.'
          : 'hold ' + tuning.hold_ms + ' ms inside a ' + tuning.setpoint_ms + ' ms signature · serve budget ' +
            tuning.serve_budget_ms + ' ms · pod lag ' + tuning.total_ms + ' ms off-path · ' + tuning.verdict
    })
  );

  return {
    target_url: target,
    candidate_url: candidate,
    auth_basis: grant.basis,
    attestation: grant.attestation,
    ownership: grant.ownership,
    stages,
    pods: MIRROR_PODS,
    skills: SKILLS,
    symmetry_score: score,
    fidelity: pass.fidelity,
    gate: {
      threshold: MIRROR_GATE,
      score,
      passed,
      verdict: passed ? 'gate passed' : 'gate not reached',
      blockers,
      ceiling: pass.fidelity.ceiling
    },
    discovery: {
      graph: pass.graph,
      entropy: pass.entropy,
      isomorphism: pass.isomorphism,
      markov: pass.markov,
      diff: pass.diff || null
    },
    reversal: { ...reversal, transitions },
    capture: {
      captured: Boolean(capture),
      error: captureError,
      site: capture
        ? {
            pages: capture.page_count,
            routes: capture.route_paths || [],
            styles: (capture.stylesheets && capture.stylesheets.files) || [],
            bundles: capture.bundles || [],
            forms: capture.forms || [],
            total_bytes: capture.total_bytes,
            limits: capture.limits
          }
        : null
    },
    virtualization: { latency, setpoint, state: pass.state },
    loop,
    tuning,
    live_state: loop.verdict,
    bundles: {
      mode: reversal.mode,
      manifest: reversal.manifest,
      manifest_note: reversal.manifest_note,
      bundles: reversal.bundles,
      frameworks: reversal.frameworks,
      storage_keys: reversal.storage_keys
    },
    artifacts: artifactBundle({ target, pass, capture, routes: reversal.routes, latency }),
    refusals: SKILLS.filter((skill) => skill.reach === 'refused'),
    notes: pass.notes
  };
}

export function mirrorSummary(run: any) {
  if (!run) return '';
  return (
    (run.gate ? run.gate.score + '% symmetry, ' + run.gate.verdict : 'no gate') +
    ' · ' + (run.stages || []).filter((s: any) => s.status === 'complete').length + ' of ' +
    (run.stages || []).length + ' stages closed'
  );
}