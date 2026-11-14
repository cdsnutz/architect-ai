/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import Panel from "./Panel";

const ROWS = 14;

export default function GraphPanel({ graph }) {
  if (!graph) return null;
  const counts = graph.counts || {};
  const triggers = Object.entries(graph.triggers || {}).sort((a, b) => b[1] - a[1]);
  const edges = (graph.edges || []).slice(0, ROWS);

  return (
    <Panel title="Trigger-edge dependency graph" meta={counts.nodes + " nodes · " + counts.edges + " edges"}>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wider">
        <span className="text-signal">{counts.observed} observed</span>
        <span className="text-ink-dim">{counts.inferred} inferred</span>
        <span className="text-ink-dim">{counts.navigation_edges || 0} nav links</span>
        <span className="text-ink-dim">{counts.external_hosts} external hosts</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {triggers.map(([trigger, count]) => (
          <span key={trigger} className="border border-line-soft bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
            {trigger} <span className="text-ink-dim">×{count}</span>
          </span>
        ))}
        {!triggers.length && <span className="font-mono text-[10px] text-ink-dim">No call sites resolved.</span>}
      </div>

      <ul className="space-y-1">
        {edges.map((edge, index) => (
          <li key={index} className="flex items-baseline gap-2 border-b border-line-soft pb-1 last:border-0">
            <span className={edge.tag === "observed" ? "text-signal" : "text-ink-dim"}>
              {edge.tag === "observed" ? "●" : "○"}
            </span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink-dim">{edge.trigger}</span>
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-muted" title={edge.to}>
              {edge.to.split(":").pop()}
            </span>
          </li>
        ))}
      </ul>
      {!edges.length && <p className="text-[11px] text-ink-dim">This document names no resource the engine could resolve.</p>}
      <p className="mt-2 text-[10px] leading-relaxed text-ink-dim">
        A filled dot is a resource the served HTML names. A hollow dot is a path found at a call site in shipped code — the trigger is inferred, not yet seen firing.
      </p>
    </Panel>
  );
}