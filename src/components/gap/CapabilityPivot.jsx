/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

// The pivot this lab made: what the old machinery did, what replaced it, and
// what the replacement is actually worth to the operator.
const ROWS = [
  { was: "Proxy-driven clicks", now: "Search intent mapping", worth: "Identify what users actually want." },
  { was: "Randomised engagement", now: "Competitive gap analysis", worth: "Quantify the distance to #1." },
  { was: "Fingerprint spoofing", now: "Structural DNA extraction", worth: "Clone the strategy, not the pixels." },
  { was: "Engagement windows", now: "Conversion path audit", worth: "Optimise the actual user journey." }
];

export default function CapabilityPivot() {
  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="border-b border-line-soft p-2.5">
        <h2 className="font-display text-sm text-ink">What replaced the bot</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          Market intelligence, not click fraud. Every row here is measured from a surface this lab can read.
        </p>
      </div>
      <ul className="divide-y divide-line-soft">
        {ROWS.map((row) => (
          <li key={row.now} className="grid gap-1 p-2.5 sm:grid-cols-[1fr_1fr_1.2fr] sm:gap-3">
            <p className="font-mono text-[10px] leading-relaxed text-ink-dim line-through">{row.was}</p>
            <p className="text-[11px] text-ink">{row.now}</p>
            <p className="text-[11px] leading-relaxed text-ink-muted">{row.worth}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}