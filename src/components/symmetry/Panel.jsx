/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function Panel({ title, meta = null, children }) {
  return (
    <section className="border border-line-soft bg-surface-panel">
      <header className="flex items-center justify-between gap-3 border-b border-line-soft px-3 py-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">{title}</h2>
        {meta && <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">{meta}</span>}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}