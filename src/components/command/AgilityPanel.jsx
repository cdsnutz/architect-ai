/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const STATE_TONE = {
  unstable: "text-signal",
  active: "text-amber-300",
  stable: "text-ink-muted",
  baseline: "text-ink-dim",
  interval_short: "text-ink-dim"
};

export default function AgilityPanel({ agility }) {
  if (!agility) return null;

  return (
    <section className="border border-line-soft bg-surface-panel">
      <header className="border-b border-line-soft p-2.5">
        <h2 className="font-display text-sm text-ink">Agility index</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          Text digests of the same paths, compared across passes. A rewrite is a dated event, not an impression.
        </p>
      </header>

      <ul className="divide-y divide-line-soft">
        {agility.rows.map((row) => (
          <li key={row.host} className="p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-[11px] text-ink">
                {row.host}
                <span className="ml-1.5 uppercase tracking-[0.14em] text-ink-dim">{row.role}</span>
              </p>
              <p className={`font-mono text-[10px] uppercase tracking-[0.14em] ${STATE_TONE[row.state] || "text-ink-muted"}`}>
                {row.state.replace("_", " ")}
              </p>
            </div>

            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
              {row.snapshots} digest(s) · {row.span_days}d span
              {row.churn_per_pass !== null ? ` · ${row.churn_per_pass} change(s)/pass` : ""}
            </p>

            {row.money_paths.length > 0 && (
              <ul className="mt-2 divide-y divide-line-soft border border-line-soft">
                {row.money_paths.map((entry) => (
                  <li key={entry.path} className="flex items-center justify-between gap-2 px-2 py-1">
                    <span className="truncate font-mono text-[10px] text-ink">{entry.path}</span>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
                      {entry.changes}x · {String(entry.last_change_at).slice(0, 10)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{row.note}</p>
          </li>
        ))}
      </ul>

      <footer className="border-t border-line-soft p-2.5">
        <p className="text-[11px] leading-relaxed text-ink">{agility.note}</p>
        <p className="mt-1 font-mono text-[9px] leading-relaxed text-ink-dim">{agility.limits}</p>
      </footer>
    </section>
  );
}