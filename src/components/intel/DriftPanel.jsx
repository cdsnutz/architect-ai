/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function DriftPanel({ drift }) {
  return (
    <section className="border border-line-soft bg-surface-panel">
      <div className="border-b border-line-soft p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">module 1 · temporal drift</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{drift.note}</p>
      </div>

      {drift.warnings.length > 0 && (
        <ul className="divide-y divide-line-soft border-b border-line-soft">
          {drift.warnings.map((warning) => (
            <li key={warning.host + warning.family} className="bg-signal/5 p-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-signal">velocity alert</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink">{warning.message}</p>
            </li>
          ))}
        </ul>
      )}

      <ul className="divide-y divide-line-soft">
        {drift.rows.map((row) => (
          <li key={row.host} className="p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] text-ink">{row.host}</span>
                <span className="border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-dim">
                  {row.role}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-dim">{row.state}</span>
              </div>
              <p className="font-mono text-[10px] text-ink-muted">
                {row.state === "tracked"
                  ? `+${row.added} / −${row.removed} in ${row.days}d · ${row.rate_per_day}/day · 21d ≈ +${row.projection_21d}`
                  : row.state === "interval_short"
                    ? `+${row.added} / −${row.removed} in ${row.hours}h · no rate yet`
                    : `${row.paths} paths`}
              </p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{row.note}</p>
            {row.families?.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {row.families.slice(0, 6).map((family) => (
                  <span
                    key={row.host + family.family}
                    className={
                      "border px-1.5 py-0.5 font-mono text-[9px] " +
                      (family.delta > 0 ? "border-signal/40 bg-signal/10 text-signal" : "border-line bg-surface-sunken text-ink-dim")
                    }
                  >
                    /{family.family} {family.delta > 0 ? "+" : ""}{family.delta}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}