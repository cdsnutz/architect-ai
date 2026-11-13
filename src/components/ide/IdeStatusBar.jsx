/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function IdeStatusBar({ items = [] }) {
  return (
    <footer className="sticky bottom-0 z-20 flex h-7 shrink-0 items-center justify-between gap-3 border-t border-line-soft bg-surface-sunken px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-dim">
      <div className="flex min-w-0 items-center gap-3 overflow-hidden">
        {items.map((item) => (
          <span key={item.label} className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-ink-dim">{item.label}</span>
            <span className="truncate text-ink-muted">{item.value}</span>
          </span>
        ))}
      </div>

      <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <span className="h-1.5 w-1.5 bg-signal" />
        read-only
      </span>
    </footer>
  );
}