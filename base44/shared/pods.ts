// Pod-based reverse-engineering framework.
// One definition feeds both the analysis engine and the copyable master prompt.

export const SCOPE_GUARDRAIL =
  "Scope: analyze only applications you own or are authorised to test. The pods work from observable evidence " +
  "(public pages, public bundles, and flows inside your own account). No credential or session extraction, no " +
  "authentication or paywall bypass, no forced-error probing of infrastructure you do not own, and no mapping of " +
  "internal hosts or secrets.";

export type Pod = {
  id: string;
  name: string;
  surface: string;
  skills: string[];
  objective: string;
  steps: string[];
};

export const PODS: Pod[] = [
  {
    id: "perimeter",
    name: "Perimeter Scout",
    surface: "Frontend / client side",
    skills: ["DOM structure", "request inventory", "bundle archaeology", "route mapping"],
    objective: "Map the client-side state surface: routes, section owners and the requests the UI implies.",
    steps: [
      "Inventory routes, page sections and the component that owns each section's state.",
      "Reconstruct request shapes the UI implies: method, path pattern and payload fields, with the evidence for each.",
      "Read the target's own public bundles for framework, libraries and route names. Never for secrets or internal hosts.",
      "Reverse-map markup and metadata attributes to the data each section renders.",
    ],
  },
  {
    id: "protocol",
    name: "Protocol Analyst",
    surface: "API / middleware",
    skills: ["REST decomposition", "header analysis", "contract inference", "auth model reading"],
    objective: "Infer the API contract and the identity model the app is built on.",
    steps: [
      "Derive the endpoint set and its payload shapes from client evidence.",
      "Describe the advertised auth model (session cookie, bearer token, OAuth provider) without attempting to defeat it.",
      "Note rate-limit and gateway signals only as they appear in observable responses.",
      "Record what the client asks for versus what a response must contain to render the screen.",
    ],
  },
  {
    id: "schema",
    name: "Schema Archaeologist",
    surface: "Backend / data",
    skills: ["data modelling", "relational mapping", "key inference", "storage-type deduction"],
    objective: "Reconstruct the data model behind the screens.",
    steps: [
      "Map every rendered field to the entity and column that must supply it.",
      "Infer primary and foreign keys from identifier shapes and nesting.",
      "Deduce storage type (relational versus document) from nesting, ordering and query behaviour on screen.",
      "Flag fields that exist in the model but are never shown, as clone requirements.",
    ],
  },
  {
    id: "logic",
    name: "Logic Reconstructor",
    surface: "Business engine",
    skills: ["workflow mapping", "state-machine analysis", "edge-case reasoning", "pseudocode"],
    objective: "Recover the business rules and the object lifecycle behind them.",
    steps: [
      "Trace each core object through its status transitions and the trigger that moves it.",
      "Write the transformation logic as pseudocode the rebuild can implement directly.",
      "Name the edge cases the current implementation implies but does not handle.",
      "End every flow with a diagram of the data journey UI to API to data and back.",
    ],
  },
];

export const TECHNIQUES = [
  {
    name: "Differential probe",
    use: "Change one input inside your own test data and diff the response, isolating the logic that owns that field.",
  },
  {
    name: "Latency profiling",
    use: "Compare response times across screens: a slow read implies a join, an aggregation or a third-party call.",
  },
  {
    name: "Error-surface review",
    use: "Read the validation messages and documented error responses the app already shows. Do not force errors against systems you do not own.",
  },
  {
    name: "Bundle archaeology",
    use: "Search the target's own public bundles for framework markers, route names and library versions that reveal architecture.",
  },
];

export const REV_CYCLE = [
  "Scout: find the trigger that starts the feature.",
  "Analyst: capture the request the trigger produces.",
  "Archaeologist: map the record the response implies.",
  "Reconstructor: write the logic and its state transitions.",
];

export function masterPrompt(): string {
  const pods = PODS.map(
    (pod, index) =>
      "### Pod " +
      (index + 1) +
      ": " +
      pod.name +
      " (" +
      pod.surface +
      ")\n" +
      "Skills: " +
      pod.skills.join(", ") +
      "\nObjective: " +
      pod.objective +
      "\n" +
      pod.steps.map((step) => "- " + step).join("\n")
  ).join("\n\n");

  const methods = TECHNIQUES.map((t) => "- " + t.name + ": " + t.use).join("\n");
  const cycle = REV_CYCLE.map((step, i) => i + 1 + ". " + step).join("\n");

  return (
    "# THE REVENGINE POD PROMPT: full-stack architectural extraction\n\n" +
    "ROLE: You are the Lead Systems Architect running a pod-based extraction. Do not summarise. Produce structural " +
    "mappings, inferred schema and logic flows, and cite the evidence behind every claim.\n\n" +
    "SCOPE: " +
    SCOPE_GUARDRAIL +
    "\n\n## I. Pod structure\nEach pod runs its own pass and writes to one shared System State Ledger; a later pod may not contradict " +
    "an earlier finding without naming the evidence that overturns it.\n\n" +
    pods +
    "\n\n## II. Unconventional methods\n" +
    methods +
    "\n\n## III. Execution cycle\n" +
    cycle +
    "\n\n## IV. Output contract\nFor every component extracted, output:\n" +
    "1. Functional specification: what it does, and for whom.\n" +
    "2. API contract: Method | Endpoint | Request payload | Response body.\n" +
    "3. Inferred schema: table, columns, keys and relations required to support it.\n" +
    "4. Logic flow: a Mermaid `flowchart` of the data journey from UI to API to data and back.\n" +
    "5. State transitions: each status and the trigger that moves the object between them.\n\n" +
    "Mark every statement as observed or inferred. Where the evidence does not settle a question, write " +
    '"not observable from this evidence" instead of guessing.'
  );
}

export const POD_SCHEMA = {
  type: "object",
  properties: {
    functional_spec: { type: "string" },
    api_contracts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          method: { type: "string" },
          endpoint: { type: "string" },
          request_shape: { type: "string" },
          response_shape: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["method", "endpoint", "request_shape", "response_shape", "evidence"],
      },
    },
    inferred_schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          table: { type: "string" },
          columns: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                note: { type: "string" },
              },
              required: ["name", "type"],
            },
          },
          keys: { type: "array", items: { type: "string" } },
          relations: { type: "array", items: { type: "string" } },
        },
        required: ["table", "columns", "keys", "relations"],
      },
    },
    state_transitions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          entity: { type: "string" },
          from_state: { type: "string" },
          to_state: { type: "string" },
          trigger: { type: "string" },
        },
        required: ["entity", "from_state", "to_state", "trigger"],
      },
    },
    logic_flows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          mermaid: { type: "string" },
        },
        required: ["name", "mermaid"],
      },
    },
    pod_findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pod: {
            type: "string",
            enum: ["Perimeter Scout", "Protocol Analyst", "Schema Archaeologist", "Logic Reconstructor"],
          },
          finding: { type: "string" },
          evidence: { type: "string" },
          confidence: { type: "string", enum: ["observed", "inferred"] },
        },
        required: ["pod", "finding", "evidence", "confidence"],
      },
    },
  },
  required: [
    "functional_spec",
    "api_contracts",
    "inferred_schema",
    "state_transitions",
    "logic_flows",
    "pod_findings",
  ],
};