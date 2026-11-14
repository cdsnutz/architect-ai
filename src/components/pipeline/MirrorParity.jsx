/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const VERDICTS = {
  match: "border-signal/40 bg-signal/10 text-signal",
  drift: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  missing: "border-red-500/40 bg-red-500/10 text-red-300",
  unreachable: "border-red-500/40 bg-red-500/10 text-red-300"
};

function Row({ label, left, right, verdict }) {
  return (
    <li className="grid grid-cols-[1fr_auto_1fr_auto] items-baseline gap-2 py-1">
      <span className="truncate font-mono text-[10px] text-ink-muted">{left || "none"}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-dim">{label}</span>
      <span className="truncate text-right font-mono text-[10px] text-ink">{right || "none"}</span>
      <span className={"border px-1 py-0.5 font-mono text-[9px] uppercase " + (VERDICTS[verdict] || VERDICTS.drift)}>
        {verdict}
      </span>
    </li>
  );
}

export default function MirrorParity({ candidateUrl, diff, isomorphism }) {
  if (!candidateUrl) {
    return (
      <div className="border border-line-soft bg-surface-panel p-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">symmetry vs your deploy</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
          No candidate was supplied, so parity, structural and route signals are unmeasured. Re-run with your staging
          deploy filled in to score against it.
        </p>
      </div>
    );
  }

  const rows = diff?.rows || [];
  const routes = diff?.routes || [];

  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft p-2.5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">symmetry vs your deploy</p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-ink">{candidateUrl}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {isomorphism && (
            <span className="border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-muted">
              shape {isomorphism.score}%
            </span>
          )}
          {diff && (
            <span className="border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-muted">
              {diff.matched}/{diff.total} signals · {diff.verdict}
            </span>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <ul className="divide-y divide-line-soft px-2.5 py-1">
          {rows.map((row) => (
            <Row key={row.key} label={row.key} left={row.baseline} right={row.candidate} verdict={row.verdict} />
          ))}
        </ul>
      )}

      {routes.length > 0 && (
        <div className="border-t border-line-soft p-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">route reachability</p>
          <ul className="mt-1 space-y-0.5">
            {routes.map((route) => (
              <li key={route.path} className="flex items-center justify-between gap-2 font-mono text-[10px]">
                <span className="truncate text-ink-muted">{route.path}</span>
                <span className="text-ink-dim">
                  {route.baseline} / {route.candidate} · {route.verdict}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {diff?.note && <p className="border-t border-line-soft p-2.5 text-[10px] leading-relaxed text-ink-dim">{diff.note}</p>}
    </div>
  );
}