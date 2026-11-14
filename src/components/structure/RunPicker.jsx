/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function RunPicker({ runs, selectedId, onSelect }) {
  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="border-b border-line-soft p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">captures</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
          Every audit reads a Symmetry pass. Pick the capture whose graph you want examined.
        </p>
      </div>
      <ul className="divide-y divide-line-soft">
        {runs.map((run) => {
          const isActive = run.id === selectedId;
          return (
            <li key={run.id}>
              <button
                type="button"
                onClick={() => onSelect(run.id)}
                aria-current={isActive ? "true" : undefined}
                className={
                  "w-full px-3 py-2 text-left transition-colors " +
                  (isActive ? "bg-surface-raised" : "hover:bg-surface-raised")
                }
              >
                <p className={"truncate text-[11px] " + (isActive ? "text-signal" : "text-ink")}>
                  {run.label || run.target_url}
                </p>
                <p className="truncate font-mono text-[10px] text-ink-dim">{run.target_url}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
                  {(run.graph && run.graph.nodes ? run.graph.nodes.length : 0)} nodes · L
                  {String((run.fidelity && run.fidelity.level) || "—").replace("L", "")}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}