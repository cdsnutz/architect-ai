/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const LANE_DOT = {
  in_contract: "bg-signal",
  gated: "bg-yellow-500",
  excluded: "bg-destructive"
};

export default function CategoryRail({ sections, category, onSelect }) {
  const list = sections || [];
  if (!list.length) return null;

  return (
    <section className="border border-line-soft bg-surface-panel">
      <header className="flex items-center justify-between gap-3 border-b border-line-soft px-3 py-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">sections</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">{list.length}</span>
      </header>
      <div className="max-h-[22rem] overflow-y-auto p-1.5">
        <button
          type="button"
          onClick={() => onSelect("all")}
          className={`flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left font-mono text-[10px] uppercase tracking-wider transition-colors ${
            category === "all" ? "bg-surface-raised text-signal" : "text-ink-dim hover:bg-surface-raised hover:text-ink"
          }`}
        >
          <span>all sections</span>
          <span>{list.reduce((sum, section) => sum + section.tools.length, 0)}</span>
        </button>
        {list.map((section) => {
          const active = category === section.name;
          return (
            <button
              key={section.name}
              type="button"
              onClick={() => onSelect(section.name)}
              className={`flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-[11px] transition-colors ${
                active ? "bg-surface-raised text-ink" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
              }`}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span className={`h-1.5 w-1.5 shrink-0 ${LANE_DOT[section.lane] || "bg-ink-dim"}`} />
                <span className="truncate">{section.name}</span>
              </span>
              <span className="font-mono text-[10px] text-ink-dim">{section.tools.length}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}