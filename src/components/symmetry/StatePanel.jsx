/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import Panel from "./Panel";

function Group({ title, keys }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-dim">{title}</p>
      <div className="flex flex-wrap gap-1">
        {keys.length ? (
          keys.map((key) => (
            <span key={key} className="border border-line-soft bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
              {key}
            </span>
          ))
        ) : (
          <span className="font-mono text-[10px] text-ink-dim">none visible</span>
        )}
      </div>
    </div>
  );
}

export default function StatePanel({ state }) {
  if (!state) return null;
  return (
    <Panel title="State inventory" meta={state.total + " keys"}>
      <div className="space-y-2">
        <Group title="Cookie names" keys={state.cookie_names || []} />
        <Group title="localStorage keys" keys={state.local_keys || []} />
        <Group title="sessionStorage keys" keys={state.session_keys || []} />
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-ink-dim">{state.note}</p>
    </Panel>
  );
}