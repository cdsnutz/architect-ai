/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const TONE = {
  complete: "text-signal border-signal/40 bg-signal/10",
  running: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  needs_input: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  failed: "text-red-300 border-red-500/40 bg-red-500/10",
  queued: "text-ink-dim border-line bg-surface-raised",
  skipped: "text-ink-dim border-line bg-surface-raised"
};

export default function MirrorStages({ stages }) {
  return (
    <ol className="divide-y divide-line-soft border border-line-soft bg-surface-sunken">
      {stages.map((stage) => (
        <li key={stage.key} className="p-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12px] text-ink">{stage.label}</p>
              <p className="mt-0.5 font-mono text-[10px] text-ink-dim">
                {(stage.agents || []).join(" · ")}
                {stage.skills && stage.skills.length ? " · " + stage.skills.join(", ") : ""}
              </p>
            </div>
            <span className={"border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider " + (TONE[stage.status] || TONE.queued)}>
              {String(stage.status).replace("_", " ")}
            </span>
          </div>
          {stage.detail && <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{stage.detail}</p>}
        </li>
      ))}
    </ol>
  );
}