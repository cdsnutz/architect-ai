/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function FidelityPanel({ fidelity }) {
  if (!fidelity) return null;
  return (
    <section className="border border-line-soft bg-surface-panel">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-3 py-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">Fidelity</h2>
        <span className="border border-signal/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-signal">
          {fidelity.level}
        </span>
      </div>
      <div className="flex items-start gap-4 p-3">
        <div className="shrink-0">
          <p className="font-display text-3xl leading-none text-ink">{fidelity.score}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-dim">of 100</p>
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {(fidelity.components || []).map((part) => (
            <li key={part.name}>
              <div className="flex items-baseline justify-between gap-2 font-mono text-[10px]">
                <span className="truncate text-ink-muted">{part.name}</span>
                <span className="shrink-0 text-ink-dim">
                  {part.earned}/{part.weight}
                </span>
              </div>
              <div className="mt-0.5 h-1 w-full bg-surface-sunken">
                <div className="h-1 bg-signal" style={{ width: Math.round((part.earned / part.weight) * 100) + "%" }} />
              </div>
              <p className="mt-0.5 text-[10px] text-ink-dim">{part.note}</p>
            </li>
          ))}
        </ul>
      </div>
      <p className="border-t border-line-soft px-3 py-2 text-[10px] leading-relaxed text-ink-dim">{fidelity.ceiling}</p>
    </section>
  );
}