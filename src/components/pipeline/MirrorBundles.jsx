/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function MirrorBundles({ bundles }) {
  if (!bundles) return null;
  const { manifest, bundles: read = [], mode, frameworks = [], storage_keys: keys = [] } = bundles;

  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft p-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">bundle graph · treated as binary</p>
        <span
          className={
            "border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider " +
            (mode === "pattern" ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-signal/40 bg-signal/10 text-signal")
          }
        >
          {mode === "pattern" ? "pattern matching" : "literal reading"}
        </span>
      </div>

      <div className="space-y-1.5 p-2.5">
        {manifest ? (
          <div className="space-y-0.5">
            <p className="font-mono text-[10px] text-ink">
              {manifest.kind} manifest · {manifest.chunks} chunk(s) · {manifest.entries} entry point(s)
            </p>
            <p className="font-mono text-[10px] text-ink-dim">
              {manifest.eager} eager import(s) · {manifest.dynamic} lazy import(s) · {manifest.css} stylesheet(s)
              {manifest.orphans?.length ? " · " + manifest.orphans.length + " unreferenced chunk(s)" : ""}
            </p>
            <p className="text-[10px] leading-relaxed text-ink-muted">{manifest.note}</p>
          </div>
        ) : (
          <p className="text-[11px] leading-relaxed text-ink-muted">{bundles.manifest_note}</p>
        )}

        {read.length === 0 && <p className="text-[11px] text-ink-dim">No bundle could be read, so the chunk graph stays unobserved.</p>}

        <ul className="space-y-0.5">
          {read.map((bundle) => (
            <li key={bundle.url} className="flex items-center justify-between gap-2 font-mono text-[10px]">
              <span className="truncate text-ink-muted">{bundle.url.split("/").pop()}</span>
              <span className="text-ink-dim">
                {Math.round(bundle.bytes / 1024)} kb · {bundle.mode} · obf {bundle.obfuscation?.score ?? 0} · {bundle.routes.length} hit(s)
              </span>
            </li>
          ))}
        </ul>

        {read.some((bundle) => bundle.obfuscation?.markers?.length) && (
          <p className="font-mono text-[10px] text-ink-dim">
            markers: {read.flatMap((bundle) => bundle.obfuscation?.markers || []).slice(0, 6).join(", ")}
          </p>
        )}

        {keys.length > 0 && <p className="font-mono text-[10px] text-ink-dim">storage keys named: {keys.slice(0, 8).join(", ")}</p>}
        {frameworks.length > 0 && <p className="font-mono text-[10px] text-ink-dim">frameworks: {frameworks.join(", ")}</p>}
      </div>
    </div>
  );
}