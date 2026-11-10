// Geometry and normalisation for the trigger → API path → table journey graph.

export const LANES = [
  { key: "trigger", title: "UI trigger", x: 12, w: 184 },
  { key: "endpoint", title: "API path", x: 244, w: 236 },
  { key: "table", title: "Table", x: 548, w: 190 }
];

export const NODE_H = 36;
const ROW = 52;
const TOP = 30;
export const WIDTH = 750;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values) {
  const out = [];
  values.forEach((value) => {
    if (!out.includes(value)) out.push(value);
  });
  return out;
}

export function wrapLabel(label, perLine, maxLines) {
  const words = String(label || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    if (lines.length === maxLines - 1) {
      current = current ? current + " " + word : word;
      return;
    }
    if ((current + " " + word).trim().length > perLine) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  });
  if (current) lines.push(current);

  return lines.slice(0, maxLines).map((line) =>
    line.length > perLine + 4 ? line.slice(0, perLine + 3) + "…" : line
  );
}

// A dossier keeps pod output under logic_map; fall back to the record itself for older rows.
export function logicMapOf(analysis) {
  if (!analysis) return {};
  const map = analysis.logic_map;
  if (map && typeof map === "object" && (Array.isArray(map.ledger_traces) || Array.isArray(map.api_contracts))) {
    return map;
  }
  return analysis;
}

function endpointLabel(method, endpoint) {
  const value = text(endpoint);
  if (!value) return "";
  const verb = text(method).toUpperCase();
  return verb && !value.toUpperCase().startsWith(verb) ? verb + " " + value : value;
}

export function buildJourneys(analysis) {
  const map = logicMapOf(analysis);
  const traces = Array.isArray(map.ledger_traces) ? map.ledger_traces : [];
  const contracts = Array.isArray(map.api_contracts) ? map.api_contracts : [];
  const transitions = Array.isArray(map.state_transitions) ? map.state_transitions : [];
  const schema = Array.isArray(map.inferred_schema) ? map.inferred_schema : [];

  const rows = traces.length
    ? traces.map((trace) => ({
        trigger: trace.ui_trigger,
        endpoint: trace.endpoint,
        table: trace.table,
        evidence: trace.evidence,
        method: ""
      }))
    : contracts.map((contract) => ({
        trigger: contract.ui_trigger,
        endpoint: contract.endpoint,
        table: contract.linked_table,
        evidence: contract.evidence,
        method: contract.method
      }));

  return rows
    .map((row) => {
      const table = text(row.table).toLowerCase() === "unlinked" ? "" : text(row.table);
      const endpoint = endpointLabel(row.method, row.endpoint);
      const transition =
        transitions.find((entry) => {
          const entryEndpoint = endpointLabel("", entry.endpoint).toLowerCase();
          if (entryEndpoint && endpoint && entryEndpoint === endpoint.toLowerCase()) return true;
          return Boolean(table) && text(entry.table) === table;
        }) || null;
      const tableMeta = table ? schema.find((entry) => text(entry.table) === table) || null : null;

      return {
        trigger: text(row.trigger),
        endpoint,
        table,
        evidence: text(row.evidence),
        transition,
        tableMeta,
        complete: Boolean(text(row.trigger) && endpoint && table)
      };
    })
    .filter((journey) => journey.trigger || journey.endpoint || journey.table)
    .map((journey, index) => ({ ...journey, index }));
}

function keyFor(journey, lane) {
  if (lane === "trigger") return journey.trigger || "unmapped";
  if (lane === "endpoint") return journey.endpoint || "not observable";
  return journey.table || "not observable";
}

export function buildLaneGraph(journeys) {
  const keys = {
    trigger: unique(journeys.map((journey) => keyFor(journey, "trigger"))),
    endpoint: unique(journeys.map((journey) => keyFor(journey, "endpoint"))),
    table: unique(journeys.map((journey) => keyFor(journey, "table")))
  };

  const rowCount = Math.max(keys.trigger.length, keys.endpoint.length, keys.table.length, 1);
  const height = TOP + rowCount * ROW - (ROW - NODE_H) + 10;

  const nodes = [];
  LANES.forEach((lane) => {
    keys[lane.key].forEach((key, rowIndex) => {
      nodes.push({
        lane: lane.key,
        key,
        label: key,
        x: lane.x,
        y: TOP + rowIndex * ROW,
        width: lane.w,
        mapped: key !== "unmapped" && key !== "not observable",
        journeys: journeys.filter((journey) => keyFor(journey, lane.key) === key).map((journey) => journey.index)
      });
    });
  });

  const byKey = {};
  nodes.forEach((node) => {
    byKey[node.lane + ":" + node.key] = node;
  });

  const edges = [];
  journeys.forEach((journey) => {
    const trigger = byKey["trigger:" + keyFor(journey, "trigger")];
    const endpoint = byKey["endpoint:" + keyFor(journey, "endpoint")];
    const table = byKey["table:" + keyFor(journey, "table")];
    if (trigger && endpoint) edges.push({ journey: journey.index, from: trigger, to: endpoint });
    if (endpoint && table) edges.push({ journey: journey.index, from: endpoint, to: table });
  });

  return { width: WIDTH, height, nodes, edges };
}

export function edgePath(from, to) {
  const x1 = from.x + from.width;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x;
  const y2 = to.y + NODE_H / 2;
  const mid = (x1 + x2) / 2;
  return "M " + x1 + " " + y1 + " C " + mid + " " + y1 + ", " + mid + " " + y2 + ", " + x2 + " " + y2;
}