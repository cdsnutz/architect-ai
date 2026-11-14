/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import Panel from "./Panel";

export default function EntropyPanel({ entropy }) {
  if (!entropy) return null;
  const clusters = entropy.clusters || [];

  return (
    <Panel title="Entropy asset recovery" meta={entropy.confirmed + "/" + entropy.probed + " confirmed"}>
      <ul className="space-y-2">
        {clusters.map((cluster) => (
          <li key={cluster.pattern} className="border border-line-soft bg-surface-sunken p-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-mono text-[11px] text-ink" title={cluster.pattern}>
                {cluster.pattern}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-ink-dim">
                {cluster.known.length} known · {cluster.predicted.length} predicted
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {(cluster.confirmed || []).map((url) => (
                <span key={url} className="border border-signal/40 px-1.5 py-0.5 font-mono text-[10px] text-signal" title={url}>
                  {url.split("/").pop()} hit
                </span>
              ))}
              {(cluster.gated || []).map((url) => (
                <span key={url} className="border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-muted" title={url}>
                  {url.split("/").pop()} gated
                </span>
              ))}
              {(cluster.rejected || []).map((url) => (
                <span key={url} className="px-1 font-mono text-[10px] text-ink-dim line-through" title={url}>
                  {url.split("/").pop()}
                </span>
              ))}
            </div>
          </li>
        ))}
        {!clusters.length && <li className="text-[11px] text-ink-dim">No indexed asset family had two or more members, so there was no gap to predict.</li>}
      </ul>
      <p className="mt-2 text-[10px] leading-relaxed text-ink-dim">{entropy.note}</p>
    </Panel>
  );
}