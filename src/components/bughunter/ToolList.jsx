/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const BADGE = {
  in_contract: "border-signal/40 bg-signal/10 text-signal",
  gated: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  excluded: "border-destructive/40 bg-destructive/10 text-destructive"
};

const LABEL = {
  in_contract: "read-only",
  gated: "authorized",
  excluded: "off-contract"
};

function Row({ tool }) {
  return (
    <li className="border-b border-line-soft px-3 py-2 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        {tool.url ? (
          <a
            href={tool.url}
            target="_blank"
            rel="noreferrer"
            className="truncate font-mono text-[12px] text-ink hover:text-signal hover:underline"
          >
            {tool.name}
          </a>
        ) : (
          <span className="truncate font-mono text-[12px] text-ink">{tool.name}</span>
        )}
        <span
          className={`shrink-0 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
            BADGE[tool.lane] || "border-line text-ink-dim"
          }`}
        >
          {LABEL[tool.lane] || "unclassified"}
        </span>
      </div>
      {tool.description && (
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{tool.description}</p>
      )}
      <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-ink-dim">
        {tool.section}
        {tool.status ? " · " + tool.status : ""}
      </p>
    </li>
  );
}

export default function ToolList({ tools, query, onQuery, lane, onLaneReset }) {
  return (
    <section className="border border-line-soft bg-surface-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-3 py-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">tools</h2>
        <div className="flex items-center gap-2">
          {lane !== "all" && (
            <button
              type="button"
              onClick={onLaneReset}
              className="border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-muted hover:border-signal hover:text-signal"
            >
              lane: {lane} ×
            </button>
          )}
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="filter tools…"
            aria-label="Filter tools"
            className="h-7 w-44 border border-line bg-surface-sunken px-2 font-mono text-[11px] text-ink placeholder:text-ink-dim focus:border-signal focus:outline-none"
          />
        </div>
      </header>
      {tools.length ? (
        <ul className="max-h-[calc(100vh-16rem)] overflow-y-auto">
          {tools.map((tool) => (
            <Row key={tool.section + ":" + tool.name} tool={tool} />
          ))}
        </ul>
      ) : (
        <p className="p-4 text-[11px] text-ink-dim">No tool matches that filter.</p>
      )}
    </section>
  );
}