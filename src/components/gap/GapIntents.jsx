/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const TONE = {
  absent: "border-red-500/40 bg-red-500/10 text-red-300",
  thin: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
  covered: "border-signal/40 bg-signal/10 text-signal"
};

export default function GapIntents({ intents }) {
  if (!intents?.length) return null;
  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="border-b border-line-soft p-2.5">
        <h2 className="font-display text-sm text-ink">Intent map</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          Search intent by search intent: what you publish against what the winners publish in each. The same intent
          counts as served wherever it is filed; an archive index counts as neither.
        </p>
      </div>
      <ul className="divide-y divide-line-soft">
        {intents.map((row) => (
          <li key={row.intent} className="flex flex-wrap items-start justify-between gap-2 p-2.5">
            <div className="min-w-0">
              <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink">{row.intent}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-ink-dim">{row.why}</p>
              <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-muted">
                {row.yours?.length ? "you · " + row.yours.slice(0, 2).join("  ·  ") : "you publish nothing here"}
              </p>
              {row.examples?.length > 0 && (
                <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-ink-dim">
                  winners · {row.examples.slice(0, 2).join("  ·  ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-ink-muted">
                you <span className="text-ink">{row.lead}</span> / winners <span className="text-ink">{row.winners}</span>
              </span>
              <span className={"border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] " + TONE[row.verdict]}>
                {row.verdict}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}