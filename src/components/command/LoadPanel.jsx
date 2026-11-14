/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function LoadPanel({ cognitive }) {
  if (!cognitive) return null;

  const rows = [...cognitive.rows].sort((left, right) => right.load - left.load);

  return (
    <section className="border border-line-soft bg-surface-panel">
      <header className="border-b border-line-soft p-2.5">
        <h2 className="font-display text-sm text-ink">Cognitive load</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          How many decisions one entry document asks of a reader, measured rather than felt.
        </p>
      </header>

      <ul className="divide-y divide-line-soft">
        {rows.map((row) => (
          <li key={row.host} className="p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-[11px] text-ink">
                {row.host}
                <span className="ml-1.5 uppercase tracking-[0.14em] text-ink-dim">{row.role}</span>
              </p>
              <p className="font-mono text-[10px] text-ink-muted">load {row.load}</p>
            </div>

            <div className="mt-1.5 h-1 w-full bg-surface-sunken">
              <div className="h-1 bg-signal" style={{ width: `${Math.min(100, row.load)}%` }} />
            </div>

            <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
              {row.decisions} decisions · {row.ctas} ctas · {row.fields} fields · {row.entropy_bits} bits · {row.words} words
            </p>
          </li>
        ))}
      </ul>

      <footer className="border-t border-line-soft p-2.5">
        <p className="text-[11px] leading-relaxed text-ink">{cognitive.note}</p>
        <p className="mt-1 font-mono text-[9px] leading-relaxed text-ink-dim">load = {cognitive.formula}</p>
        <p className="mt-1 font-mono text-[9px] leading-relaxed text-ink-dim">{cognitive.limits}</p>
      </footer>
    </section>
  );
}