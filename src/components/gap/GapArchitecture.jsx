/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

// Width against focus. A path count on its own says nothing; paired with how much of
// that surface sits in territory the winners also serve, it says whether the lead is
// drifted (wrong families) or merely broad (right families, thinner in some).
export default function GapArchitecture({ architecture }) {
  if (!architecture) return null;
  const winners = architecture.winner_paths || [];
  const thinnest = architecture.thinnest || [];
  const drift = architecture.drift || {};
  const driftRows = [
    ...(drift.absent || []).map((intent) => ({ intent, kind: "absent" })),
    ...(drift.thin || []).map((intent) => ({ intent, kind: "thin" })),
  ];

  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft p-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">architecture · width against focus</p>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
          {architecture.loose_paths} paths in no shared family
        </p>
      </div>
      <div className="space-y-2.5 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="border border-line-soft bg-surface-sunken p-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">your surface</p>
            <p className="mt-1 font-display text-lg text-ink">
              {architecture.lead_paths}
              <span className="ml-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">paths</span>
            </p>
            <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-muted">
              {architecture.focus_pct}% sit in territory the winners also serve
            </p>
          </div>
          <div className="border border-line-soft bg-surface-sunken p-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">winner surfaces</p>
            {winners.map((winner) => (
              <p key={winner.host} className="mt-1 flex items-baseline justify-between gap-2 font-mono text-[10px] text-ink-muted">
                <span className="truncate">{winner.host}</span>
                <span className="shrink-0 text-ink">{winner.paths} paths</span>
              </p>
            ))}
          </div>
        </div>

        {driftRows.length > 0 && (
          <p className="font-mono text-[10px] leading-relaxed text-ink-muted">
            drift ·{" "}
            {driftRows.map((row) => (
              <span key={row.kind + row.intent} className={row.kind === "absent" ? "text-red-300" : "text-yellow-300"}>
                {row.intent} ({row.kind}){" "}
              </span>
            ))}
          </p>
        )}

        {(architecture.unmatched?.intents || []).length > 0 && (
          <p className="font-mono text-[10px] leading-relaxed text-ink-muted">
            <span className="text-signal">unmatched hold</span> ·{" "}
            <span className="text-ink">
              {architecture.unmatched.paths} paths in {(architecture.unmatched.intents || []).join(", ")}
            </span>{" "}
            — no winner serves these with more than one page
          </p>
        )}

        {thinnest.length > 0 && (
          <p className="font-mono text-[10px] leading-relaxed text-ink-muted">
            thin spots ·{" "}
            {thinnest.map((row) => (
              <span key={row.intent} className="text-ink">
                {row.intent} {row.you} against {row.winners}{" "}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}