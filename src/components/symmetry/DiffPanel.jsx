/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import Panel from "./Panel";

const VERDICT_CLASS = {
  match: "text-signal",
  drift: "text-yellow-500",
  missing: "text-destructive",
  unreachable: "text-ink-dim"
};

export default function DiffPanel({ diff }) {
  if (!diff) {
    return (
      <Panel title="Candidate parity">
        <p className="text-[11px] text-ink-dim">
          No candidate surface was supplied, so there is nothing to diff. Compare your own rebuild against the baseline to score parity.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="Candidate parity" meta={diff.verdict}>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 font-mono text-[10px] uppercase tracking-wider">
        <span className="text-ink-muted">
          {diff.matched}/{diff.total} signals match
        </span>
        <span className="truncate text-ink-dim" title={diff.candidate_url}>
          {diff.candidate_url}
        </span>
      </div>

      <table className="w-full border-collapse font-mono text-[10px]">
        <tbody>
          {(diff.rows || []).map((row) => (
            <tr key={row.key} className="border-b border-line-soft last:border-0">
              <td className="py-1 pr-2 text-ink-dim">{row.key}</td>
              <td className="max-w-[9rem] truncate py-1 pr-2 text-ink-muted" title={row.baseline}>{row.baseline}</td>
              <td className="max-w-[9rem] truncate py-1 pr-2 text-ink-muted" title={row.candidate}>{row.candidate}</td>
              <td className={"py-1 text-right uppercase " + (VERDICT_CLASS[row.verdict] || "text-ink-dim")}>{row.verdict}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(diff.routes || []).length > 0 && (
        <div className="mt-3 border-t border-line-soft pt-2">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-dim">Route reachability</p>
          <ul className="space-y-0.5">
            {diff.routes.map((route) => (
              <li key={route.path} className="flex items-baseline justify-between gap-2 font-mono text-[10px]">
                <span className="truncate text-ink-muted" title={route.path}>{route.path}</span>
                <span className="shrink-0 text-ink-dim">
                  {route.baseline} → {route.candidate}{" "}
                  <span className={VERDICT_CLASS[route.verdict] || "text-ink-dim"}>{route.verdict}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-2 text-[10px] leading-relaxed text-ink-dim">{diff.note}</p>
    </Panel>
  );
}