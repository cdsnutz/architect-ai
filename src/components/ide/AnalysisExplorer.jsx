/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { FileJson, Loader2 } from "lucide-react";

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url || "";
  }
}

export default function AnalysisExplorer({ history, loading, currentId, onOpen }) {
  return (
    <aside className="sticky top-12 hidden h-[calc(100vh-3rem)] w-56 shrink-0 flex-col border-r border-line-soft bg-[hsl(var(--surface-sunken)/0.85)] backdrop-blur md:flex">
      <div className="flex items-center justify-between border-b border-line-soft px-3 py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">Analyses</p>
        <span className="font-mono text-[10px] text-ink-dim">{history.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-signal" />
          </div>
        ) : history.length === 0 ? (
          <p className="px-3 py-6 text-[11px] leading-relaxed text-ink-dim">
            No analyses yet. Map a host to write the first record.
          </p>
        ) : (
          history.map((item) => {
            const isActive = item.id === currentId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpen(item)}
                className={`relative flex w-full items-start gap-2 px-3 py-1.5 text-left transition-colors ${
                  isActive
                    ? "bg-surface-raised text-ink"
                    : "text-ink-muted hover:bg-surface-panel hover:text-ink"
                }`}
              >
                {isActive && <span className="absolute left-0 top-0 h-full w-0.5 bg-signal" />}
                <FileJson
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isActive ? "text-signal" : "text-ink-dim"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] leading-[1.35]">{item.title}</span>
                  <span className="block truncate font-mono text-[10px] leading-[1.5] text-ink-dim">
                    {hostOf(item.url)}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}