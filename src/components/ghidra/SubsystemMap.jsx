/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useMemo, useState } from "react";

export default function SubsystemMap({ groups = [], totals = {} }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const shown = useMemo(
    () => groups.filter((group) => !needle || group.key.toLowerCase().includes(needle)),
    [groups, needle]
  );
  const max = groups.reduce((largest, group) => Math.max(largest, group.files), 1);

  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="flex flex-col gap-2 border-b border-line-soft p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-sm text-ink">Subsystem map</h1>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
            {totals.groups || 0} modules · {totals.files || 0} files · {totals.java_files || 0} java
            {totals.truncated ? " · tree truncated" : ""}
          </p>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter modules…"
          aria-label="Filter Ghidra modules"
          className="h-7 w-full border border-line bg-surface-base px-2 font-mono text-[11px] text-ink outline-none placeholder:text-ink-dim focus:border-signal sm:w-56"
        />
      </div>

      <ul className="divide-y divide-line-soft">
        {shown.map((group) => (
          <li key={group.key} className="px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-mono text-[11px] text-ink">{group.key}</span>
              <span className="shrink-0 font-mono text-[10px] text-ink-dim">
                {group.files}f · {group.java}j
              </span>
            </div>
            <div className="mt-1 h-0.5 w-full bg-line-soft">
              <div className="h-0.5 bg-signal/60" style={{ width: Math.max(2, Math.round((group.files / max) * 100)) + "%" }} />
            </div>
          </li>
        ))}
      </ul>

      {!shown.length && (
        <p className="px-3 py-4 text-[11px] text-ink-muted">
          {groups.length ? "No module matches that filter." : "No modules read yet."}
        </p>
      )}

      {groups.length > shown.length || needle ? (
        <p className="border-t border-line-soft px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
          showing {shown.length} of {groups.length}
        </p>
      ) : null}
    </div>
  );
}