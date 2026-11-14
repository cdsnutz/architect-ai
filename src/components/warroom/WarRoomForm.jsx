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

const FIELD =
  "mt-1 w-full border border-line bg-surface-sunken px-2 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-signal/60";

export default function WarRoomForm({ onRun, busy, label = "run the war room" }) {
  const [target, setTarget] = useState("");
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const [basis, setBasis] = useState("owned");
  const [attestation, setAttestation] = useState("");
  const [error, setError] = useState("");

  const setCompetitor = (index, value) =>
    setCompetitors((previous) => previous.map((item, position) => (position === index ? value : item)));

  const submit = (event) => {
    event.preventDefault();
    const winners = competitors.map((value) => value.trim()).filter(Boolean);
    if (!target.trim()) return setError("A target URL is required.");
    if (!winners.length) return setError("At least one competitor URL is required, on a different origin.");
    if (!attestation.trim()) {
      return setError("State who authorized this target. The pass will not run without it.");
    }
    setError("");
    onRun({ target_url: target.trim(), competitor_urls: winners, auth_basis: basis, attestation: attestation.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">target surface</span>
        <input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="https://you-own.com" className={FIELD} />
      </label>

      <div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">winner surfaces · up to three</span>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {competitors.map((value, index) => (
            <input
              key={index}
              value={value}
              onChange={(event) => setCompetitor(index, event.target.value)}
              placeholder={"https://winner-" + (index + 1) + ".com"}
              aria-label={"Winner surface " + (index + 1)}
              className="w-full border border-line bg-surface-sunken px-2 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-signal/60"
            />
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">authorization basis</span>
          <select value={basis} onChange={(event) => setBasis(event.target.value)} className={FIELD}>
            {BASES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">attestation</span>
          <input
            value={attestation}
            onChange={(event) => setAttestation(event.target.value)}
            placeholder="Who authorized this and for what"
            className={FIELD}
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
          <Play className="h-3 w-3" /> {busy ? "reading surfaces" : label}
        </button>
        <p className="text-[10px] leading-relaxed text-ink-dim">
          One anonymous read per surface. Exposure is reported only where a response proves it.
        </p>
      </div>
    </form>
  );
}