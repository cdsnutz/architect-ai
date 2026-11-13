/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PodBlock from "@/components/analysis/PodBlock";

const VARIANT = { cached: "secondary", revalidated: "secondary", live: "default", unknown: "outline" };

export default function TemporalProfile({ rows = [] }) {
  if (!rows.length) return null;

  return (
    <PodBlock title="Temporal delta · read freshness" icon={Activity}>
      {rows.map((r, i) => (
        <div key={i} className="border-l-2 border-primary/20 pl-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm break-all">{r.endpoint}</p>
            <Badge variant={VARIANT[r.freshness] || "outline"} className="text-xs">
              {r.freshness}
            </Badge>
            <Badge variant="outline" className="text-xs font-normal">
              {r.confidence}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{r.cadence}</p>
          {(r.signals || []).length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {r.signals.map((s, j) => (
                <Badge key={j} variant="secondary" className="font-mono text-xs font-normal">
                  {s}
                </Badge>
              ))}
            </div>
          )}
          {r.evidence && <p className="mt-1.5 text-xs text-muted-foreground">Evidence: {r.evidence}</p>}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Cadence is inferred from headers and bundle signals — true update timing needs a series of observations over time.
      </p>
    </PodBlock>
  );
}