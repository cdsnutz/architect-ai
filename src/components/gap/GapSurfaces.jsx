/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const CELL = "px-2 py-1.5 text-left align-top whitespace-nowrap";

function Row({ surface, isLead }) {
  return (
    <tr className={isLead ? "bg-signal/[0.05]" : ""}>
      <td className={CELL}>
        <p className={isLead ? "text-[12px] text-signal" : "text-[12px] text-ink"}>{surface.host}</p>
        <p className="font-mono text-[10px] text-ink-dim">
          {isLead ? "lead" : "winner"} · {surface.framework.join(" + ")}
        </p>
      </td>
      <td className={CELL + " font-mono text-[11px] text-ink"}>{surface.paths}</td>
      <td className={CELL + " font-mono text-[11px] text-ink"}>{surface.families}</td>
      <td className={CELL + " font-mono text-[11px] text-ink-muted"}>{surface.schema_types.length}</td>
      <td className={CELL + " font-mono text-[11px] text-ink-muted"}>{surface.words.toLocaleString()}</td>
      <td className={CELL + " font-mono text-[11px] text-ink-muted"}>{surface.link_density}</td>
      <td className={CELL + " font-mono text-[11px] text-ink-muted"}>{surface.ttfb_ms}ms</td>
    </tr>
  );
}

export default function GapSurfaces({ lead, winners, unread }) {
  if (!lead) return null;
  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="border-b border-line-soft p-2.5">
        <h2 className="font-display text-sm text-ink">Technical DNA</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          What each surface actually serves: published paths, structured data types, homepage depth, links per 1,000 words, first byte.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line-soft">
              {["surface", "paths", "families", "schema", "words", "links/1k", "ttfb"].map((head) => (
                <th key={head} className={CELL + " font-mono text-[9px] font-normal uppercase tracking-[0.16em] text-ink-dim"}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            <Row surface={lead} isLead />
            {(winners || []).map((winner) => (
              <Row key={winner.url} surface={winner} isLead={false} />
            ))}
          </tbody>
        </table>
      </div>
      {unread?.length > 0 && (
        <div className="border-t border-line-soft p-2.5">
          {unread.map((entry) => (
            <p key={entry.url} className="font-mono text-[10px] leading-relaxed text-red-300">
              not read · {entry.url} · {entry.reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}