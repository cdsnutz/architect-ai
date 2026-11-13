/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export default function JourneyDetail({ journey }) {
  const writtenBy = Array.isArray(journey.tableMeta?.written_by) ? journey.tableMeta.written_by : [];
  const keys = Array.isArray(journey.tableMeta?.keys) ? journey.tableMeta.keys : [];

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">{journey.trigger || "Unmapped trigger"}</p>
        <Badge variant={journey.complete ? "default" : "secondary"} className="text-[10px] uppercase">
          {journey.complete ? "linked" : "gap"}
        </Badge>
      </div>

      <div className="grid gap-1 text-xs">
        <p className="flex flex-wrap items-center gap-2">
          <span className="w-14 shrink-0 text-muted-foreground">API</span>
          <span className="font-mono text-foreground">{journey.endpoint || "not observable"}</span>
        </p>
        <p className="flex flex-wrap items-center gap-2">
          <span className="w-14 shrink-0 text-muted-foreground">Table</span>
          <span className="font-mono text-foreground">{journey.table || "unlinked"}</span>
        </p>
        {keys.length > 0 && (
          <p className="flex flex-wrap items-center gap-2">
            <span className="w-14 shrink-0 text-muted-foreground">Keys</span>
            <span className="font-mono text-foreground">{keys.join(", ")}</span>
          </p>
        )}
        {writtenBy.length > 0 && (
          <p className="flex flex-wrap items-center gap-2">
            <span className="w-14 shrink-0 text-muted-foreground">Writes</span>
            <span className="font-mono text-foreground">{writtenBy.join(", ")}</span>
          </p>
        )}
      </div>

      {journey.transition && (
        <p className="flex flex-wrap items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground">
          <span className="font-mono text-foreground">{journey.transition.current_state || "(initial)"}</span>
          <ArrowRight className="w-3 h-3" />
          <span>{journey.transition.action || "no recorded action"}</span>
          <ArrowRight className="w-3 h-3" />
          <span className="font-mono text-foreground">{journey.transition.next_state || "(terminal)"}</span>
        </p>
      )}

      {journey.evidence && <p className="border-t pt-2 text-xs text-muted-foreground">Evidence: {journey.evidence}</p>}
    </div>
  );
}