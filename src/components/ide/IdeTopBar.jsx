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
    <header className="sticky top-0 z-30 flex h-11 shrink-0 items-center justify-between gap-3 border-b border-line-soft bg-surface-base px-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 font-display text-[13px] font-bold tracking-tight text-ink no-underline"
        >
          <ScanLine className="h-4 w-4 text-signal" />
          REVENGINE
        </Link>
        <span className="hidden truncate font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim sm:inline">
          {crumb}
        </span>
      </div>

      <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">{note}</p>
    </header>
  );
}