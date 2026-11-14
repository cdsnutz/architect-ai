/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { Play } from "lucide-react";

const BASES = [
  { value: "owned", label: "I own this surface" },
  { value: "written_authorization", label: "Written authorization" },
  { value: "staging_mirror", label: "My own staging mirror" }
];

export default function MirrorLaunch({ onRun, busy }) {
  const [target, setTarget] = useState("");
  const [candidate, setCandidate] = useState("");
  const [basis, setBasis] = useState("owned");
  const [attestation, setAttestation] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (!target.trim()) {
      setError("A target URL is required.");
      return;
    }
    if (!attestation.trim()) {
      setError("State who authorized this target. The pass will not run without it.");
      return;
    }
    if (candidate.trim() && !candidate.trim().startsWith("http")) {
      setError("Your deploy needs a full URL, e.g. https://staging.you-own.com.");
      return;
    }
    setError("");
    onRun({ target_url: target.trim(), candidate_url: candidate.trim(), auth_basis: basis, attestation: attestation.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">target url</span>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="https://app.you-own.com"
            className="mt-1 w-full border border-line bg-surface-sunken px-2 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-signal/60"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">your deploy (optional)</span>
          <input
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
            placeholder="https://mirror.you-own.com"
            className="mt-1 w-full border border-line bg-surface-sunken px-2 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-signal/60"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">authorization basis</span>
          <select
            value={basis}
            onChange={(e) => setBasis(e.target.value)}
            className="mt-1 w-full border border-line bg-surface-sunken px-2 py-1.5 text-[12px] text-ink outline-none focus:border-signal/60"
          >
            {BASES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">attestation</span>
          <input
            value={attestation}
            onChange={(e) => setAttestation(e.target.value)}
            placeholder="Who authorized this and for what"
            className="mt-1 w-full border border-line bg-surface-sunken px-2 py-1.5 text-[12px] text-ink outline-none focus:border-signal/60"
          />
        </label>
      </div>

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 border border-signal/50 bg-signal/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-signal transition-colors hover:bg-signal/20 disabled:opacity-50"
        >
          <Play className="h-3 w-3" /> {busy ? "running the pipeline" : "run mirror pipeline"}
        </button>
        <p className="text-[10px] leading-relaxed text-ink-dim">
          Four stages, read-only. State values are never read and nothing is re-served from here.
        </p>
      </div>
    </form>
  );
}