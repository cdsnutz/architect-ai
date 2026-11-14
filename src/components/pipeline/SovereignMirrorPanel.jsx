/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import MirrorLaunch from "@/components/pipeline/MirrorLaunch";
import MirrorStages from "@/components/pipeline/MirrorStages";
import MirrorGate from "@/components/pipeline/MirrorGate";
import MirrorParity from "@/components/pipeline/MirrorParity";
import MirrorBundles from "@/components/pipeline/MirrorBundles";
import MirrorLoop from "@/components/pipeline/MirrorLoop";
import MirrorTuning from "@/components/pipeline/MirrorTuning";
import MirrorArtifacts from "@/components/pipeline/MirrorArtifacts";

export default function SovereignMirrorPanel() {
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState("");

  const runPass = async (payload) => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("runSovereignMirror", payload);
      setRun(response.data);
    } catch (invokeError) {
      setError(invokeError?.response?.data?.error || invokeError?.message || "The pipeline could not run.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="border border-line-soft bg-surface-panel">
        <div className="border-b border-line-soft p-3">
          <h2 className="font-display text-sm text-ink">Sovereign mirror pipeline</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
            One target in: discovery, reversal, capture, virtualization, then a live loop that confirms its own predictions, a measured symmetry gate, and a final latency tune.
          </p>
        </div>
        <div className="p-3">
          <MirrorLaunch onRun={runPass} busy={busy} />
        </div>
      </div>

      {error && <p className="border border-red-500/40 bg-red-500/10 p-2.5 text-[11px] text-red-300">{error}</p>}

      {busy && !run && (
        <p className="border border-line-soft bg-surface-panel p-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
          reading the surface · pods running
        </p>
      )}

      {run && (
        <>
          <MirrorStages stages={run.stages || []} />
          <MirrorGate gate={run.gate} refusals={run.refusals} />
          <MirrorParity
            candidateUrl={run.candidate_url}
            diff={run.discovery?.diff}
            isomorphism={run.discovery?.isomorphism}
          />
          <MirrorBundles bundles={run.bundles} />
          <MirrorLoop loop={run.loop} />
          <MirrorTuning tuning={run.tuning} />

          {run.reversal && (
            <div className="border border-line-soft bg-surface-panel">
              <p className="border-b border-line-soft p-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
                reversal read
              </p>
              <div className="space-y-1 p-2.5">
                <p className="text-[11px] leading-relaxed text-ink-muted">{run.reversal.note}</p>
                {run.reversal.routes?.length > 0 && (
                  <p className="font-mono text-[10px] text-ink-muted">
                    routes: {run.reversal.routes.slice(0, 10).join(", ")}
                  </p>
                )}
                {run.reversal.transitions?.note && (
                  <p className="text-[11px] leading-relaxed text-ink-dim">{run.reversal.transitions.note}</p>
                )}
              </div>
            </div>
          )}

          {run.artifacts?.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">handoff artifacts</p>
              <MirrorArtifacts artifacts={run.artifacts} />
            </div>
          )}
        </>
      )}
    </div>
  );
}