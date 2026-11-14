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
import DriftPanel from "@/components/intel/DriftPanel";
import GhostPanel from "@/components/intel/GhostPanel";
import EntropyPanel from "@/components/intel/EntropyPanel";
import PredictorPanel from "@/components/intel/PredictorPanel";

const MODULES = ["temporal drift", "ghost-page diff", "semantic entropy", "synthetic paths"];

export default function Intel() {
  const [busy, setBusy] = useState(false);
  const [intel, setIntel] = useState(null);
  const [error, setError] = useState("");

  const runPass = async (payload) => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("sovereignIntel", payload);
      setIntel(response.data);
    } catch (invokeError) {
      setError(invokeError?.response?.data?.error || invokeError?.message || "The intelligence pass could not run.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <IdeShell
      active="intel"
      crumb="intelligence / trajectory"
      note="drift → history → claims → inference"
      status={[
        { label: "drift", value: intel ? intel.drift.rows.filter((row) => row.state === "tracked").length + " tracked" : "—" },
        { label: "deleted paths", value: intel ? String(intel.ghost.rows.reduce((sum, row) => sum + (row.deleted || 0), 0)) : "—" },
        { label: "dark assets", value: intel ? String(intel.predictor.confirmed.length) : "—" }
      ]}
    >
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="border border-line-soft bg-surface-panel p-3">
          <h1 className="font-display text-sm text-ink">Sovereign intelligence</h1>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
            Four readings that outlive a snapshot: how fast each surface is moving, what it removed, whether its copy
            survives its own infrastructure, and which pages its naming convention implies but never links.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MODULES.map((module) => (
              <span
                key={module}
                className="border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim"
              >
                {module}
              </span>
            ))}
          </div>
        </div>

        <div className="border border-line-soft bg-surface-panel">
          <div className="border-b border-line-soft p-2.5">
            <h2 className="font-display text-sm text-ink">Read the trajectory</h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              Every pass stores a dated snapshot per host. Drift reads against the previous one, so the first run is a baseline.
            </p>
          </div>
          <div className="p-3">
            <WarRoomForm onRun={runPass} busy={busy} label="run the intelligence pass" />
          </div>
        </div>

        {error && <p className="border border-red-500/40 bg-red-500/10 p-2.5 text-[11px] text-red-300">{error}</p>}

        {busy && !intel && (
          <p className="border border-line-soft bg-surface-panel p-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
            reading snapshots · querying the archive · probing inferred siblings
          </p>
        )}

        {intel && (
          <>
            <DriftPanel drift={intel.drift} />
            <GhostPanel ghost={intel.ghost} />
            <EntropyPanel entropy={intel.entropy} />
            <PredictorPanel predictor={intel.predictor} />

            {intel.unread?.length > 0 && (
              <p className="border border-amber-500/40 bg-amber-500/10 p-2.5 font-mono text-[10px] leading-relaxed text-amber-300">
                {intel.unread.length} surface(s) could not be read: {intel.unread.map((entry) => entry.url).join(", ")}
              </p>
            )}

            {intel.refusals?.length > 0 && (
              <div className="border border-line-soft bg-surface-panel">
                <p className="border-b border-line-soft p-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
                  out of contract
                </p>
                <ul className="divide-y divide-line-soft">
                  {intel.refusals.map((refusal) => (
                    <li key={refusal.key} className="p-2.5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-300">{refusal.key}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{refusal.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="font-mono text-[10px] leading-relaxed text-ink-dim">{intel.limits}</p>
          </>
        )}
      </div>
    </IdeShell>
  );
}