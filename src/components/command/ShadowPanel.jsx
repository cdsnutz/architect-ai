/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function ShadowPanel({ shadow }) {
  if (!shadow) return null;

  return (
    <section className="border border-line-soft bg-surface-panel">
      <header className="border-b border-line-soft p-2.5">
        <h2 className="font-display text-sm text-ink">Declared endpoints</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          What the lead's own public bundles name. Declarations, never observed traffic: nothing here was called.
        </p>
      </header>

      <div className="p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-mono text-[11px] text-ink">{shadow.host}</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
            {shadow.state.replace("_", " ")} · {shadow.bundles} bundle(s) · {shadow.mode} mode
          </p>
        </div>

        {shadow.endpoints.length > 0 ? (
          <ul className="mt-2 divide-y divide-line-soft border border-line-soft">
            {shadow.endpoints.map((endpoint) => (
              <li key={endpoint} className="px-2 py-1 font-mono text-[10px] text-signal">
                {endpoint}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 font-mono text-[10px] text-ink-dim">no endpoint path is named in the bundles read</p>
        )}

        {shadow.frameworks.length > 0 && (
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
            stack: {shadow.frameworks.join(" · ")}
          </p>
        )}

        <p className="mt-2 text-[11px] leading-relaxed text-ink">{shadow.note}</p>
        <p className="mt-1 font-mono text-[9px] leading-relaxed text-ink-dim">{shadow.limits}</p>
      </div>
    </section>
  );
}