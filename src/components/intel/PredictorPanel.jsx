/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function PredictorPanel({ predictor }) {
  return (
    <section className="border border-line-soft bg-surface-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft p-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">module 4 · synthetic path predictor</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{predictor.note}</p>
        </div>
        <p className="font-mono text-[10px] text-ink-muted">
          {predictor.confirmed.length} confirmed · {predictor.probed} probed
        </p>
      </div>

      {predictor.confirmed.length > 0 && (
        <ul className="divide-y divide-line-soft">
          {predictor.confirmed.map((asset) => (
            <li key={asset.url} className="bg-signal/5 p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="border border-signal/40 bg-signal/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-signal">
                  dark asset
                </span>
                <span className="font-mono text-[11px] text-ink">{asset.path}</span>
                <span className="font-mono text-[9px] text-ink-dim">HTTP {asset.status}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                Reached by the surface's own naming pattern, answering a page while absent from its sitemap and navigation.
              </p>
            </li>
          ))}
        </ul>
      )}

      {predictor.absent.length > 0 && (
        <div className="border-t border-line-soft p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">predicted, not found</p>
          <p className="mt-1 break-words font-mono text-[10px] leading-relaxed text-ink-dim">
            {predictor.absent.map((row) => row.path).join(" · ")}
          </p>
        </div>
      )}

      <p className="border-t border-line-soft p-3 font-mono text-[9px] leading-relaxed text-ink-dim">{predictor.limits}</p>
    </section>
  );
}