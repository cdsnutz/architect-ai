/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { ExternalLink, RefreshCw, Scale, Star } from "lucide-react";

function Meta({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-t border-line-soft py-1.5 text-[11px]">
      <span className="font-mono uppercase tracking-[0.14em] text-ink-dim">{label}</span>
      <span className="truncate text-right text-ink">{value || "—"}</span>
    </div>
  );
}

export default function ToolkitSource({ toolkit, index, busy, error, onSync }) {
  const repo = (index && index.repo) || {};
  const release = (index && index.release) || null;
  const repoUrl = repo.url || "https://github.com/" + toolkit.owner + "/" + toolkit.repo;

  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="flex items-start justify-between gap-2 border-b border-line-soft p-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">source · public repo</p>
          <h2 className="mt-1 truncate font-display text-sm text-ink">{repo.repo || toolkit.repo}</h2>
          <p className="truncate font-mono text-[10px] text-ink-muted">{repo.owner || toolkit.owner}</p>
        </div>
        <button
          type="button"
          onClick={onSync}
          disabled={busy}
          aria-label={"Re-read the " + toolkit.name + " repository"}
          className="shrink-0 border border-line p-1.5 text-ink-muted transition-colors hover:text-signal disabled:opacity-40"
        >
          <RefreshCw className={"h-3.5 w-3.5" + (busy ? " animate-spin" : "")} />
        </button>
      </div>

      <div className="p-3">
        <p className="text-[11px] leading-relaxed text-ink-muted">{repo.description || toolkit.role}</p>

        {error && (
          <p className="mt-2 border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-300">{error}</p>
        )}

        <div className="mt-2">
          <Meta label="branch" value={repo.branch} />
          <Meta label="language" value={repo.language} />
          <Meta label="license" value={repo.license} />
          <Meta label="release" value={release ? release.name || release.tag : "none read"} />
          <Meta label="stars" value={repo.stars ? repo.stars.toLocaleString() : "—"} />
          <Meta label="plugs in at" value={toolkit.plugsIn} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-ink-muted no-underline hover:text-signal"
          >
            <ExternalLink className="h-3 w-3" /> repository
          </a>
          {release && release.url && (
            <a
              href={release.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-ink-muted no-underline hover:text-signal"
            >
              <Star className="h-3 w-3" /> release notes
            </a>
          )}
          <span className="inline-flex items-center gap-1 text-ink-dim">
            <Scale className="h-3 w-3" /> {repo.license || "licence unread"}
          </span>
        </div>
      </div>
    </div>
  );
}