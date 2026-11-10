// Pod-based reverse-engineering framework.
// One definition feeds both the analysis engine and the copyable master prompt.

export const SCOPE_GUARDRAIL =
  "Scope: analyze only applications you own or are authorised to test. The pods work from observable evidence " +
  "(public pages, public bundles, anonymous GET content-negotiation checks, and flows inside your own account). No " +
  "credential or session extraction, no authentication or paywall bypass, no forced-error probing of infrastructure " +
  "you do not own, and no mapping of internal hosts or secrets.";

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
      "Vary one header on an anonymous GET (Accept, X-Requested-With) and diff the two representations: a changed payload identifies the machine-readable surface the UI calls, found by observation rather than intrusion.",
      "Tag every endpoint with the table it reads or writes, so the ledger stays a relational map from UI trigger to endpoint to table.",
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
      "Infer a constraint for every column and cite it: identifier format (UUID v4, nanoid, integer sequence), enum domain and its allowed values, nullability, uniqueness, length or numeric bounds, and timestamps that look server-owned.",
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
      "Emit the transition matrix as rows of Current State → Trigger → Action → Next State, each naming the endpoint and table that own the row.",
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
  {
    name: "Content-negotiation probe",
    use: "Request the same path twice over anonymous GET, once with an HTML Accept header and once with an XHR-style Accept plus X-Requested-With. A difference in representation reveals the JSON surface the UI already consumes.",
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
    "\n\n## IV. Output contract\nThe ledger is a relational map, not a log. For every component extracted, output:\n" +
    "1. Functional specification: what it does, and for whom.\n" +
    "2. API contract: Method | Endpoint | Request payload | Response body | the UI trigger that fires it | the table it reads or writes.\n" +
    "3. Inferred schema: table, columns with type-inference constraints, keys and relations required to support it.\n" +
    "4. Logic flow: a Mermaid `flowchart` of the data journey from UI to API to data and back.\n" +
    "5. State transition matrix: Current State → Trigger → Action → Next State, with the endpoint and table.\n" +
    "6. Ledger trace: the full path UI Trigger → API Endpoint → Database Table for each traced behaviour.\n\n" +
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
          ui_trigger: { type: "string" },
          linked_table: { type: "string" },
          related_tables: { type: "array", items: { type: "string" } },
          evidence: { type: "string" },
        },
        required: [
          "method",
          "endpoint",
          "request_shape",
          "response_shape",
          "ui_trigger",
          "linked_table",
          "evidence",
        ],
      },
    },
    inferred_schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          table: { type: "string" },
          purpose: { type: "string" },
          columns: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                constraints: { type: "array", items: { type: "string" } },
                evidence: { type: "string" },
                note: { type: "string" },
              },
              required: ["name", "type", "constraints", "evidence"],
            },
          },
          keys: { type: "array", items: { type: "string" } },
          relations: { type: "array", items: { type: "string" } },
          written_by: { type: "array", items: { type: "string" } },
        },
        required: ["table", "purpose", "columns", "keys", "relations", "written_by"],
      },
    },
    state_transitions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          entity: { type: "string" },
          table: { type: "string" },
          current_state: { type: "string" },
          trigger: { type: "string" },
          action: { type: "string" },
          endpoint: { type: "string" },
          next_state: { type: "string" },
          evidence: { type: "string" },
          confidence: { type: "string", enum: ["observed", "inferred"] },
        },
        required: [
          "entity",
          "table",
          "current_state",
          "trigger",
          "action",
          "endpoint",
          "next_state",
          "evidence",
          "confidence",
        ],
      },
    },
    ledger_traces: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ui_trigger: { type: "string" },
          endpoint: { type: "string" },
          table: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["ui_trigger", "endpoint", "table", "evidence"],
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
    "ledger_traces",
    "logic_flows",
    "pod_findings",
  ],
};