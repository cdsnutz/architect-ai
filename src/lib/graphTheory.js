/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

/**
 * Graph-theory audit over a captured SymmetryRun graph.
 * Pure functions only: every finding is derived from the nodes and edges that
 * were actually observed, and anything the graph cannot settle is reported as
 * an evidence gap rather than a defect.
 */

function tailName(id) {
  const tail = id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;
  const clean = tail.split("#")[0].split("?")[0];
  return clean.split("/").filter(Boolean).pop() || id;
}

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function adjacencyOf(ids, edges) {
  const map = new Map([...ids].map((id) => [id, []]));
  edges.forEach((edge) => {
    if (map.has(edge.from) && map.has(edge.to)) map.get(edge.from).push(edge.to);
  });
  return map;
}

/** Strongly connected components of size > 1: the real cycles in the graph. */
function findCycles(ids, adjacency) {
  let index = 0;
  const order = new Map();
  const low = new Map();
  const onStack = new Set();
  const stack = [];
  const groups = [];

  const walk = (node) => {
    order.set(node, index);
    low.set(node, index);
    index += 1;
    stack.push(node);
    onStack.add(node);

    (adjacency.get(node) || []).forEach((next) => {
      if (!order.has(next)) {
        walk(next);
        low.set(node, Math.min(low.get(node), low.get(next)));
      } else if (onStack.has(next)) {
        low.set(node, Math.min(low.get(node), order.get(next)));
      }
    });

    if (low.get(node) === order.get(node)) {
      const group = [];
      let member;
      do {
        member = stack.pop();
        onStack.delete(member);
        group.push(member);
      } while (member !== node);
      if (group.length > 1) groups.push(group);
    }
  };

  ids.forEach((id) => {
    if (!order.has(id)) walk(id);
  });

  return groups;
}

/** Longest simple chain of resources: the waterfall depth of the surface. */
function chainDepth(ids, adjacency) {
  const memo = new Map();
  const depth = (node, path) => {
    if (memo.has(node)) return memo.get(node);
    if (path.has(node)) return 1;
    path.add(node);
    let best = 1;
    (adjacency.get(node) || []).forEach((next) => {
      best = Math.max(best, 1 + depth(next, path));
    });
    path.delete(node);
    memo.set(node, best);
    return best;
  };

  let longest = 0;
  ids.forEach((id) => {
    longest = Math.max(longest, depth(id, new Set()));
  });
  return longest;
}

export function auditGraph(run) {
  const graph = (run && run.graph) || {};
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges.filter((e) => e && e.from && e.to) : [];
  const ids = new Set(nodes.map((n) => n.id));
  const doc = nodes.find((n) => n.kind === "document");
  const adjacency = adjacencyOf(ids, edges);

  const inDegree = new Map([...ids].map((id) => [id, 0]));
  const outDegree = new Map([...ids].map((id) => [id, 0]));
  edges.forEach((edge) => {
    if (outDegree.has(edge.from)) outDegree.set(edge.from, outDegree.get(edge.from) + 1);
    if (inDegree.has(edge.to)) inDegree.set(edge.to, inDegree.get(edge.to) + 1);
  });

  const dangling = edges.filter((edge) => !ids.has(edge.from) || !ids.has(edge.to));
  const pairs = new Map();
  edges.forEach((edge) => {
    const key = tailName(edge.from) + " -> " + tailName(edge.to);
    pairs.set(key, (pairs.get(key) || 0) + 1);
  });
  const duplicates = [...pairs.entries()].filter(([, count]) => count > 1);
  const selfLoops = edges.filter((edge) => edge.from === edge.to);
  const cycles = findCycles([...ids], adjacency);
  const orphans = nodes.filter((n) => !doc || n.id !== doc.id).filter((n) => (inDegree.get(n.id) || 0) === 0);

  const positive = [...outDegree.values()].filter((value) => value > 0);
  const hubThreshold = Math.max(6, Math.round(median(positive) * 3));
  const hubs = nodes.filter((n) => (outDegree.get(n.id) || 0) >= hubThreshold);
  const chain = chainDepth([...ids], adjacency);
  const docFanOut = doc ? outDegree.get(doc.id) || 0 : 0;

  const byBase = new Map();
  nodes
    .filter((n) => n.kind === "script" || n.kind === "stylesheet")
    .forEach((n) => {
      const base = tailName(n.id);
      if (!byBase.has(base)) byBase.set(base, []);
      byBase.get(base).push(n.id);
    });
  const repeated = [...byBase.entries()].filter(([, list]) => list.length > 1);

  const inferred = edges.filter((edge) => edge.tag === "inferred").length;
  const inferredShare = edges.length ? Math.round((inferred / edges.length) * 100) : 0;

  const own = originOf((doc && doc.url) || (run && run.target_url) || "");
  const foreign = nodes.filter((n) => {
    const origin = originOf(n.url);
    return origin && own && origin !== own;
  });

  const anomalies = [];
  const add = (anomaly) => anomalies.push(anomaly);
  const names = (list) => list.slice(0, 6).map((n) => (typeof n === "string" ? tailName(n) : tailName(n.id)));

  if (dangling.length) {
    add({
      key: "dangling",
      severity: "structural",
      title: "References with no resource behind them",
      observed: dangling.length + " edge(s) point at a node the capture never resolved",
      fix: "Wire or remove each one: a stale path gets corrected in the markup, a 404 gets restored at origin. A replica that copies the reference inherits the dead end.",
      nodes: dangling.slice(0, 6).map((edge) => tailName(edge.to))
    });
  }

  if (duplicates.length) {
    add({
      key: "duplicates",
      severity: "material",
      title: "The same load edge fires more than once",
      observed: duplicates.length + " pair(s) appear repeatedly, " + duplicates.slice(0, 3).map(([pair, count]) => pair + " ×" + count).join(", "),
      fix: "Load each resource once: drop the repeated tag, or de-duplicate at the bundler so one entry chunk owns it. Two identical requests also double the work in your replica.",
      nodes: duplicates.slice(0, 6).map(([pair]) => pair)
    });
  }

  if (selfLoops.length) {
    add({
      key: "self-loops",
      severity: "structural",
      title: "A node loads itself",
      observed: selfLoops.length + " self-reference(s) on " + names(selfLoops.map((edge) => edge.from)).join(", "),
      fix: "Break the self-reference. A node that re-enters its own loader either double-executes or never settles.",
      nodes: names(selfLoops.map((edge) => edge.from))
    });
  }

  if (cycles.length) {
    add({
      key: "cycles",
      severity: "structural",
      title: "Load cycles between resources",
      observed: cycles.length + " cycle(s): " + cycles.slice(0, 3).map((group) => names(group).join(" ↔ ")).join(" | "),
      fix: "Break each ring at the shared module: hoist it to a chunk two hops above, or lazy-load one side so the ring becomes a chain.",
      nodes: cycles.flat().slice(0, 6).map((id) => tailName(id))
    });
  }

  if (orphans.length) {
    add({
      key: "orphans",
      severity: "material",
      title: "Resources nothing reaches",
      observed: orphans.length + " node(s) with no inbound edge",
      fix: "Either reference them where they belong, or drop them from the build. An unreferenced asset is weight the target still ships and your replica would copy.",
      nodes: names(orphans)
    });
  }

  if (hubs.length) {
    add({
      key: "hubs",
      severity: "material",
      title: "Bundles carrying too many dependents",
      observed: hubs.length + " hub(s) at " + hubThreshold + "+ outbound edges: " + names(hubs).slice(0, 3).join(", "),
      fix: "Split each hub along the modules it serves, so one failure or one slow byte does not take every dependent with it.",
      nodes: names(hubs)
    });
  }

  if (docFanOut > 12) {
    add({
      key: "fan-out",
      severity: "material",
      title: "The document fans out too wide",
      observed: docFanOut + " direct children on the document node",
      fix: "Cap the fan-out: preconnect and preload the first three, then let them pull the rest. Past a dozen direct children the waterfall, not the payload, sets the latency.",
      nodes: [tailName(doc.id)]
    });
  }

  if (chain >= 6) {
    add({
      key: "chain",
      severity: "material",
      title: "A long serial load chain",
      observed: "longest chain is " + chain + " hops",
      fix: "Flatten it: preload the third to fifth hop and warm the origin, so depth stops stacking round trips before the surface paints.",
      nodes: []
    });
  }

  if (repeated.length) {
    add({
      key: "repeated-assets",
      severity: "minor",
      title: "The same asset under more than one URL",
      observed: repeated.length + " filename(s) repeated: " + repeated.slice(0, 3).map(([base]) => base).join(", "),
      fix: "Serve one canonical URL per asset. Duplicated filenames are near-certain in a hand-rolled replica and quietly split the cache.",
      nodes: repeated.slice(0, 6).map(([base]) => base)
    });
  }

  if (inferredShare >= 50) {
    add({
      key: "evidence-gap",
      severity: "minor",
      title: "Most edges are inferred, not observed",
      observed: inferredShare + "% of edges came from call-site literals rather than a runtime observation",
      fix: "Run a second pass with a session capture so call sites are observed. Until then these edges are hypotheses and the plan should say so.",
      nodes: []
    });
  }

  if (foreign.length) {
    add({
      key: "third-party",
      severity: "minor",
      title: "Third-party origins in the critical graph",
      observed: foreign.length + " node(s) sit off the target origin: " + [...new Set(foreign.map((n) => originOf(n.url)))].slice(0, 3).join(", "),
      fix: "Declare each third-party origin explicitly in the rebuild: preconnect, a CSP allowlist entry and, where it tracks, a consent gate. A replica that silently inherits them inherits their failures too.",
      nodes: names(foreign)
    });
  }

  const observed = edges.filter((edge) => edge.tag === "observed").length;
  const metrics = {
    nodes: nodes.length,
    edges: edges.length,
    observed,
    inferred,
    orphans: orphans.length,
    dangling: dangling.length,
    cycles: cycles.length,
    chain,
    hubs: hubs.length,
    foreign: foreign.length,
    fanOut: docFanOut,
    anomalies: anomalies.length
  };

  return {
    target: (run && run.target_url) || "",
    label: (run && run.label) || "",
    captured: (run && run.created_date) || "",
    fidelity: (run && run.fidelity && run.fidelity.score) || 0,
    metrics,
    anomalies,
    plan: planToText({ target: (run && run.target_url) || "", metrics, anomalies })
  };
}

export function planToText(audit) {
  const { target, metrics, anomalies } = audit;
  const lines = [
    "# Structural fix plan",
    target || "",
    "",
    metrics.nodes + " nodes / " + metrics.edges + " edges · " + anomalies.length + " anomalies",
    ""
  ];

  if (!anomalies.length) {
    lines.push("No structural anomaly detected in the captured graph.");
  }

  anomalies.forEach((anomaly, i) => {
    lines.push(i + 1 + ". [" + anomaly.severity + "] " + anomaly.title);
    lines.push("   observed: " + anomaly.observed);
    lines.push("   fix: " + anomaly.fix);
    if (anomaly.nodes.length) lines.push("   nodes: " + anomaly.nodes.join(", "));
    lines.push("");
  });

  return lines.join("\n").trim();
}