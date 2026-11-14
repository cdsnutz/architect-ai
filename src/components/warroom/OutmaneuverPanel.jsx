/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Crosshair, Loader2 } from "lucide-react";

export default function OutmaneuverPanel({ runId, roadmap, onRoadmap }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("warRoom", { action: "outmaneuver", run_id: runId });
      onRoadmap(response.data.roadmap);
    } catch (invokeError) {
      setError(invokeError?.response?.data?.error || invokeError?.message || "The plan could not be sequenced.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border border-signal/40 bg-surface-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft p-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">the general · outmaneuver</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
            Three weeks, sequenced from the observations above: exposure first, then the cluster, then the edge.
          </p>
        </div>
        {!roadmap && (
          <button
            type="button"
            onClick={generate}
            disabled={busy || !runId}
            className="inline-flex items-center gap-1.5 border border-signal/60 bg-signal/15 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-signal transition-colors hover:bg-signal/25 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crosshair className="h-3 w-3" />}
            {busy ? "sequencing" : "generate the plan"}
          </button>
        )}
      </div>

      {error && <p className="p-3 text-[11px] text-red-300">{error}</p>}

      {roadmap && (
        <div className="divide-y divide-line-soft">
          {roadmap.weeks.map((week) => (
            <div key={week.key} className="p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink">{week.label}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">{week.agent}</p>
              </div>
              {week.steps.length === 0 ? (
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{week.note}</p>
              ) : (
                <ol className="mt-1.5 space-y-2">
                  {week.steps.map((step) => (
                    <li key={week.key + "-" + step.order} className="border-l border-line pl-2">
                      <p className="text-[12px] text-ink">{step.order}. {step.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{step.action}</p>
                      {step.evidence && (
                        <p className="mt-0.5 break-words font-mono text-[10px] leading-relaxed text-ink-dim">
                          evidence · {step.evidence}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
          <div className="p-3">
            <p className="text-[11px] leading-relaxed text-signal/90">{roadmap.verdict}</p>
            <p className="mt-1 font-mono text-[9px] leading-relaxed text-ink-dim">{roadmap.limits}</p>
          </div>
        </div>
      )}
    </section>
  );
}