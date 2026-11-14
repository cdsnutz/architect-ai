/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

/**
 * The order a full clone runs in. Each stage names the module that owns it,
 * what goes in, what comes out, and the gate that has to hold before the
 * next stage is worth starting.
 */
export const CLONE_STAGES = [
  {
    key: "capture",
    label: "Capture the surface",
    module: "/workspace",
    moduleLabel: "Workspace",
    does: "Point the reader at a URL, or paste a capture when the surface sits behind a gate. The analyzer writes a dossier: title, logic map and a rebuild prompt.",
    produces: "SiteAnalysis dossier",
    gate: "A dossier exists and its access state is recorded."
  },
  {
    key: "frame",
    label: "Frame the request",
    module: "/lab",
    moduleLabel: "Lab",
    does: "Turn the engineering question into intent, the questions to answer, the read-only probe steps, and an explicit list of authorized targets.",
    produces: "DataRequest plan",
    gate: "Every target is listed and authorized before anything is probed."
  },
  {
    key: "evidence",
    label: "Read the evidence",
    module: "/lab",
    moduleLabel: "Lab",
    does: "Walk the authorized surface and tag each finding observed or inferred, with its evidence, gap and next probe. Toolkits on hand: Ghidra for binary claims, Shannon for source-level attack surface.",
    produces: "Findings and ledger traces",
    gate: "An unobserved claim is labelled, never promoted to fact."
  },
  {
    key: "parity",
    label: "Measure the graph",
    module: "/symmetry",
    moduleLabel: "Symmetry",
    does: "Map trigger edges, entropy families, state-key names and timing, then diff a candidate deploy against the baseline to see where it diverges. Toolkits on hand: Shannon entropy for families the page never linked.",
    produces: "SymmetryRun: graph, entropy, latency, fidelity",
    gate: "The pass runs only on a stated basis: owned, written authorization, or staging mirror."
  },
  {
    key: "audit",
    label: "Audit the structure",
    module: "/structure",
    moduleLabel: "Structure",
    does: "Run the graph theory suite over the captured graph: degree distribution, cycles, duplicate and dangling edges, chain depth, origin spread. Each anomaly comes back with the fix it needs. Toolkits on hand: the graph theory suite.",
    produces: "Anomaly list and a copyable fix plan",
    gate: "Every anomaly carries a fix, or an explicit note that the capture cannot settle it."
  },
  {
    key: "compile",
    label: "Compile the rebuild",
    module: "/spec",
    moduleLabel: "Rebuild spec",
    does: "Turn captured contracts into API contracts, inferred schema and state transitions, then a handoff document with a runnable stage list and deploy bundle.",
    produces: "RebuildSpec",
    gate: "Each contract cites the evidence it was derived from."
  },
  {
    key: "stand-up",
    label: "Stand the replica up",
    module: "/spec",
    moduleLabel: "Rebuild spec",
    does: "Run the runnable stages against your own infrastructure and capture the result: exit code, stdout excerpt and the performance read.",
    produces: "run output and performance",
    gate: "No stage fails, and the capture is attached to the spec."
  },
  {
    key: "clone-gate",
    label: "Gate the clone 1:1",
    module: "/spec",
    moduleLabel: "Rebuild spec",
    does: "Score the parity matrix, brand sweep and contrast check together, so the clone is judged on evidence rather than on resemblance. Toolkits on hand: Replica for the gate.",
    produces: "Replica verdict",
    gate: "Parity and brand gates pass before anything is called a clone."
  },
  {
    key: "pressure",
    label: "Pressure-test it",
    module: "/lab",
    moduleLabel: "Lab",
    does: "Run the challenge pack against the authorized targets and write a dossier with falsifiers and next probes. Toolkits on hand: Shannon for source-level attack surface.",
    produces: "ChallengeRun dossier",
    gate: "A capability the engine could not reach is recorded as a gap, not scored as a pass."
  },
  {
    key: "sign-off",
    label: "Sign it off",
    module: "/lab",
    moduleLabel: "Lab",
    does: "The owning pod records a verdict per stage. A decline routes the stage back as needs_input instead of quietly closing it. Toolkits on hand: the Rea agents for stage ownership and sign-off.",
    produces: "Stage verdicts, with the transcript",
    gate: "A stage closes only on an explicit verdict."
  },
  {
    key: "book",
    label: "Book the delta",
    module: "/compare",
    moduleLabel: "Compare",
    does: "Put two dossiers side by side, and let the dashboard group every run by status so nothing sits half-finished. A delta reopens the stage it contradicts.",
    produces: "Comparison and status board",
    gate: "Disagreements send the run back, not forward."
  }
];

/** Modules in run order, de-duplicated so the rail reads like the pipeline. */
export const CLONE_MODULES = [
  { key: "pipeline", to: "/pipeline", label: "Pipeline" },
  ...CLONE_STAGES.reduce((items, stage) => {
    if (items.some((item) => item.to === stage.module)) return items;
    return items.concat({ key: stage.module.replace("/", ""), to: stage.module, label: stage.moduleLabel });
  }, []),
  { key: "dashboard", to: "/dashboard", label: "Dashboard" }
];