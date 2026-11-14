/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Link } from "react-router-dom";
import { ScanLine } from "lucide-react";

export default function IdeTopBar({ crumb, note }) {
  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line-soft bg-[hsl(var(--surface-base)/0.9)] px-3 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2.5">
        <Link to="/" className="group flex shrink-0 items-center gap-2 no-underline">
          <span className="flex h-6 w-6 items-center justify-center border border-[hsl(var(--signal)/0.35)] bg-[hsl(var(--signal)/0.1)] transition-colors group-hover:bg-[hsl(var(--signal)/0.18)]">
            <ScanLine className="h-3.5 w-3.5 text-signal" strokeWidth={2.1} />
          </span>
          <span className="font-display text-[12.5px] font-bold uppercase tracking-[0.16em] text-ink">
            REVENGINE
          </span>
        </Link>

        <span aria-hidden className="h-3.5 w-px shrink-0 bg-line" />

        <span className="hidden min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted sm:inline">
          {crumb}
        </span>
      </div>

      <p className="hidden shrink-0 border border-line-soft bg-surface-sunken px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-dim sm:block">
        {note}
      </p>
    </header>
  );
}