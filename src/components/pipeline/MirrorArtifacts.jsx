/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

function Row({ artifact }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(artifact.content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <li className="p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-left font-mono text-[11px] text-ink hover:text-signal"
        >
          {artifact.path}
        </button>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-muted hover:border-signal/50 hover:text-signal"
        >
          {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />} copy
        </button>
      </div>
      <p className="mt-0.5 text-[10px] text-ink-dim">{artifact.note}</p>
      {open && (
        <pre className="mt-1.5 max-h-56 overflow-auto border border-line-soft bg-surface-sunken p-2 font-mono text-[10px] leading-relaxed text-ink-muted">
          {artifact.content}
        </pre>
      )}
    </li>
  );
}

export default function MirrorArtifacts({ artifacts }) {
  return (
    <ul className="divide-y divide-line-soft border border-line-soft bg-surface-panel">
      {artifacts.map((artifact) => (
        <Row key={artifact.path} artifact={artifact} />
      ))}
    </ul>
  );
}