/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const STATUS_CLASS = {
  complete: "text-signal",
  running: "text-yellow-500",
  queued: "text-ink-dim",
  failed: "text-destructive"
};

export default function RunHistory({ runs, activeId, onSelect }) {
  return (
    <section className="border border-line-soft bg-surface-panel">
      <header className="border-b border-line-soft px-3 py-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">Pass history</h2>
      </header>
      <ul className="max-h-72 overflow-auto">
        {runs.map((run) => (
          <li key={run.id}>
            <button
              type="button"
              onClick={() => onSelect(run)}
              className={
                "w-full border-b border-line-soft px-3 py-2 text-left transition-colors last:border-0 hover:bg-surface-raised " +
                (run.id === activeId ? "bg-surface-raised" : "")
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-mono text-[11px] text-ink">{run.label || run.target_url}</span>
                <span className={"shrink-0 font-mono text-[10px] uppercase " + (STATUS_CLASS[run.status] || "text-ink-dim")}>
                  {run.status}
                </span>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-2 font-mono text-[10px] text-ink-dim">
                <span className="truncate">{run.target_url}</span>
                {run.fidelity && <span className="shrink-0 text-ink-muted">{run.fidelity.score}</span>}
              </div>
            </button>
          </li>
        ))}
        {!runs.length && <li className="px-3 py-4 text-[11px] text-ink-dim">No pass has been run yet.</li>}
      </ul>
    </section>
  );
}