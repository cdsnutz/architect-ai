/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const TONE = {
  supported: "border-signal/40 bg-signal/10 text-signal",
  unsupported: "border-red-500/50 bg-red-500/15 text-red-300",
  unverified: "border-line bg-surface-sunken text-ink-dim"
};

export default function EntropyPanel({ entropy }) {
  return (
    <section className="border border-line-soft bg-surface-panel">
      <div className="border-b border-line-soft p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">module 3 · semantic entropy</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{entropy.note}</p>
      </div>

      <ul className="divide-y divide-line-soft">
        {entropy.rows.map((row) => (
          <li key={row.host} className="p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] text-ink">{row.host}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-dim">{row.role}</span>
              </div>
              <p className="font-mono text-[10px] text-ink-muted">
                {row.gap_pct === null ? "not scoreable" : row.gap_pct + "% credibility gap"}
              </p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{row.note}</p>

            {row.claims.length > 0 && (
              <ul className="mt-1.5 space-y-1.5">
                {row.claims.map((claim) => (
                  <li key={row.host + claim.id} className="border-l border-line pl-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={"border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] " + TONE[claim.verdict]}>
                        {claim.verdict}
                      </span>
                      <span className="font-mono text-[10px] text-ink">“{claim.quote}”</span>
                    </div>
                    <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-muted">{claim.reality}</p>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <p className="border-t border-line-soft p-3 font-mono text-[9px] leading-relaxed text-ink-dim">{entropy.limits}</p>
    </section>
  );
}