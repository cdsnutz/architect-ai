/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const KIND_TONE = {
  sink: "text-signal",
  hub: "text-ink",
  leaf: "text-ink-dim"
};

export default function GravityPanel({ gravity }) {
  if (!gravity) return null;

  return (
    <section className="border border-line-soft bg-surface-panel">
      <header className="border-b border-line-soft p-2.5">
        <h2 className="font-display text-sm text-ink">Gravity map</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          Which pages the site's own linking pushes a reader into, read from the links on the pages this pass fetched.
        </p>
      </header>

      <div className="divide-y divide-line-soft">
        {gravity.rows.map((row) => (
          <article key={row.host} className="p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-[11px] text-ink">
                {row.host}
                <span className="ml-1.5 uppercase tracking-[0.14em] text-ink-dim">{row.role}</span>
              </p>
              <p className="font-mono text-[10px] text-ink-muted">
                {row.money_share}% to money paths · {row.links} links · {row.pages_crawled} pages
              </p>
            </div>

            {row.gravity.length ? (
              <ul className="mt-2 divide-y divide-line-soft border border-line-soft">
                {row.gravity.map((entry) => (
                  <li key={entry.path} className="flex items-center justify-between gap-2 px-2 py-1">
                    <span className={`truncate font-mono text-[10px] ${KIND_TONE[entry.kind] || "text-ink"}`}>
                      {entry.path}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
                      {entry.kind} · {entry.inbound} in · {entry.share}%
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 font-mono text-[10px] text-ink-dim">no internal links on the pages read</p>
            )}

            <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
              {row.funnel.found
                ? `shortest money path: ${row.funnel.trail.join(" → ")} (${row.funnel.depth} hop(s))`
                : "no conversion path reachable inside the pages crawled"}
            </p>
          </article>
        ))}
      </div>

      <footer className="border-t border-line-soft p-2.5">
        <p className="text-[11px] leading-relaxed text-ink">{gravity.note}</p>
        <p className="mt-1 font-mono text-[9px] leading-relaxed text-ink-dim">{gravity.limits}</p>
      </footer>
    </section>
  );
}