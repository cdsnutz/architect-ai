/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PodBlock from "@/components/analysis/PodBlock";

export default function DependencyGraph({ graph }) {
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const radius = graph?.blast_radius || [];

  if (!nodes.length && !edges.length && !radius.length) return null;

  return (
    <PodBlock title="Dependency graph · blast radius" icon={Network}>
      {nodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {nodes.map((n) => (
            <Badge key={n.id} variant={n.kind === "identifier" ? "default" : "secondary"} className="font-mono text-xs font-normal">
              {n.label || n.id}
            </Badge>
          ))}
        </div>
      )}

      {edges.length > 0 && (
        <div className="space-y-1">
          {edges.map((e, i) => (
            <p key={i} className="font-mono text-xs text-muted-foreground">
              {e.from} <span className="text-primary">→</span> {e.to}
              <span className="ml-2 font-body">({e.relation})</span>
            </p>
          ))}
        </div>
      )}

      {radius.length > 0 && (
        <div className="space-y-2">
          {radius.map((r, i) => (
            <div key={i} className="rounded-lg border bg-muted/20 p-3">
              <p className="font-mono text-sm">{r.identifier}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tables: {(r.affected_tables || []).join(", ") || "none traced"}
              </p>
              <p className="text-xs text-muted-foreground">
                Endpoints: {(r.affected_endpoints || []).join(", ") || "none traced"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{r.cascade}</p>
              {r.evidence && <p className="mt-1 text-xs text-muted-foreground">Evidence: {r.evidence}</p>}
            </div>
          ))}
        </div>
      )}
    </PodBlock>
  );
}