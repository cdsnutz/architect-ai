/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const LANES = [
  {
    key: "in_contract",
    label: "Read-only",
    note: "Observation and analysis. Usable as evidence.",
    className: "border-signal/40 bg-signal/10 text-signal"
  },
  {
    key: "gated",
    label: "Authorized only",
    note: "Active probing on a target you authorized.",
    className: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
  },
  {
    key: "excluded",
    label: "Off-contract",
    note: "Awareness only. Never run from this lab.",
    className: "border-destructive/40 bg-destructive/10 text-destructive"
  }
];

export default function LaneSummary({ counts, lane, onSelect }) {
  if (!counts) return null;
  return (
    <section className="border border-line-soft bg-surface-panel">
      <header className="flex items-center justify-between gap-3 border-b border-line-soft px-3 py-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">contract lane</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">{counts.tools} tools</span>
      </header>
      <div className="space-y-1.5 p-3">
        {LANES.map((item) => {
          const active = lane === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(active ? "all" : item.key)}
              aria-pressed={active}
              className={`w-full border px-2 py-1.5 text-left transition-colors ${
                active ? item.className : "border-line-soft bg-surface-sunken text-ink-muted hover:border-line"
              }`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider">{item.label}</span>
                <span className="font-mono text-[11px]">{counts[item.key] || 0}</span>
              </span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-ink-dim">{item.note}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}