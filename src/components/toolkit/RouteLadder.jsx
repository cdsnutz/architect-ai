/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { REVERSE_ROUTES } from "@/lib/reverseSkill";

const LANE = {
  in_contract: { label: "in contract", className: "border-signal/40 bg-signal/10 text-signal" },
  authorized: { label: "authorized only", className: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  off_contract: { label: "off contract", className: "border-red-500/40 bg-red-500/10 text-red-300" }
};

export default function RouteLadder({ routes = REVERSE_ROUTES }) {
  const counts = routes.reduce((acc, route) => {
    acc[route.lane] = (acc[route.lane] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft p-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">scenario ladder</p>
          <h2 className="mt-1 font-display text-sm text-ink">Where each playbook plugs into the run</h2>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
          {counts.in_contract || 0} in · {counts.authorized || 0} auth · {counts.off_contract || 0} off
        </p>
      </div>

      <ul className="divide-y divide-line-soft">
        {routes.map((route) => {
          const lane = LANE[route.lane];
          return (
            <li key={route.goal} className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-start sm:gap-3">
              <div className="min-w-0 sm:w-56 sm:shrink-0">
                <p className="truncate text-[11px] text-ink">{route.goal}</p>
                <p className="truncate font-mono text-[10px] text-ink-dim">{route.skill}</p>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">{route.stage}</span>
                <span className={"border px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider " + lane.className}>
                  {lane.label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-line-soft px-3 py-2 text-[11px] leading-relaxed text-ink-dim">
        Transcribed from the package README at v1.0.1. The indexed tree above is the source of truth for each path, and
        anything marked off contract is listed so the boundary is explicit, not so it can be run from here.
      </p>
    </div>
  );
}