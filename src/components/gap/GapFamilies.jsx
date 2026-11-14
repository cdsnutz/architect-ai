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

export default function GapFamilies({ families }) {
  if (!families?.length) return null;
  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="border-b border-line-soft p-2.5">
        <h2 className="font-display text-sm text-ink">Permeability map</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          Path family by path family: what you publish against what the winners publish. Absent means zero.
        </p>
      </div>
      <ul className="divide-y divide-line-soft">
        {families.map((row) => (
          <li key={row.family} className="flex flex-wrap items-start justify-between gap-2 p-2.5">
            <div className="min-w-0">
              <p className="font-mono text-[12px] text-ink">/{row.family}</p>
              <p className="mt-0.5 font-mono text-[10px] text-ink-dim">
                {row.intent} intent · held by {row.holders.join(", ")}
              </p>
              <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-muted">
                {row.examples.slice(0, 3).join("  ·  ")}
              </p>
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