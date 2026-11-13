/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Geometry and normalisation for the action journey map: user action → data request → database update.

export const COLUMNS = [
  { key: "trigger", title: "User action", x: 12, w: 176 },
  { key: "endpoint", title: "Data request", x: 232, w: 212 },
  { key: "table", title: "Database update", x: 488, w: 200 }
];

export const NODE_H = 34;
const ROW = 50;
const TOP = 34;
export const WIDTH = 700;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
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

// One horizontal track per journey, so every line runs left to right without crossing another journey's.
export function buildTracks(journeys) {
  const tracks = journeys.map((journey, row) => {
    const y = TOP + row * ROW;
    const nodes = COLUMNS.map((column) => ({
      lane: column.key,
      x: column.x,
      y,
      width: column.w,
      label: journey[column.key] || "not observed",
      mapped: Boolean(journey[column.key])
    }));

    return {
      journey,
      y,
      nodes,
      links: [
        { from: nodes[0], to: nodes[1], mapped: Boolean(journey.trigger && journey.endpoint) },
        { from: nodes[1], to: nodes[2], mapped: Boolean(journey.endpoint && journey.table) }
      ]
    };
  });

  return { width: WIDTH, height: TOP + journeys.length * ROW + 6, tracks };
}