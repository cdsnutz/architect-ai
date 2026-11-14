/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const FALLBACK = "paundrapf/BUG-HUNTER-TOOLS";

export default function SourceCard({ catalog, busy, error, onSync }) {
  const source = catalog ? catalog.source_url : "https://github.com/" + FALLBACK;
  const synced = catalog && catalog.synced_at ? new Date(catalog.synced_at) : null;

  return (
    <section className="border border-line-soft bg-surface-panel">
      <header className="flex items-center justify-between gap-3 border-b border-line-soft px-3 py-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">source</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
          {catalog ? catalog.branch || "main" : "not read"}
        </span>
      </header>
      <div className="space-y-2 p-3">
        <a
          href={source}
          target="_blank"
          rel="noreferrer"
          className="block truncate font-mono text-[11px] text-signal hover:underline"
        >
          {source.replace(/^https?:\/\/github\.com\//, "")}
        </a>
        <p className="text-[11px] leading-relaxed text-ink-muted">
          A curated tool catalog. This module indexes it and tags each section with the lane it sits in here; no tool
          is installed or executed.
        </p>
        {synced && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
            read {synced.toLocaleString()}
          </p>
        )}
        <button
          type="button"
          onClick={onSync}
          disabled={busy}
          className="w-full border border-line bg-surface-raised px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink transition-colors hover:border-signal hover:text-signal disabled:opacity-50"
        >
          {busy ? "reading catalog…" : catalog ? "re-read catalog" : "read catalog"}
        </button>
        {error && <p className="text-[11px] leading-relaxed text-destructive">{error}</p>}
      </div>
    </section>
  );
}