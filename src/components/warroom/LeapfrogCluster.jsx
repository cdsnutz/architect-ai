/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function LeapfrogCluster({ leapfrog }) {
  const { coverage, cluster, golden, all_three: allThree, note } = leapfrog;

  return (
    <section className="border border-line-soft bg-surface-panel">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line-soft p-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">dominance cluster · coverage gap</p>
          <p className="mt-0.5 font-display text-2xl text-ink">
            {coverage.gap_pct}
            <span className="ml-1 text-xs text-ink-dim">% of the cluster missing</span>
          </p>
        </div>
        <p className="max-w-sm text-[11px] leading-relaxed text-ink-muted">{note}</p>
      </div>

      {cluster.length > 0 && (
        <ul className="divide-y divide-line-soft">
          {cluster.map((row) => (
            <li key={row.intent} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink">{row.intent}</span>
                {allThree.includes(row.intent) && (
                  <span className="border border-signal/40 bg-signal/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-signal">
                    all three
                  </span>
                )}
              </div>
              <p className="font-mono text-[10px] text-ink-muted">
                you {row.you} · winners {row.winners_paths} · {row.held_by.length} hold{row.held_by.length === 1 ? "s" : ""} it
              </p>
            </li>
          ))}
        </ul>
      )}

      {golden.length > 0 && (
        <div className="border-t border-line-soft p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">golden path</p>
          <ul className="mt-1.5 space-y-2">
            {golden.map((item) => (
              <li key={item.intent} className="border-l border-signal/40 pl-2">
                <p className="font-mono text-[11px] text-ink">{item.path}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{item.why}</p>
                <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-ink-dim">{item.requirement}</p>
                {item.evidence && (
                  <p className="mt-0.5 break-words font-mono text-[10px] leading-relaxed text-ink-dim">{item.evidence}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}