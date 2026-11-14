/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import IdeShell from "@/components/ide/IdeShell";
import ToolkitSource from "@/components/toolkit/ToolkitSource";
import RouteLadder from "@/components/toolkit/RouteLadder";
import ContractRefusals from "@/components/toolkit/ContractRefusals";
import EnginePanel from "@/components/browser/EnginePanel";
import SubsystemMap from "@/components/toolkit/SubsystemMap";
import CapabilityLanes from "@/components/toolkit/CapabilityLanes";
import { TOOLKITS } from "@/lib/toolkits";

export default function ReverseSkill() {
  const toolkit = TOOLKITS["reverse-skill"];
  const [index, setIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const read = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("toolkitIndex", {
        owner: toolkit.owner,
        repo: toolkit.repo
      });
      setIndex(response.data || null);
    } catch (err) {
      const detail = err && err.response && err.response.data && err.response.data.error;
      setError(detail || (err && err.message) || "The repository tree could not be read.");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }, [toolkit]);

  useEffect(() => {
    read();
  }, [read]);

  const totals = (index && index.totals) || {};
  const release = (index && index.release) || null;

  return (
    <IdeShell
      active="reverse-skill"
      crumb={toolkit.crumb}
      note={toolkit.note}
      status={[
        { label: "files", value: String(totals.files || 0) },
        { label: "modules", value: String(totals.groups || 0) },
        { label: "release", value: release ? release.name || release.tag : "—" }
      ]}
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="space-y-4">
          <ToolkitSource toolkit={toolkit} index={index} busy={busy} error={error} onSync={read} />
          <div className="border border-line-soft bg-surface-panel p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">how this module is used</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">{toolkit.usedFor}</p>
          </div>
          <div className="border border-line-soft bg-surface-panel p-3">
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-signal">
              <ShieldCheck className="h-3 w-3" /> same gate, both sides
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
              The package's own rule is that nothing acts before the scope is written down. That is the gate this lab
              already enforces at the frame stage, so a playbook referenced here inherits it.
            </p>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <EnginePanel />
          <RouteLadder />
          <ContractRefusals />
          {loading ? (
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">Reading the repository tree…</p>
          ) : (
            <SubsystemMap groups={(index && index.groups) || []} totals={totals} />
          )}
          <CapabilityLanes capabilities={toolkit.capabilities} licenseNote={toolkit.licenseNote} />
        </div>
      </div>
    </IdeShell>
  );
}