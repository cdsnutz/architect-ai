/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useCallback, useEffect, useState } from "react";
import { Globe, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TONE = {
  live: "border-signal/40 bg-signal/10 text-signal",
  ready: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  down: "border-red-500/40 bg-red-500/10 text-red-300",
  idle: "border-line bg-surface-raised text-ink-dim"
};

function toneFor(status) {
  if (!status) return TONE.idle;
  if (status.reachable) return TONE.live;
  if (status.configured) return TONE.down;
  return TONE.ready;
}

export default function EnginePanel() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(true);

  const check = useCallback(async () => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke("browserEngineStatus", {});
      setStatus(response.data || null);
    } catch (error) {
      setStatus({
        label: "CloakBrowser",
        configured: true,
        reachable: false,
        detail: "The check itself failed to run. Try again in a moment."
      });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const state = !status ? "checking" : status.reachable ? "reachable" : status.configured ? "unreachable" : "not provisioned";

  return (
    <div className="border border-line-soft bg-surface-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft p-3">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-signal" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">engine of record</p>
            <h2 className="mt-0.5 font-display text-sm text-ink">{(status && status.label) || "CloakBrowser"}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={"border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider " + toneFor(status)}>
            {state}
          </span>
          <button
            type="button"
            onClick={check}
            disabled={busy}
            className="flex items-center gap-1 border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-muted transition-colors hover:border-signal/50 hover:text-signal disabled:opacity-50"
          >
            <RefreshCw className={"h-2.5 w-2.5 " + (busy ? "animate-spin" : "")} /> check
          </button>
        </div>
      </div>
      <div className="space-y-1.5 p-3">
        <p className="text-[11px] leading-relaxed text-ink-muted">
          {busy && !status ? "Asking the endpoint for its browser version…" : (status && status.detail) || ""}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
          {(status && status.mode) || "self-hosted · cloakserve (CDP 9222)"}
          {status && status.host ? " · " + status.host : ""}
        </p>
      </div>
    </div>
  );
}