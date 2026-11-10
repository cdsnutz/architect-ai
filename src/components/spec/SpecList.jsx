import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TONE = {
  ready: "border-blue-500/40 text-blue-400",
  running: "border-amber-500/40 text-amber-400",
  captured: "border-emerald-500/40 text-emerald-400",
  failed: "border-red-500/40 text-red-400"
};

export default function SpecList({ specs = [], selectedId, onSelect }) {
  if (!specs.length) {
    return <p className="text-xs text-muted-foreground">No specs compiled yet.</p>;
  }

  return (
    <div className="space-y-2">
      {specs.map((spec) => (
        <Card
          key={spec.id}
          onClick={() => onSelect(spec)}
          className={`cursor-pointer transition-colors ${selectedId === spec.id ? "border-primary/60" : "hover:border-border/80"}`}
        >
          <CardContent className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{spec.title}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                {spec.target_url || "no target"} · {spec.contract_counts?.ledger_traces || 0} traces
              </p>
            </div>
            <Badge variant="outline" className={`shrink-0 text-[10px] ${TONE[spec.status] || ""}`}>
              {spec.performance ? spec.performance.verdict : spec.status}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}