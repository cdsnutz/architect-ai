/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function IdePanel({ label, right = null, bodyClassName = "", className = "", children }) {
  return (
    <section className={`border border-line-soft bg-surface-panel ${className}`}>
      {(label || right) && (
        <div className="flex items-center justify-between gap-3 border-b border-line-soft bg-[hsl(var(--surface-raised)/0.35)] px-3.5 py-2">
          <p className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-muted">
            <span aria-hidden className="h-1 w-1 bg-signal" />
            {label}
          </p>
          {right}
        </div>
      )}
      <div className={`p-3.5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}