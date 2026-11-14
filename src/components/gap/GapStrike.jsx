/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import CopyButton from "@/components/analysis/CopyButton";

export default function GapStrike({ strike, coverage }) {
  if (!strike) return null;
  const text = [strike.pitch, "", ...(strike.evidence || []), "", strike.caveat].join("\n");

  return (
    <div className="border border-signal/40 bg-signal/[0.06]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-signal/30 p-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">the strike</p>
        <CopyButton getText={() => text} label="copy pitch" copiedLabel="copied" className="font-mono text-[10px] uppercase tracking-[0.14em]" />
      </div>
      <div className="space-y-2.5 p-3">
        <p className="text-[13px] leading-relaxed text-ink">{strike.pitch}</p>
        <div className="grid gap-1 sm:grid-cols-2">
          {(strike.evidence || []).map((line) => (
            <p key={line} className="font-mono text-[10px] leading-relaxed text-ink-muted">{line}</p>
          ))}
        </div>
        {coverage && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
            paths held {coverage.paths_pct}% · families held {coverage.families_pct}% · winner union {coverage.union_paths} paths
          </p>
        )}
        <p className="text-[10px] leading-relaxed text-ink-dim">{strike.caveat}</p>
      </div>
    </div>
  );
}