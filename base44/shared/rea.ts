/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// REA — the reverse-engineering agent layer. One registry for the tools, skills,
// agents, pods and workflows that the engine exposes, so the console, the agent
// and the backend all read the same inventory.

export const REA_TOOLS = [
  {
    id: "rea.connect",
    label: "Connect REA",
    kind: "in-app",
    command: "REA layer → Run → Connect REA",
    purpose: "Mints an agent token and returns the web endpoint the local agent calls. Revocable at any time."
  },
  {
    id: "rea.doctor",
    label: "Doctor",
    kind: "in-app",
    command: "REA layer → Run → Doctor",
    purpose: "Checks the pod registry, agent token, pod telemetry, dossier coverage and the mapping engine against live app data."
  },
  {
    id: "rea.analyze-source",
    label: "Analyze checkout",
    kind: "in-app",
    command: "REA layer → Run → Analyze checkout",
    purpose: "Source-level pass over your own modules: imports, outbound requests, route handlers, models and env usage."
  },
  {
    id: "rea.job",
    label: "Job spec",
    kind: "in-app",
    command: "REA layer → Run → Job spec",
    purpose: "Builds the job JSON for a dossier, downloadable, and served to an agent holding a token."
  },
  { id: "engine.map", label: "Map a URL", kind: "in-app", command: "analyzeSite", purpose: "Fetches a public page, extracts evidence, runs the pods and writes a dossier." },
  { id: "engine.map-gated", label: "Map pasted HTML", kind: "in-app", command: "analyzePastedHtml", purpose: "Runs the same mapping over HTML you captured from an authenticated surface." },
  { id: "engine.prompt", label: "Rebuild prompt", kind: "in-app", command: "generateRebuildPrompt", purpose: "Writes the Claude Code reconstruction prompt, or a white-label clone prompt." },
  { id: "engine.validate", label: "Validation pass", kind: "in-app", command: "reaValidate", purpose: "Scores parity, separates verified claims from unverified ones, names the next probe." },
  { id: "engine.sweep", label: "Sweep", kind: "in-app", command: "reaSweep", purpose: "Re-validates the oldest unvalidated dossiers on a schedule." },
  { id: "engine.registry", label: "Registry", kind: "in-app", command: "reaRegistry", purpose: "Serves this inventory: pods, layers, sequence, skills, agents, workflows." }
];

export const REA_SKILLS = [
  { name: "Perimeter scouting", proves: "Which routes exist, which of them answer anonymously, and where the gate actually sits." },
  { name: "Content-negotiation probing", proves: "Whether the server will hand over a different representation for the same route." },
  { name: "Protocol analysis", proves: "The request shapes behind each trigger: method, params, payload, sequencing." },
  { name: "Schema archaeology", proves: "Fields and constraints inferred from payloads, with types and nullability flagged." },
  { name: "State-transition extraction", proves: "Current state → trigger → action → next state, for every decision the UI exposes." },
  { name: "Dependency graphing", proves: "Which surface depends on which endpoint, entity or third party." },
  { name: "Temporal delta reading", proves: "Cache and latency behaviour, so a stale shell is never mistaken for logic." },
  { name: "Archetype matching", proves: "The known pattern this app is an instance of, so parity gaps become predictable." },
  { name: "Logic mirroring", proves: "What the user sees versus what the system does, side by side." },
  { name: "Parity validation", proves: "Which claims in the map are anchored to evidence, and which are still inference." }
];

export const REA_AGENTS = [
  { name: "REA Orchestrator", kind: "in-app", role: "Runs the pipeline, reads dossiers, routes work to the pods and reports what is still unverified." },
  { name: "Perimeter Scout", kind: "pod", role: "Enumerates reachable surfaces and classifies each gate." },
  { name: "Protocol Analyst", kind: "pod", role: "Reconstructs request and response contracts." },
  { name: "Schema Archaeologist", kind: "pod", role: "Infers the data model and its constraints." },
  { name: "Logic Reconstructor", kind: "pod", role: "Rebuilds state transitions, rules and side effects." },
  { name: "Parity Validator", kind: "pod", role: "Audits the dossier against its own evidence and scores parity." }
];

export const REA_WORKFLOWS = [
  {
    name: "REA Pipeline",
    trigger: "A dossier is mapped",
    detail: "Every new analysis is validated immediately; the verdict and its evidence land on the dossier.",
    steps: ["Trigger: SiteAnalysis created", "reaValidate", "Write verdict + pipeline log"]
  },
  {
    name: "REA Weekly Sweep",
    trigger: "Mondays at 07:00",
    detail: "Picks up the oldest dossiers that never got a validation pass and runs them, three per run.",
    steps: ["Trigger: schedule", "reaSweep", "Find unvalidated", "reaValidate ×3"]
  },
  {
    name: "Manual chain",
    trigger: "From the workspace",
    detail: "Map → rebuild prompt → validation, run in order on the dossier you have open.",
    steps: ["analyzeSite / analyzePastedHtml", "generateRebuildPrompt", "reaValidate"]
  }
];

export function reaJobSpec(analysis: any) {
  return {
    target: analysis?.url,
    title: analysis?.title,
    summary: analysis?.summary,
    objectives: [
      "Verify this logic map against the real implementation",
      "Flag dead code, duplicated modules and redundant data fetches",
      "Produce the module breakdown for the white-label clone"
    ],
    logic_map: analysis?.logic_map || null,
    rebuild_prompt: analysis?.rebuild_prompt || null,
    validation: analysis?.validation || null
  };
}