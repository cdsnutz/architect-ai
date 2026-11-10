import React from "react";

const TONE = {
  rupture: "border-red-500/50 bg-red-500/10 text-red-300",
  exposure: "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300",
  flaw: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  clear: "border-border bg-muted/40 text-muted-foreground"
};

export default function ThreatBadge({ verdict }) {
  if (!verdict) return null;

  return (
    <span
      title={verdict.reason}
      className={
        "rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider " + TONE[verdict.key]
      }
    >
      {verdict.label}
    </span>
  );
}