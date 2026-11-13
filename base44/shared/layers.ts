/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// The four intelligence layers that run on top of the four pods.
// Each one states plainly what it can observe and what it can only infer.

export type Layer = {
  id: string;
  name: string;
  phase: string;
  concept: string;
  goal: string;
  method: string;
  output: string;
};

export const LAYERS: Layer[] = [
  {
    id: "temporal",
    name: "Temporal Delta Observer",
    phase: "Observation",
    concept: "Reads the time dimension of the data surface instead of a single static snapshot.",
    goal: "Separate cached-and-revalidated reads from live-push surfaces, and name the cadence each screen implies.",
    method:
      "Observed: cache-control, ETag, Age, Last-Modified and Date from the anonymous probe, plus each round-trip time. " +
      "Inferred: polling intervals, WebSocket or EventSource clients and refetch timers visible in the public bundle. " +
      "Real inter-update timing needs a series of observations over time, so one pass labels cadence as inferred, never measured.",
    output: "temporal_profile",
  },
  {
    id: "dependency",
    name: "Dependency Graph Mapper",
    phase: "Structural",
    concept: "Follows a single data point outward through every endpoint, table and screen that touches it.",
    goal: "Rebuild the relational ER diagram and the blast radius of one identifier changing.",
    method:
      "Treat a shared key shape plus a shared route or payload position as a join. Rank blast radius by how many traced " +
      "behaviours pass through the identifier, and list the writes that would need to cascade.",
    output: "dependency_graph",
  },
  {
    id: "archetype",
    name: "Heuristic Archetype Matcher",
    phase: "Synthesis",
    concept: "Pattern-matches observed contracts against documented industry standards.",
    goal: "Fill gaps in the inferred model from the matched archetype, with every filled field marked inferred.",
    method:
      "Match on route shape, status vocabulary, field naming and idempotency keys (Stripe-style billing, Shopify-style " +
      "inventory, AWS-style IAM, Auth0-style identity). Cite the signal that triggered the match; a weak match fills nothing.",
    output: "archetype_matches",
  },
  {
    id: "mirror",
    name: "Cognitive Logic Mirror",
    phase: "Validation",
    concept: "Writes a parallel function for each traced behaviour and replays the recorded outputs against it.",
    goal: "Produce replacement logic that reproduces the observed outputs, and name exactly where it diverges.",
    method:
      "Express each rule as input -> process -> output pseudocode, then re-run the observed cases from the evidence " +
      "through it. A rule no observed case exercises is unverified, and states as much.",
    output: "logic_mirror",
  },
];

export const SYNC_SEQUENCE = [
  {
    phase: "Observation (the mirror)",
    steps: ["Perimeter Scout", "Temporal Delta Observer"],
    result: "The pulse of the app: routes, the sections that own state, and which reads are cached versus live.",
  },
  {
    phase: "Structural (the skeleton)",
    steps: ["Protocol Analyst", "Dependency Graph Mapper"],
    result: "Endpoints linked to the inferred entities, with the blast radius of each identifier.",
  },
  {
    phase: "Synthesis (the brain)",
    steps: ["Schema Archaeologist", "Heuristic Archetype Matcher"],
    result: "A consolidated ER diagram whose gaps are filled from a named archetype, each gap marked inferred.",
  },
  {
    phase: "Validation (the ghost)",
    steps: ["Logic Reconstructor", "Cognitive Logic Mirror"],
    result: "State transitions plus a replacement function per behaviour, tested against the observed outputs.",
  },
];