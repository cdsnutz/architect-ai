/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import IdeShell from "@/components/ide/IdeShell";
import SymmetryForm from "@/components/symmetry/SymmetryForm";
import RunHistory from "@/components/symmetry/RunHistory";
import FidelityPanel from "@/components/symmetry/FidelityPanel";
import GraphPanel from "@/components/symmetry/GraphPanel";
import EntropyPanel from "@/components/symmetry/EntropyPanel";
import StatePanel from "@/components/symmetry/StatePanel";
import DiffPanel from "@/components/symmetry/DiffPanel";
import IsomorphismPanel from "@/components/symmetry/IsomorphismPanel";
import MarkovPanel from "@/components/symmetry/MarkovPanel";
import LatencyPanel from "@/components/symmetry/LatencyPanel";

const EMPTY = {
  label: "",
  target_url: "",
  candidate_url: "",
  auth_basis: "owned",
  attestation: ""
};

const BASIS_LABEL = {
  owned: "Owned property",
  written_authorization: "Written authorization",
  staging_mirror: "Staging mirror"
};

export default function Symmetry() {
  const [form, setForm] = useState(EMPTY);
  const [runs, setRuns] = useState([]);
  const [active, setActive] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const page = await base44.entities.SymmetryRun.filter({}, { sort: "-created_date", limit: 20 });
    const items = page.items || [];
    setRuns(items);
    setActive((current) => {
      if (current && items.some((run) => run.id === current.id)) {
        return items.find((run) => run.id === current.id);
      }
      return items[0] || null;
    });
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("runSymmetryPass", form);
      if (response.data && response.data.run) setActive(response.data.run);
      setForm({ ...EMPTY, auth_basis: form.auth_basis });
      await load();
    } catch (err) {
      const detail = err && err.response && err.response.data && err.response.data.error;
      setError(detail || (err && err.message) || "The symmetry pass failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <IdeShell
      active="symmetry"
      crumb="Symmetry / authorized pass"
      note="L3 ceiling · read-only"
      status={[
        { label: "mode", value: "read-only" },
        { label: "passes", value: String(runs.length) },
        { label: "ceiling", value: active && active.fidelity ? active.fidelity.level : "L3" }
      ]}
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="space-y-4">
          <SymmetryForm value={form} onChange={setForm} onSubmit={submit} busy={busy} error={error} />
          <RunHistory runs={runs} activeId={active ? active.id : null} onSelect={setActive} />
        </div>

        <div className="min-w-0 space-y-4">
          {loading ? (
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">Loading passes…</p>
          ) : active ? (
            <>
              <div className="border border-line-soft bg-surface-panel p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h1 className="truncate font-display text-sm text-ink">{active.label || active.target_url}</h1>
                  <span className="border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    {BASIS_LABEL[active.auth_basis] || active.auth_basis}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-[10px] text-ink-dim">{active.target_url}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">Attested: {active.attestation}</p>
                {active.error && <p className="mt-1 text-[11px] text-destructive">{active.error}</p>}
              </div>

              <FidelityPanel fidelity={active.fidelity} />

              <div className="grid gap-4 xl:grid-cols-2">
                <GraphPanel graph={active.graph} />
                <LatencyPanel latency={active.latency} />
                <EntropyPanel entropy={active.entropy} />
                <IsomorphismPanel isomorphism={active.isomorphism} />
                <StatePanel state={active.state} />
                <DiffPanel diff={active.diff} />
                <MarkovPanel markov={active.markov} />
              </div>
            </>
          ) : (
            <div className="border border-line-soft bg-surface-panel p-6">
              <h1 className="font-display text-sm text-ink">No symmetry pass yet</h1>
              <p className="mt-2 max-w-prose text-[11px] leading-relaxed text-ink-muted">
                Map a property you own or are authorized to test. The pass reads five dimensions: trigger-edge dependency graph, structural
                parity against your candidate, the target's latency signature and the hold your mirror needs, a first-order transition model
                for prefetch, entropy-ranked asset recovery, and a state-key inventory by name only.
              </p>
            </div>
          )}
        </div>
      </div>
    </IdeShell>
  );
}