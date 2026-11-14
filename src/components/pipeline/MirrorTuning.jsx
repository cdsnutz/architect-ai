/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function MirrorTuning({ tuning }) {
  if (!tuning) return null;
  const tuned = tuning.verdict === "tuned";
  const max = Math.max(1, ...tuning.timings.map((part) => part.ms));

  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft p-2.5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">pod latency · final tuning</p>
          <p className="mt-0.5 font-mono text-[10px] text-ink-muted">
            {tuning.gatekeeper} · hold {tuning.hold_ms ?? "—"} ms / setpoint {tuning.setpoint_ms ?? "—"} ms · pod lag{" "}
            {tuning.total_ms} ms off-path
          </p>
        </div>
        <span
          className={
            "border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider " +
            (tuned ? "border-signal/40 bg-signal/10 text-signal" : "border-amber-500/40 bg-amber-500/10 text-amber-300")
          }
        >
          {tuning.verdict}
        </span>
      </div>

      <ul className="divide-y divide-line-soft">
        {tuning.timings.map((part) => (
          <li key={part.key} className="px-2.5 py-1">
            <div className="flex items-baseline justify-between gap-2 font-mono text-[10px]">
              <span className="truncate text-ink-muted">{part.agents.join(" + ") || part.label}</span>
              <span className="text-ink-dim">{part.ms} ms</span>
            </div>
            <div className="mt-0.5 h-0.5 w-full bg-surface-sunken">
              <div className="h-0.5 bg-signal/60" style={{ width: Math.round((part.ms / max) * 100) + "%" }} />
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-line-soft p-2.5">
        <p className="font-mono text-[10px] text-ink-dim">
          {tuning.serve_budget_ms !== null
            ? "serve budget for your deploy " + tuning.serve_budget_ms + " ms"
            : "no setpoint measured"}
          {tuning.trim_targets?.length ? " · trim: " + tuning.trim_targets.map((target) => target.agents + " " + target.ms + "ms").join(", ") : ""}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{tuning.note}</p>
      </div>
    </div>
  );
}