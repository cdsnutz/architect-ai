/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const DOT = {
  rupture: "bg-red-500",
  exposure: "bg-fuchsia-500",
  flaw: "bg-amber-500",
  clear: "bg-emerald-500/70"
};

export default function ThreatTally({ groups }) {
  if (!Array.isArray(groups) || groups.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-border/70 bg-background/40 px-3 py-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Threat sweep
      </span>
      {groups.map((group) => (
        <span key={group.level.key} className="flex items-center gap-1.5 text-[11px] text-foreground/80">
          <span className={"h-1.5 w-1.5 rounded-full " + DOT[group.level.key]} />
          {group.level.label}
          <span className="font-mono text-foreground">{group.rows.length}</span>
        </span>
      ))}
    </div>
  );
}