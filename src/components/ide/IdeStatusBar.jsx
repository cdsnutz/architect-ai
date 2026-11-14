/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function IdeStatusBar({ items = [] }) {
  return (
    <footer className="sticky bottom-0 z-20 flex h-7 shrink-0 items-center justify-between gap-3 border-t border-line-soft bg-[hsl(var(--surface-sunken)/0.94)] px-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-dim backdrop-blur">
      <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
        {items.map((item, index) => (
          <span key={item.label} className="flex min-w-0 items-center gap-2.5">
            {index > 0 && <span aria-hidden className="h-2.5 w-px shrink-0 bg-line" />}
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0">{item.label}</span>
              <span className="truncate text-ink">{item.value}</span>
            </span>
          </span>
        ))}
      </div>

      <span className="hidden shrink-0 items-center gap-2 sm:flex">
        <span className="h-1.5 w-1.5 bg-signal shadow-[0_0_7px_hsl(var(--signal)/0.9)]" />
        read-only
      </span>
    </footer>
  );
}