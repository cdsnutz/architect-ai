/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

function Chip({ children }) {
  return (
    <span className="border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
      {children}
    </span>
  );
}

export default function TargetProfile({ symmetry, dna }) {
  const headers = [
    ["hsts", "HSTS", dna.security?.hsts],
    ["csp", "CSP", dna.security?.csp],
    ["nosniff", "nosniff", dna.security?.nosniff],
    ["referrer", "referrer", dna.security?.referrer],
    ["frame", "frame", dna.security?.frame]
  ];

  return (
    <section className="border border-line-soft bg-surface-panel">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line-soft p-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">mirror symmetry · map score</p>
          <p className="mt-0.5 font-display text-2xl text-ink">
            {symmetry.score}
            <span className="ml-1 text-xs text-ink-dim">/ 100 families</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">{dna.host}</p>
          <p className="mt-0.5 font-mono text-[10px] text-ink-muted">
            {symmetry.lead_paths} / {symmetry.union_paths} paths · {dna.ttfb_ms} ms TTFB
          </p>
        </div>
      </div>

      <div className="space-y-2 p-3">
        <p className="text-[11px] leading-relaxed text-ink-muted">{symmetry.basis}.</p>
        <div className="flex flex-wrap gap-1.5">
          {(dna.framework || []).map((marker) => <Chip key={marker}>{marker}</Chip>)}
          <Chip>{dna.protocol.replace(":", "")}</Chip>
          <Chip>{dna.families} families</Chip>
          <Chip>{(dna.schema_types || []).length} schema types</Chip>
          <Chip>{dna.bytes} bytes</Chip>
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-line-soft pt-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim">header baseline</span>
          {headers.map(([key, label, present]) => (
            <span
              key={key}
              className={
                "border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] " +
                (present ? "border-signal/40 bg-signal/10 text-signal" : "border-red-500/40 bg-red-500/10 text-red-300")
              }
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}