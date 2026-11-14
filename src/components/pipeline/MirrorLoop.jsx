/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const STATE_STYLE = {
  live: "border-signal/40 bg-signal/10 text-signal",
  probing: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  cloned: "border-line bg-surface-sunken text-ink-dim"
};

export default function MirrorLoop({ loop }) {
  if (!loop) return null;

  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft p-2.5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">shannon feedback loop</p>
          <p className="mt-0.5 font-mono text-[10px] text-ink-muted">
            {loop.probed} probed / {loop.budget} budget · {loop.confirmed.length} confirmed
          </p>
        </div>
        <span className={"border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider " + (STATE_STYLE[loop.verdict] || STATE_STYLE.cloned)}>
          {loop.verdict}
        </span>
      </div>

      {loop.rounds?.length > 0 && (
        <ul className="divide-y divide-line-soft">
          {loop.rounds.map((round) => (
            <li key={round.round} className="flex items-center justify-between gap-2 px-2.5 py-1 font-mono text-[10px]">
              <span className="text-ink-muted">round {round.round}</span>
              <span className="text-ink-dim">
                {round.probed} probed · {round.confirmed} confirmed · {round.missing} absent
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="border-t border-line-soft p-2.5 text-[11px] leading-relaxed text-ink-muted">{loop.note}</p>
    </div>
  );
}