/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const LANE = {
  in_contract: { label: "in contract", className: "border-signal/40 bg-signal/10 text-signal" },
  authorized: { label: "authorized only", className: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  off_contract: { label: "off contract", className: "border-red-500/40 bg-red-500/10 text-red-300" }
};

export default function CapabilityLanes({ capabilities = [], licenseNote = "" }) {
  if (!capabilities.length) return null;

  return (
    <div className="border border-line-soft bg-surface-panel p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">what this toolkit can do here</p>
      <ul className="mt-2 divide-y divide-line-soft">
        {capabilities.map((item) => {
          const lane = LANE[item.lane];
          return (
            <li key={item.name} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:gap-3">
              <div className="flex items-center gap-2 sm:w-44 sm:shrink-0">
                <span className="text-[11px] font-medium text-ink">{item.name}</span>
                <span className={"border px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider " + lane.className}>
                  {lane.label}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-ink-muted">{item.detail}</p>
            </li>
          );
        })}
      </ul>
      {licenseNote && (
        <p className="mt-2 border-t border-line-soft pt-2 text-[11px] leading-relaxed text-ink-dim">{licenseNote}</p>
      )}
    </div>
  );
}