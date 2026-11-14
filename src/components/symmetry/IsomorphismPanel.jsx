/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import Panel from "./Panel";

export default function IsomorphismPanel({ isomorphism }) {
  if (!isomorphism) {
    return (
      <Panel title="Topological parity" meta="no candidate">
        <p className="text-[11px] text-ink-dim">
          Add your own deploy as the candidate surface to compare graph shape: node classes, trigger mix, path overlap and fan-out.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="Topological parity" meta={isomorphism.score + "%"}>
      <ul className="space-y-1.5">
        {(isomorphism.dimensions || []).map((dimension) => (
          <li key={dimension.name} className="border border-line-soft bg-surface-sunken p-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[11px] text-ink">{dimension.name}</span>
              <span className="shrink-0 font-mono text-[10px] text-ink-dim">
                {dimension.score}% · w{dimension.weight}
              </span>
            </div>
            <div className="mt-1 h-1 w-full bg-line-soft">
              <div className="h-1 bg-signal" style={{ width: dimension.score + "%" }} />
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-ink-dim">{dimension.note}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-ink">{isomorphism.verdict}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-ink-dim">{isomorphism.note}</p>
    </Panel>
  );
}