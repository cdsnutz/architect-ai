/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function GhostPanel({ ghost }) {
  return (
    <section className="border border-line-soft bg-surface-panel">
      <div className="border-b border-line-soft p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">module 2 · ghost-page diff</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{ghost.note}</p>
      </div>

      {ghost.scars.length > 0 && (
        <ul className="divide-y divide-line-soft border-b border-line-soft">
          {ghost.scars.map((scar) => (
            <li key={scar.host + scar.family} className="border-l-2 border-amber-500/60 p-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-amber-300">scar tissue · {scar.host}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink">{scar.message}</p>
            </li>
          ))}
        </ul>
      )}

      <ul className="divide-y divide-line-soft">
        {ghost.rows.map((row) => (
          <li key={row.host} className="p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] text-ink">{row.host}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-dim">{row.role}</span>
              </div>
              <p className="font-mono text-[10px] text-ink-muted">
                {row.state === "compared"
                  ? `${row.deleted} deleted of ${row.archive_paths} archived`
                  : row.state}
              </p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{row.note}</p>
            {row.families?.length > 0 && (
              <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-dim">
                {row.families.map((family) => "/" + family.family + " −" + family.count).join(" · ")}
              </p>
            )}
            {row.examples?.length > 0 && (
              <p className="mt-0.5 break-words font-mono text-[10px] leading-relaxed text-ink-dim">
                e.g. {row.examples.slice(0, 4).join(", ")}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}