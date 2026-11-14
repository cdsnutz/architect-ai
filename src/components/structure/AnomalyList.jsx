/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const TONE = {
  structural: "border-red-500/40 bg-red-500/10 text-red-300",
  material: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  minor: "border-line bg-surface-raised text-ink-dim"
};

export default function AnomalyList({ anomalies }) {
  if (!anomalies.length) {
    return (
      <div className="border border-line-soft bg-surface-panel p-3">
        <p className="text-[11px] leading-relaxed text-ink-muted">
          No structural anomaly detected in this capture. Run another pass to widen the sample before reading that as clean.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line-soft border border-line-soft bg-surface-panel">
      {anomalies.map((anomaly) => (
        <li key={anomaly.key} className="p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-[12px] text-ink">{anomaly.title}</h3>
            <span className={"border px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider " + TONE[anomaly.severity]}>
              {anomaly.severity}
            </span>
          </div>
          <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-dim">{anomaly.observed}</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
            <span className="mr-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-signal">fix</span>
            {anomaly.fix}
          </p>
          {anomaly.nodes.length > 0 && (
            <p className="mt-1 break-all font-mono text-[10px] text-ink-dim">{anomaly.nodes.join(" · ")}</p>
          )}
        </li>
      ))}
    </ul>
  );
}