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
import GravityPanel from "@/components/command/GravityPanel";
import LoadPanel from "@/components/command/LoadPanel";
import AgilityPanel from "@/components/command/AgilityPanel";

const MODULES = ["gravity map", "cognitive load", "agility index"];

const money = (run) =>
  run ? run.gravity.rows.find((row) => row.role === "lead")?.money_share ?? "—" : "—";

export default function Command() {
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState("");

  const runPass = async (payload) => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("marketIntel", payload);
      setRun(response.data);
    } catch (invokeError) {
      setError(invokeError?.response?.data?.error || invokeError?.message || "The command pass could not run.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <IdeShell
      active="command"
      crumb="command / market intelligence"
      note="gravity → friction → agility"
      status={[
        { label: "lead gravity", value: run ? `${money(run)}%` : "—" },
        {
          label: "load gap",
          value: run
            ? (() => {
                const lead = run.cognitive.rows.find((row) => row.role === "lead");
                const winners = run.cognitive.rows.filter((row) => row.role === "winner");
                const best = winners.sort((left, right) => left.load - right.load)[0];
                return lead && best ? `${lead.load - best.load}` : "—";
              })()
            : "—"
        },
        {
          label: "unstable",
          value: run ? String(run.agility.rows.filter((row) => row.state === "unstable").length) : "—"
        }
      ]}
    >
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="border border-line-soft bg-surface-panel p-3">
          <h1 className="font-display text-sm text-ink">Command matrix</h1>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
            The surface read as a system: where its linking pushes a reader, how many decisions it asks of them, and
            how fast it rewrites the pages that carry money.
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
            <h2 className="font-display text-sm text-ink">Read the system</h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              Every pass stores a dated digest per host. Agility compares against the previous one, so the first run is a
              baseline.
            </p>
          </div>
          <div className="p-3">
            <WarRoomForm onRun={runPass} busy={busy} label="run the command pass" />
          </div>
        </div>

        {error && <p className="border border-red-500/40 bg-red-500/10 p-2.5 text-[11px] text-red-300">{error}</p>}

        {busy && !run && (
          <p className="border border-line-soft bg-surface-panel p-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
            reading link graphs · counting decisions · comparing digests
          </p>
        )}

        {run && (
          <>
            <GravityPanel gravity={run.gravity} />
            <LoadPanel cognitive={run.cognitive} />
            <AgilityPanel agility={run.agility} />

            {run.unread?.length > 0 && (
              <p className="border border-amber-500/40 bg-amber-500/10 p-2.5 font-mono text-[10px] leading-relaxed text-amber-300">
                {run.unread.length} surface(s) could not be read: {run.unread.map((entry) => entry.url).join(", ")}
              </p>
            )}

            {run.refusals?.length > 0 && (
              <div className="border border-line-soft bg-surface-panel">
                <p className="border-b border-line-soft p-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
                  out of contract
                </p>
                <ul className="divide-y divide-line-soft">
                  {run.refusals.map((refusal) => (
                    <li key={refusal.key} className="p-2.5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-300">{refusal.key}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{refusal.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="font-mono text-[10px] leading-relaxed text-ink-dim">{run.limits}</p>
          </>
        )}
      </div>
    </IdeShell>
  );
}