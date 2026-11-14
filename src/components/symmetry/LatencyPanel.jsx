/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import Panel from "./Panel";

const CELL = "border border-line-soft bg-surface-sunken px-2 py-1.5";

export default function LatencyPanel({ latency }) {
  if (!latency) return null;
  if (!latency.target) {
    return (
      <Panel title="Latency equilibrium" meta="no samples">
        <p className="text-[11px] text-ink-dim">{latency.note}</p>
      </Panel>
    );
  }

  const { target, pid } = latency;
  return (
    <Panel title="Latency equilibrium" meta={latency.samples + " samples"}>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {[
          ["p50", target.p50],
          ["p90", target.p90],
          ["min", target.min],
          ["max", target.max]
        ].map(([label, value]) => (
          <div key={label} className={CELL}>
            <p className="font-mono text-[9px] uppercase tracking-wider text-ink-dim">{label}</p>
            <p className="font-mono text-[13px] text-ink">{value} ms</p>
          </div>
        ))}
      </div>

      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        <div className={CELL}>
          <p className="font-mono text-[9px] uppercase tracking-wider text-ink-dim">hold in your mirror</p>
          <p className="font-mono text-[13px] text-signal">{latency.hold_ms} ms ±{latency.band_ms}</p>
        </div>
        <div className={CELL}>
          <p className="font-mono text-[9px] uppercase tracking-wider text-ink-dim">assumed warm serve</p>
          <p className="font-mono text-[13px] text-ink-muted">{latency.assumed_serve_ms} ms</p>
        </div>
      </div>

      <p className="mt-2 font-mono text-[10px] leading-relaxed text-ink-muted">
        pid kp {pid.kp} · ki {pid.ki} · kd {pid.kd} · setpoint {pid.setpoint_ms} ms · tolerance ±{pid.tolerance_ms} ms
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-ink">{latency.verdict}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{latency.guidance}</p>
      <p className="mt-2 text-[10px] leading-relaxed text-ink-dim">{latency.note}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-ink-dim">{pid.note}</p>
    </Panel>
  );
}