/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function MirrorGate({ gate, refusals }) {
  const passed = gate.passed;

  return (
    <div className="space-y-2">
      <div className="border border-line-soft bg-surface-panel">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft p-2.5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">symmetry score</p>
            <p className="mt-0.5 font-display text-2xl text-ink">
              {gate.score}
              <span className="ml-1 text-xs text-ink-dim">/ 100</span>
            </p>
          </div>
          <span
            className={
              "border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider " +
              (passed ? "border-signal/40 bg-signal/10 text-signal" : "border-amber-500/40 bg-amber-500/10 text-amber-300")
            }
          >
            {gate.verdict} · gate {gate.threshold}
          </span>
        </div>
        {gate.blockers.length > 0 && (
          <div className="p-2.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">blocking components</p>
            <ul className="mt-1 space-y-0.5">
              {gate.blockers.map((blocker) => (
                <li key={blocker} className="font-mono text-[10px] text-ink-muted">· {blocker}</li>
              ))}
            </ul>
          </div>
        )}
        {gate.ceiling && <p className="border-t border-line-soft p-2.5 text-[11px] leading-relaxed text-ink-muted">{gate.ceiling}</p>}
      </div>

      {refusals && refusals.length > 0 && (
        <div className="border border-line-soft bg-surface-panel">
          <p className="border-b border-line-soft p-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
            out of contract
          </p>
          <ul className="divide-y divide-line-soft">
            {refusals.map((refusal) => (
              <li key={refusal.key} className="p-2.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-300">{refusal.key}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{refusal.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}