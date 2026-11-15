/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import IdeShell from "@/components/ide/IdeShell";
import GapForm from "@/components/gap/GapForm";
import GapStrike from "@/components/gap/GapStrike";
import GapSurfaces from "@/components/gap/GapSurfaces";
import GapIntents from "@/components/gap/GapIntents";
import GapVoids from "@/components/gap/GapVoids";
import GapBriefs from "@/components/gap/GapBriefs";
import CapabilityPivot from "@/components/gap/CapabilityPivot";

const PHASES = ["1 target analysis", "2 gap discovery", "3 sovereign execution"];

export default function Gap() {
  const [busy, setBusy] = useState(false);
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState("");

  const runAudit = async (payload) => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("analyzeGap", payload);
      setAudit(response.data);
    } catch (invokeError) {
      setError(invokeError?.response?.data?.error || invokeError?.message || "The gap audit could not run.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <IdeShell
      active="gap"
      crumb="Gap analyzer / map the distance"
      note="target → gap → execution"
      status={[
        { label: "phase", value: "target → gap → execution" },
        { label: "intents held", value: audit ? audit.coverage.intents_pct + "%" : "not run" },
        { label: "voids", value: audit ? String(audit.voids.length) : "—" }
      ]}
    >
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="border border-line-soft bg-surface-panel p-3">
          <h1 className="font-display text-sm text-ink">Competitive gap analyzer</h1>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
            Read the lead once, read the winners once, and price the distance between them in search intent,
            structured data and depth. No clicks, no ranking tricks: the machine measures the map the winner already built.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PHASES.map((phase) => (
              <span
                key={phase}
                className="border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim"
              >
                {phase}
              </span>
            ))}
          </div>
        </div>

        <div className="border border-line-soft bg-surface-panel">
          <div className="border-b border-line-soft p-2.5">
            <h2 className="font-display text-sm text-ink">Read the map</h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              One lead and up to three winners. Public surfaces only, one anonymous read each.
            </p>
          </div>
          <div className="p-3">
            <GapForm onRun={runAudit} busy={busy} />
          </div>
        </div>

        {error && <p className="border border-red-500/40 bg-red-500/10 p-2.5 text-[11px] text-red-300">{error}</p>}

        {busy && !audit && (
          <p className="border border-line-soft bg-surface-panel p-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
            reading sitemaps and navigation · classifying intent
          </p>
        )}

        {audit && (
          <>
            <GapStrike strike={audit.strike} coverage={audit.coverage} />
            <GapSurfaces lead={audit.lead} winners={audit.winners} unread={audit.unread} />
            <GapIntents intents={audit.intents} />
            <GapVoids voids={audit.voids} keywordVoids={audit.keyword_voids} schemaGaps={audit.schema_gaps} />
            <GapBriefs briefs={audit.briefs} />
            <p className="font-mono text-[10px] leading-relaxed text-ink-dim">{audit.limits}</p>
          </>
        )}

        <CapabilityPivot />
      </div>
    </IdeShell>
  );
}