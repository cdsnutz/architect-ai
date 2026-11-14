/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const GRADES = [
  { key: "referenced", label: "Referenced", note: "declared and pointed at by the capture", tone: "text-signal" },
  { key: "dormant", label: "Dormant", note: "declared, never referenced by this pass", tone: "text-ink-muted" }
];

function fileOf(url) {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop() || url;
  } catch {
    return url;
  }
}

export default function ShadowPanel({ shadow }) {
  if (!shadow) return null;

  const referenced = shadow.endpoints.filter((entry) => entry.grade === "referenced");
  const dormant = shadow.endpoints.filter((entry) => entry.grade === "dormant");
  const counts = shadow.counts || {};

  return (
    <section className="border border-line-soft bg-surface-panel">
      <header className="border-b border-line-soft p-2.5">
        <h2 className="font-display text-sm text-ink">Bundle-declared endpoints</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          The API surface of {shadow.host}, read statically from the scripts it ships to every browser. Nothing here was
          called.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-px border-b border-line-soft bg-line-soft sm:grid-cols-4">
        {[
          { label: "declared", value: counts.total || 0 },
          { label: "referenced", value: counts.referenced || 0 },
          { label: "dormant", value: counts.dormant || 0 },
          { label: "other host", value: counts.internal || 0 }
        ].map((cell) => (
          <div key={cell.label} className="bg-surface-sunken px-2 py-1.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">{cell.label}</p>
            <p className="font-display text-sm text-ink">{cell.value}</p>
          </div>
        ))}
      </div>

      <div className="border-b border-line-soft px-2.5 py-1.5">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
          {counts.bundles || 0} bundle(s) · {Math.round((counts.chars || 0) / 1000)}k chars · {shadow.mode} mode
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-ink-dim">
          Referenced means the capture points at the same path family. Dormant means the code is programmed to handle it
          and this pass never saw it. Confirmed needs watched traffic, and this pass watches none, so it is never claimed.
        </p>
      </div>

      <div className="grid gap-2.5 p-2.5 lg:grid-cols-2">
        {GRADES.map((grade) => {
          const rows = grade.key === "referenced" ? referenced : dormant;
          return (
            <div key={grade.key} className="border border-line-soft">
              <p className="border-b border-line-soft bg-surface-sunken px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
                {grade.label} · {rows.length}
              </p>
              {rows.length ? (
                <ul className="divide-y divide-line-soft">
                  {rows.map((entry) => (
                    <li key={entry.path} className="flex items-baseline justify-between gap-2 px-2 py-1">
                      <span className={`truncate font-mono text-[10px] ${grade.tone}`}>{entry.path}</span>
                      <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.1em] text-ink-dim">
                        {entry.kind} · {fileOf(entry.bundle)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-2 py-1.5 font-mono text-[10px] text-ink-dim">none in this grade</p>
              )}
            </div>
          );
        })}
      </div>

      {shadow.leaks.length > 0 && (
        <div className="border-t border-line-soft">
          <p className="border-b border-line-soft bg-surface-sunken px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
            other hosts declared · {shadow.leaks.length}
          </p>
          <ul className="divide-y divide-line-soft">
            {shadow.leaks.map((leak) => (
              <li key={leak.url} className="flex items-baseline justify-between gap-2 px-2 py-1">
                <span className="truncate font-mono text-[10px] text-ink">{leak.url}</span>
                <span
                  className={`shrink-0 font-mono text-[8px] uppercase tracking-[0.1em] ${
                    leak.severity === "environment" ? "text-destructive" : "text-ink-dim"
                  }`}
                >
                  {leak.severity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {shadow.versions.length > 0 && (
        <div className="border-t border-line-soft">
          <p className="border-b border-line-soft bg-surface-sunken px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
            version drift · {shadow.versions.length}
          </p>
          <ul className="divide-y divide-line-soft">
            {shadow.versions.map((entry) => (
              <li key={entry.root} className="px-2 py-1.5">
                <p className="font-mono text-[10px] text-ink">
                  {entry.root} — {entry.versions.join(" / ")}
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-ink-muted">{entry.note}</p>
                <p className="mt-0.5 truncate font-mono text-[9px] text-ink-dim">{entry.examples.join("  ·  ")}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="border-t border-line-soft p-2.5">
        {shadow.frameworks.length > 0 && (
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
            stack: {shadow.frameworks.join(" · ")}
          </p>
        )}
        <p className="text-[11px] leading-relaxed text-ink">{shadow.note}</p>
        <p className="mt-1 font-mono text-[9px] leading-relaxed text-ink-dim">{shadow.limits}</p>
      </footer>
    </section>
  );
}