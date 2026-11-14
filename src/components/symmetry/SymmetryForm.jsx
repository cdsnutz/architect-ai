/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { ShieldCheck } from "lucide-react";

const BASES = [
  { key: "owned", label: "I own this property" },
  { key: "written_authorization", label: "Written authorization on file" },
  { key: "staging_mirror", label: "Staging mirror of my own stack" }
];

const FIELD =
  "w-full border border-line-soft bg-surface-sunken px-2 py-1.5 font-mono text-xs text-ink outline-none placeholder:text-ink-dim focus:border-signal";

export default function SymmetryForm({ value, onChange, onSubmit, busy, error }) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3 border border-line-soft bg-surface-panel p-3"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-signal" />
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink">Authorized symmetry pass</h2>
      </div>

      <label className="block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-dim">Baseline surface</span>
        <input
          className={FIELD}
          value={value.target_url}
          onChange={(event) => set({ target_url: event.target.value })}
          placeholder="https://your-property.example"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-dim">Candidate surface (optional)</span>
        <input
          className={FIELD}
          value={value.candidate_url}
          onChange={(event) => set({ candidate_url: event.target.value })}
          placeholder="https://your-rebuild.example"
        />
      </label>

      <label className="block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-dim">Authorization basis</span>
        <select
          className={FIELD}
          value={value.auth_basis}
          onChange={(event) => set({ auth_basis: event.target.value })}
        >
          {BASES.map((basis) => (
            <option key={basis.key} value={basis.key}>
              {basis.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-dim">Attestation</span>
        <textarea
          className={FIELD + " h-16 resize-none"}
          value={value.attestation}
          onChange={(event) => set({ attestation: event.target.value })}
          placeholder="Who authorized this target, and for what."
          required
        />
      </label>

      {error && <p className="border-l-2 border-destructive bg-surface-sunken px-2 py-1 text-[11px] text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full border border-signal bg-signal px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-signal-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Reading surface…" : "Run symmetry pass"}
      </button>
      <p className="text-[10px] leading-relaxed text-ink-dim">
        Read-only: anonymous GET and HEAD only. No form is submitted, no credential is sent, nothing is proxied or re-served.
      </p>
    </form>
  );
}