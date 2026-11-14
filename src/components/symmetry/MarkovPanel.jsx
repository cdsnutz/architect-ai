/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import Panel from "./Panel";

function short(id) {
  const raw = String(id || "");
  const tail = raw.includes(":") ? raw.slice(raw.indexOf(":") + 1) : raw;
  const name = tail.split("/").filter(Boolean).pop() || raw;
  return name.length > 34 ? name.slice(0, 33) + "…" : name;
}

export default function MarkovPanel({ markov }) {
  if (!markov) return null;
  const plan = markov.plan || [];

  return (
    <Panel title="Transition model / prefetch" meta={markov.states + " states"}>
      {plan.length ? (
        <ul className="space-y-1.5">
          {plan.map((row) => (
            <li key={row.from + row.to} className="border border-line-soft bg-surface-sunken p-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-mono text-[11px] text-ink" title={row.to}>
                  {short(row.to)}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-signal">{row.prob}%</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="truncate font-mono text-[9px] text-ink-dim" title={row.from}>
                  after {short(row.from)}
                </span>
                <span className="shrink-0 border border-line px-1 font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                  {row.kind}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-ink-dim">No ordered sequence was recoverable, so there is no prefetch candidate.</p>
      )}
      <p className="mt-2 text-[10px] leading-relaxed text-ink-dim">{markov.note}</p>
    </Panel>
  );
}