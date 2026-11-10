import React from "react";
import { Badge } from "@/components/ui/badge";
import { ListChecks } from "lucide-react";
import PodBlock from "@/components/analysis/PodBlock";

export default function PodLedger({ findings = [] }) {
  if (!findings.length) return null;

  return (
    <PodBlock title="Pod ledger" icon={ListChecks}>
      {findings.map((f, i) => (
        <div key={i} className="border-l-2 border-primary/20 pl-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            {f.finding}
            <Badge variant={f.confidence === "observed" ? "default" : "secondary"} className="shrink-0 text-xs">
              {f.confidence}
            </Badge>
          </p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{f.pod}</p>
          <p className="text-sm text-muted-foreground">{f.evidence}</p>
        </div>
      ))}
    </PodBlock>
  );
}