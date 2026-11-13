/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function IdeStatusBar({ items = [] }) {
  return (
    <footer className="sticky bottom-0 z-20 flex h-7 shrink-0 items-center justify-between gap-3 border-t border-[#1c2431] bg-[#0B0F14] px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#7d8a99]">
      <div className="flex min-w-0 items-center gap-3 overflow-hidden">
        {items.map((item) => (
          <span key={item.label} className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-[#5c6875]">{item.label}</span>
            <span className="truncate text-[#9AA7B6]">{item.value}</span>
          </span>
        ))}
      </div>

      <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <span className="h-1.5 w-1.5 bg-[#22C55E]" />
        read-only
      </span>
    </footer>
  );
}