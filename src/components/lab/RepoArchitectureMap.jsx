/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { ArrowRight, Boxes, Package } from "lucide-react";

const LAYER_COLORS = {
  Interface: "border-sky-500/40 bg-sky-500/5",
  Service: "border-violet-500/40 bg-violet-500/5",
  Data: "border-emerald-500/40 bg-emerald-500/5",
  Test: "border-amber-500/40 bg-amber-500/5",
  Config: "border-slate-500/40 bg-slate-500/5",
  Other: "border-border bg-accent/20"
};

export default function RepoArchitectureMap({ architecture }) {
  if (!architecture || !Array.isArray(architecture.layers) || architecture.layers.length === 0) return null;
  const edges = Array.isArray(architecture.edges) ? architecture.edges : [];
  const externals = Array.isArray(architecture.externals) ? architecture.externals : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Boxes className="h-3.5 w-3.5 text-primary" />
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          architecture map · {architecture.modules.length} modules · {edges.length} edges
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {architecture.layers.map((layer) => (
          <div key={layer.name} className={"rounded-lg border p-2.5 " + (LAYER_COLORS[layer.name] || LAYER_COLORS.Other)}>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{layer.name}</p>
            <div className="mt-1.5 space-y-1">
              {layer.modules.slice(0, 6).map((module) => (
                <div key={module.key} className="flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="truncate font-medium">{module.key}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {module.files}f · {module.lines}l
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {edges.length > 0 && (
        <div className="space-y-1 rounded-lg border border-border p-2.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">import edges</p>
          {edges.slice(0, 8).map((edge) => (
            <div key={edge.from + edge.to} className="flex items-center gap-1.5 text-[11px]">
              <span className="truncate">{edge.from}</span>
              <ArrowRight className="h-3 w-3 shrink-0 text-primary" />
              <span className="truncate">{edge.to}</span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">x{edge.weight}</span>
            </div>
          ))}
        </div>
      )}

      {externals.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Package className="h-3 w-3 text-muted-foreground" />
          {externals.map((item) => (
            <span
              key={item.name}
              className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {item.name} · {item.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}