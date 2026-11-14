/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const ROWS = [
  { path: "/api/v1/users", label: "Declared", tone: "border-line bg-[hsl(var(--surface-raised))] text-ink-muted" },
  { path: "/account/billing", label: "Verified", tone: "border-[hsl(var(--signal)/0.35)] bg-[hsl(var(--signal)/0.12)] text-signal" },
  { path: "/internal/export", label: "Hidden", tone: "border-[hsl(43_74%_66%/0.35)] bg-[hsl(43_74%_66%/0.12)] text-[hsl(43_74%_66%)]" },
  { path: "/api/v1/orders/{id}", label: "Live", tone: "border-[hsl(330_70%_66%/0.35)] bg-[hsl(330_70%_66%/0.12)] text-[hsl(330_70%_66%)]" },
  {
    path: "/api/v1/orders/{id}",
    label: "pattern_match",
    tone: "border-line bg-[hsl(var(--surface-raised))] text-ink-muted",
  },
];

export default function TruthTablePreview() {
  return (
    <div className="lt-up-late relative overflow-hidden border border-line bg-[hsl(var(--surface-panel)/0.92)] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.85),0_0_0_1px_hsl(var(--ink)/0.04)] backdrop-blur">
      <span className="lt-scan pointer-events-none absolute inset-y-0 left-0 w-px bg-[linear-gradient(180deg,transparent,hsl(var(--signal)),transparent)] shadow-[0_0_14px_2px_hsl(var(--signal)/0.8)]" />

      <div className="flex items-center justify-between border-b border-line-soft bg-[hsl(var(--surface-raised)/0.4)] px-3.5 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="block h-1.5 w-1.5 bg-line" />
          <span className="block h-1.5 w-1.5 bg-line" />
          <span className="block h-1.5 w-1.5 bg-line" />
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim">
          <span className="h-1 w-1 bg-signal" />
          live table
        </span>
      </div>

      <div className="px-3.5 pb-1.5">
        {ROWS.map((row, index) => (
          <div
            key={`${row.label}-${index}`}
            className="flex items-center justify-between border-b border-line-soft py-2.5 font-mono text-[11.5px] text-ink last:border-b-0"
          >
            <span className="truncate pr-2">{row.path}</span>
            <span
              className={`shrink-0 border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em] ${row.tone}`}
            >
              {row.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}