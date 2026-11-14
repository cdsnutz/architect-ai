/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import IdeShell from "@/components/ide/IdeShell";
import WarRoomForm from "@/components/warroom/WarRoomForm";
import TargetProfile from "@/components/warroom/TargetProfile";
import VulnerabilityBoard from "@/components/warroom/VulnerabilityBoard";
import CompetitorRadar from "@/components/warroom/CompetitorRadar";
import LeapfrogCluster from "@/components/warroom/LeapfrogCluster";
import OutmaneuverPanel from "@/components/warroom/OutmaneuverPanel";

const AGENTS = ["Infiltrator · exposure", "Oracle · dominance cluster", "General · roadmap"];

export default function WarRoom() {
  const [busy, setBusy] = useState(false);
  const [blueprint, setBlueprint] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState("");

  const runPass = async (payload) => {
    setBusy(true);
    setError("");
    setRoadmap(null);
    try {
      const response = await base44.functions.invoke("warRoom", { action: "run", ...payload });
      setBlueprint(response.data);
    } catch (invokeError) {
      setError(invokeError?.response?.data?.error || invokeError?.message || "The war room could not run.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <IdeShell
      active="war-room"
      crumb="war room / command center"
      note="exposure → cluster → plan"
      status={[
        { label: "exposure", value: blueprint ? String(blueprint.vulnerabilities.counts.total) : "—" },
        { label: "cluster gap", value: blueprint ? blueprint.leapfrog.coverage.gap_pct + "%" : "—" },
        { label: "plan", value: roadmap ? roadmap.horizon : "not sequenced" }
      ]}
    >
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="border border-line-soft bg-surface-panel p-3">
          <h1 className="font-display text-sm text-ink">War room</h1>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
            One lead, up to three winners, read anonymously once. The Infiltrator reports exposure a response proves,
            the Oracle measures the dominance cluster, and the General sequences the plan to take it.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {AGENTS.map((agent) => (
              <span
                key={agent}
                className="border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim"
              >
                {agent}
              </span>
            ))}
          </div>
        </div>

        <div className="border border-line-soft bg-surface-panel">
          <div className="border-b border-line-soft p-2.5">
            <h2 className="font-display text-sm text-ink">Read the field</h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              Public surfaces only. The target must be one you are authorized to read.
            </p>
          </div>
          <div className="p-3">
            <WarRoomForm onRun={runPass} busy={busy} />
          </div>
        </div>

        {error && <p className="border border-red-500/40 bg-red-500/10 p-2.5 text-[11px] text-red-300">{error}</p>}

        {busy && !blueprint && (
          <p className="border border-line-soft bg-surface-panel p-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
            reading headers and bundles · mapping the cluster
          </p>
        )}

        {blueprint && (
          <>
            <TargetProfile symmetry={blueprint.symmetry} dna={blueprint.dna} />
            <VulnerabilityBoard vulnerabilities={blueprint.vulnerabilities} scanned={blueprint.vulnerabilities.scanned} />
            <CompetitorRadar radar={blueprint.radar} competitors={blueprint.competitors} />
            <LeapfrogCluster leapfrog={blueprint.leapfrog} />
            <OutmaneuverPanel runId={blueprint.run_id} roadmap={roadmap} onRoadmap={setRoadmap} />

            {blueprint.refusals?.length > 0 && (
              <div className="border border-line-soft bg-surface-panel">
                <p className="border-b border-line-soft p-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
                  out of contract
                </p>
                <ul className="divide-y divide-line-soft">
                  {blueprint.refusals.map((refusal) => (
                    <li key={refusal.key} className="p-2.5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-300">
                        {refusal.key} · {refusal.agent}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{refusal.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="font-mono text-[10px] leading-relaxed text-ink-dim">{blueprint.limits}</p>
          </>
        )}
      </div>
    </IdeShell>
  );
}