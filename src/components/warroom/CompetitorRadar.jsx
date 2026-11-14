/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";

const COLORS = ["hsl(var(--signal))", "hsl(var(--chart-2))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function CompetitorRadar({ radar, competitors }) {
  return (
    <section className="border border-line-soft bg-surface-panel">
      <div className="border-b border-line-soft p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">the oracle · competitive radar</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          Lead against {competitors.length} winner{competitors.length === 1 ? "" : "s"}, each axis a ratio against the
          richest surface read.
        </p>
      </div>

      <div className="h-[290px] w-full p-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radar.rows} outerRadius="72%">
            <PolarGrid stroke="hsl(var(--line))" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(var(--ink-muted))", fontSize: 10 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            {radar.series.map((series, index) => (
              <Radar
                key={series.key}
                name={series.label}
                dataKey={series.key}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={series.is_target ? 0.24 : 0.06}
                strokeWidth={series.is_target ? 2 : 1}
              />
            ))}
            <Legend wrapperStyle={{ fontSize: 10, color: "hsl(var(--ink-muted))" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-1 border-t border-line-soft p-3">
        {radar.rows.map((row) => (
          <p key={row.axis} className="font-mono text-[10px] leading-relaxed text-ink-dim">
            <span className="text-ink-muted">{row.axis}</span> · {row.basis}
          </p>
        ))}
        <p className="pt-1 text-[11px] leading-relaxed text-ink-muted">{radar.verdict}</p>
      </div>
    </section>
  );
}