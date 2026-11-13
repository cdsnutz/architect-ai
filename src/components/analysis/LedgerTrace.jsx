/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Network } from "lucide-react";
import PodBlock from "@/components/analysis/PodBlock";

function rowsFrom(traces, contracts) {
  if (traces.length) {
    return traces.map((t) => ({
      trigger: t.ui_trigger,
      endpoint: t.endpoint,
      table: t.table,
      evidence: t.evidence,
    }));
  }
  return contracts
    .filter((c) => c.linked_table && c.linked_table !== "unlinked")
    .map((c) => ({
      trigger: c.ui_trigger,
      endpoint: `${c.method} ${c.endpoint}`,
      table: c.linked_table,
      evidence: c.evidence,
    }));
}

export default function LedgerTrace({ traces = [], contracts = [] }) {
  const rows = rowsFrom(traces, contracts);
  if (!rows.length) return null;

  return (
    <PodBlock title="Ledger trace · trigger → endpoint → table" icon={Network}>
      {rows.map((r, i) => (
        <div key={i} className="rounded-lg border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary" className="font-normal">
              {r.trigger || "unmapped trigger"}
            </Badge>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-mono text-foreground">{r.endpoint || "unmapped endpoint"}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            <Badge variant="outline" className="font-mono font-normal">
              {r.table || "unlinked"}
            </Badge>
          </div>
          {r.evidence && <p className="mt-1.5 text-xs text-muted-foreground">Evidence: {r.evidence}</p>}
        </div>
      ))}
    </PodBlock>
  );
}