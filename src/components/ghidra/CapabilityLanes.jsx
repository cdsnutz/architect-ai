/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const LANE = {
  in_contract: { label: "in contract", className: "border-signal/40 bg-signal/10 text-signal" },
  authorized: { label: "authorized only", className: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  off_contract: { label: "off contract", className: "border-red-500/40 bg-red-500/10 text-red-300" }
};

const CAPABILITIES = [
  {
    name: "Decompiler",
    detail: "Turns machine code into C-like output. This is the layer a dossier cites when it claims what a binary does.",
    lane: "in_contract"
  },
  {
    name: "Headless analyzer",
    detail: "Batch import, auto-analysis and scripting with no UI, so a pass can produce project artifacts it can point at.",
    lane: "in_contract"
  },
  {
    name: "Processor modules",
    detail: "Per-architecture language definitions under Ghidra/Processors: x86, ARM, MIPS, PowerPC and others.",
    lane: "in_contract"
  },
  {
    name: "Scripting",
    detail: "Your own Java or Jython scripts against the Ghidra API, when a question needs a measurement no UI gives.",
    lane: "in_contract"
  },
  {
    name: "Version tracking",
    detail: "Diffs two builds of the same artifact, which is how a claim that a patch landed gets corroborated.",
    lane: "in_contract"
  },
  {
    name: "Debugger",
    detail: "Attaches to a running process. Needs a live target, so it stays outside a read-only pass and needs authorization.",
    lane: "authorized"
  },
  {
    name: "Binary patching",
    detail: "Writes into a process or rewrites an artifact. Documented for awareness; the lab never does this.",
    lane: "off_contract"
  }
];

export default function CapabilityLanes() {
  return (
    <div className="border border-line-soft bg-surface-panel p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">what this toolkit can do here</p>
      <ul className="mt-2 divide-y divide-line-soft">
        {CAPABILITIES.map((item) => {
          const lane = LANE[item.lane];
          return (
            <li key={item.name} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:gap-3">
              <div className="flex items-center gap-2 sm:w-44 sm:shrink-0">
                <span className="text-[11px] font-medium text-ink">{item.name}</span>
                <span className={"border px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider " + lane.className}>
                  {lane.label}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-ink-muted">{item.detail}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}