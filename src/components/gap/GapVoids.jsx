/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const TONE = {
  absent: "border-red-500/40 bg-red-500/10 text-red-300",
  thin: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
};

export default function GapVoids({ voids, keywordVoids, schemaGaps }) {
  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="border-b border-line-soft p-2.5">
        <h2 className="font-display text-sm text-ink">Information voids</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          Intent families the winners serve and you do not, each with the paths they use. Classified per path, counted from the surfaces read, never estimated.
        </p>
      </div>

      {voids?.length > 0 ? (
        <ul className="divide-y divide-line-soft">
          {voids.map((gap) => (
            <li key={gap.intent} className="p-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink">{gap.intent}</p>
                <span className={"border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] " + TONE[gap.kind]}>
                  {gap.kind}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{gap.note}</p>
              {gap.why && <p className="mt-0.5 text-[10px] leading-relaxed text-ink-dim">{gap.why}</p>}
              {gap.examples?.length > 0 && (
                <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-dim">{gap.examples.join("  ·  ")}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-2.5 text-[11px] leading-relaxed text-ink-muted">
          No intent gap: your surface already publishes something in every intent family the winners serve.
        </p>
      )}

      {keywordVoids?.length > 0 && (
        <div className="border-t border-line-soft p-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">keywords two or more winners share, you lack</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {keywordVoids.map((entry) => (
              <span key={entry.keyword} className="border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                {entry.keyword} <span className="text-ink-dim">· {entry.held_by.length}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {schemaGaps?.length > 0 && (
        <div className="border-t border-line-soft p-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">structured data the winners ship and you do not</p>
          <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-muted">{schemaGaps.join("  ·  ")}</p>
        </div>
      )}
    </div>
  );
}