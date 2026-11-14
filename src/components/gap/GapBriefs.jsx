/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import CopyButton from "@/components/analysis/CopyButton";

function asText(briefs) {
  return briefs
    .map((brief, index) =>
      [
        index + 1 + ". " + brief.path,
        "intent: " + brief.intent + " · " + brief.why,
        "keyword: " + brief.keyword,
        "evidence: " + brief.evidence,
        "ship: " + brief.requirement
      ].join("\n")
    )
    .join("\n\n");
}

export default function GapBriefs({ briefs }) {
  if (!briefs?.length) return null;
  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft p-2.5">
        <div>
          <h2 className="font-display text-sm text-ink">Sovereign execution</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
            One brief per void, sized against the page that already wins it. These are the production triggers.
          </p>
        </div>
        <CopyButton getText={() => asText(briefs)} label="copy briefs" copiedLabel="copied" className="font-mono text-[10px] uppercase tracking-[0.14em]" />
      </div>
      <ol className="divide-y divide-line-soft">
        {briefs.map((brief) => (
          <li key={brief.path} className="p-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-[12px] text-signal">{brief.path}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
                {brief.intent} · {brief.target_words ? brief.target_words + "+ words" : "depth unmeasured"}
              </p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{brief.requirement}</p>
            <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-dim">{brief.evidence}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}