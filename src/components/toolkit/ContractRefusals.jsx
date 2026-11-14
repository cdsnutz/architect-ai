/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Ban } from "lucide-react";
import { CONTRACT_REFUSALS } from "@/lib/reverseSkill";

export default function ContractRefusals({ refusals = CONTRACT_REFUSALS }) {
  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft p-3">
        <div>
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">
            <Ban className="h-3 w-3 text-red-400" /> named and refused
          </p>
          <h2 className="mt-1 font-display text-sm text-ink">Command families the contract answers no to</h2>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">{refusals.length} off contract</p>
      </div>

      <ul className="divide-y divide-line-soft">
        {refusals.map((entry) => (
          <li key={entry.key} className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-start sm:gap-3">
            <div className="min-w-0 sm:w-56 sm:shrink-0">
              <p className="text-[11px] text-ink">{entry.label}</p>
              <span className="mt-0.5 inline-block border border-red-500/40 bg-red-500/10 px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-300">
                refused
              </span>
            </div>
            <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-ink-muted">{entry.detail}</p>
          </li>
        ))}
      </ul>

      <p className="border-t border-line-soft px-3 py-2 text-[11px] leading-relaxed text-ink-dim">
        Enumerating these families is the point: a boundary that is written down can be enforced and cited, while one
        that is assumed gets crossed. No entry here is executable from this app, and authorization never changes that.
      </p>
    </div>
  );
}