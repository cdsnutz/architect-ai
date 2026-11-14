/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { Play } from "lucide-react";

export default function GapForm({ onRun, busy }) {
  const [lead, setLead] = useState("");
  const [winners, setWinners] = useState(["", "", ""]);
  const [error, setError] = useState("");

  const setWinner = (index, value) => {
    setWinners((current) => current.map((item, at) => (at === index ? value : item)));
  };

  const submit = (event) => {
    event.preventDefault();
    const leadUrl = lead.trim();
    const winnerUrls = winners.map((value) => value.trim()).filter(Boolean);
    if (!leadUrl) {
      setError("The lead surface is required.");
      return;
    }
    if (!winnerUrls.length) {
      setError("Add at least one winner surface to compare against.");
      return;
    }
    const bad = [leadUrl, ...winnerUrls].find((url) => !/^https?:\/\//i.test(url));
    if (bad) {
      setError("Every surface needs a full URL, e.g. https://example.com.");
      return;
    }
    setError("");
    onRun({ lead_url: leadUrl, winner_urls: winnerUrls });
  };

  const field = "mt-1 w-full border border-line bg-surface-sunken px-2 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-signal/60";

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">the lead · surface you are trying to win</span>
        <input value={lead} onChange={(e) => setLead(e.target.value)} placeholder="https://prospect.com" className={field} />
      </label>

      <div className="grid gap-2 sm:grid-cols-3">
        {winners.map((value, index) => (
          <label key={index} className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">winner {index + 1}</span>
            <input value={value} onChange={(e) => setWinner(index, e.target.value)} placeholder="https://leader.com" className={field} />
          </label>
        ))}
      </div>

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 border border-signal/50 bg-signal/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-signal transition-colors hover:bg-signal/20 disabled:opacity-50"
        >
          <Play className="h-3 w-3" /> {busy ? "reading the map" : "run gap audit"}
        </button>
        <p className="text-[10px] leading-relaxed text-ink-dim">
          Public surfaces only, one anonymous read each. No clicks, no ranking tricks.
        </p>
      </div>
    </form>
  );
}