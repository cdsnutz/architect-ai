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
    detail: 'Static literal reading of the target\'s own public bundles for route and endpoint strings, plus framework markers. No binary decompilation runs here and no obfuscated payload is executed.'
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
  { key: 'validation', label: 'Validation · Symmetry gate', pods: ['recon', 'reverse', 'reconstruct'], agents: ['REA-Logic-Agent'] }
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

// Static literal reading of the bundles the document already requested. Bounded
// by count and bytes, same-origin only, and nothing is ever evaluated.
async function readBundleRoutes(origin: string, scriptUrls: string[]) {
  const ROUTE = /["'`](\/(?:api|v[0-9]|graphql|rest|rpc|internal|admin)\/[A-Za-z0-9_\-./{}$:]{1,80})["'`]/g;
  const FRAMEWORK = /\b(react|vue|svelte|angular|next|nuxt|remix|astro|ember|jquery|backbone)[@/.\-]?([0-9][\w.]*)?/gi;
  const routes = new Set<string>();
  const frameworks = new Set<string>();
  const read: { url: string; bytes: number }[] = [];

  const targets = scriptUrls.slice(0, MAX_SCRIPTS);
  const texts = await Promise.all(
    targets.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': UA, Accept: '*/*' },
          redirect: 'follow',
          signal: AbortSignal.timeout(9000)
        });
        if (!res.ok) return { url, text: '' };
        const text = (await res.text()).slice(0, SCRIPT_CAP);
        return { url, text };
      } catch {
        return { url, text: '' };
      }
    })
  );

  for (const bundle of texts) {
    if (!bundle.text) continue;
    read.push({ url: bundle.url, bytes: bundle.text.length });
    for (const match of bundle.text.matchAll(ROUTE)) {
      if (routes.size >= 60) break;
      routes.add(match[1]);
    }
    for (const match of bundle.text.matchAll(FRAMEWORK)) {
      if (frameworks.size >= 12) break;
      frameworks.add((match[1] + (match[2] ? ' ' + match[2] : '')).toLowerCase().trim());
    }
  }

  return {
    bundles: read,
    routes: [...routes],
    frameworks: [...frameworks],
    note: read.length
      ? routes.size + ' route literal(s) and ' + frameworks.size + ' framework marker(s) read from ' + read.length + ' public bundle(s). Literals are what the bundle names, not routes the server proves it serves.'
      : 'No same-origin bundle could be read, so the route literals stay unobserved.'
  };
}

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

export async function runSovereignMirror(body: any) {
  const target = assertPublicUrl(body.target_url);
  const candidate = typeof body.candidate_url === 'string' && body.candidate_url.trim()
    ? assertPublicUrl(body.candidate_url)
    : '';
  const grant = assertAuthorization(body.auth_basis, body.attestation);

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
  const reversal = await readBundleRoutes(origin, scripts);
  const transitions = transitionClasses(pass.graph);
  touch(
    'reversal',
    close(stages.find((stage) => stage.key === 'reversal'), {
      status: 'complete',
      skills: ['JS_Bundle_Reversal', 'State_Machine_Map'],
      detail: reversal.routes.length + ' route literal(s) · ' + transitions.rows.length + ' transition class(es)'
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

  return {
    target_url: target,
    candidate_url: candidate,
    auth_basis: grant.basis,
    attestation: grant.attestation,
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