/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer
} from "recharts";

const STROKE = ["#22c55e", "#60a5fa", "#a78bfa", "#f59e0b"];

export default function SovereignDashboard({ dashboard }) {
  if (!dashboard) return null;

  // Hostnames contain dots, which recharts reads as a nested path, so each
  // series is keyed by position instead.
  const series = dashboard.series.map((entry, index) => ({ ...entry, key: `s${index}` }));

  const data = dashboard.axes.map((axis) => {
    const row = { axis: axis.label };
    series.forEach((entry) => {
      const value = entry.values[axis.key];
      row[entry.key] = value === null ? 0 : value;
    });
    return row;
  });

  const unmeasured = dashboard.series.filter((entry) => entry.values.velocity === null).map((entry) => entry.host);

  return (
    <section className="border border-line-soft bg-surface-panel">
      <header className="border-b border-line-soft p-2.5">
        <h2 className="font-display text-sm text-ink">Sovereign dashboard</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          Five axes per surface, normalised against the surfaces read in this pass. Void list and roadmap are derived
          from the same captures.
        </p>
      </header>

      <div className="grid gap-3 p-3 lg:grid-cols-2">
        <div className="border border-line-soft bg-surface-sunken p-1.5">
          <p className="px-1 pb-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim">permeability radar</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} outerRadius="72%">
                <PolarGrid stroke="hsl(var(--line))" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#8b98a5", fontSize: 9 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                {series.map((entry, index) => (
                  <Radar
                    key={entry.host}
                    dataKey={entry.key}
                    stroke={STROKE[index % STROKE.length]}
                    fill={STROKE[index % STROKE.length]}
                    fillOpacity={entry.role === "lead" ? 0.24 : 0.08}
                    strokeWidth={entry.role === "lead" ? 2 : 1}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 px-1 pb-1">
            {dashboard.series.map((entry, index) => (
              <span key={entry.host} className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
                <span style={{ color: STROKE[index % STROKE.length] }}>■</span> {entry.host} · {entry.role}
              </span>
            ))}
          </div>
        </div>

        <div className="border border-line-soft">
          <div className="grid grid-cols-5 gap-1 border-b border-line-soft bg-surface-sunken px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-dim">
            <span className="col-span-1">surface</span>
            <span>depth</span>
            <span>speed</span>
            <span>hard</span>
            <span>gravity</span>
          </div>
          {dashboard.series.map((entry) => (
            <div key={entry.host} className="grid grid-cols-5 gap-1 border-b border-line-soft px-2 py-1 font-mono text-[10px] text-ink-muted last:border-b-0">
              <span className="col-span-1 truncate text-ink">{entry.host}</span>
              <span>{entry.measures.content}</span>
              <span>{entry.measures.ttfb_ms}ms</span>
              <span>{entry.measures.headers}/5</span>
              <span>{entry.measures.money_share}%</span>
            </div>
          ))}
          {unmeasured.length > 0 && (
            <p className="px-2 py-1 font-mono text-[9px] leading-relaxed text-ink-dim">
              velocity unmeasured for {unmeasured.join(", ")}: one digest is a baseline
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-line-soft">
        <p className="border-b border-line-soft bg-surface-sunken px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim">
          void list
        </p>
        {dashboard.voids.length ? (
          <ul className="divide-y divide-line-soft">
            {dashboard.voids.map((voidEntry) => (
              <li key={voidEntry.family} className="grid gap-1 p-2.5 sm:grid-cols-3">
                <p className="truncate font-mono text-[10px] text-ink">{voidEntry.present_in.join(", ")}</p>
                <p className="font-mono text-[10px] text-signal">/{voidEntry.family}</p>
                <p className="text-[10px] leading-relaxed text-ink-muted">{voidEntry.opportunity}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-2.5 text-[11px] text-ink-muted">No winner-consensus family is missing from the lead.</p>
        )}
      </div>

      <div className="border-t border-line-soft">
        <p className="border-b border-line-soft bg-surface-sunken px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim">
          sovereign roadmap
        </p>
        <div className="grid gap-2 p-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {dashboard.roadmap.map((week) => (
            <div key={week.week} className="border border-line-soft bg-surface-sunken p-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">week {week.week}</p>
              <p className="mt-0.5 font-display text-[11px] text-ink">{week.label}</p>
              <ul className="mt-1.5 space-y-1.5">
                {week.items.map((item) => (
                  <li key={item.title}>
                    <p className="text-[10px] leading-snug text-ink">{item.title}</p>
                    <p className="mt-0.5 font-mono text-[9px] leading-relaxed text-ink-dim">{item.evidence}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-line-soft p-2.5">
        <p className="text-[11px] leading-relaxed text-ink">{dashboard.note}</p>
        <p className="mt-1 font-mono text-[9px] leading-relaxed text-ink-dim">{dashboard.limits}</p>
      </footer>
    </section>
  );
}