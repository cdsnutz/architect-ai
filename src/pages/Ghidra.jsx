/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import IdeShell from "@/components/ide/IdeShell";
import GhidraSource from "@/components/ghidra/GhidraSource";
import SubsystemMap from "@/components/ghidra/SubsystemMap";
import CapabilityLanes from "@/components/ghidra/CapabilityLanes";

export default function Ghidra() {
  const [index, setIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const read = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("ghidraIndex", {});
      setIndex(response.data || null);
    } catch (err) {
      const detail = err && err.response && err.response.data && err.response.data.error;
      setError(detail || (err && err.message) || "The Ghidra tree could not be read.");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    read();
  }, [read]);

  const totals = (index && index.totals) || {};
  const release = (index && index.release) || null;

  return (
    <IdeShell
      active="ghidra"
      crumb="Ghidra / analysis core"
      note="reference index · no execution"
      status={[
        { label: "files", value: String(totals.files || 0) },
        { label: "modules", value: String(totals.groups || 0) },
        { label: "release", value: release ? release.name || release.tag : "—" }
      ]}
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="space-y-4">
          <GhidraSource index={index} busy={busy} error={error} onSync={read} />
          <div className="border border-line-soft bg-surface-panel p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">how this module is used</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
              Ghidra runs on your own host, not here. This module keeps the toolkit's map in the IDE: its licence,
              current release, and how the repository splits into subsystems, so a dossier's binary claims can name
              the exact component they rest on.
            </p>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          {loading ? (
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">Reading the repository tree…</p>
          ) : (
            <SubsystemMap groups={(index && index.groups) || []} totals={totals} />
          )}
          <CapabilityLanes />
        </div>
      </div>
    </IdeShell>
  );
}