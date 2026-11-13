/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Plug } from "lucide-react";
import PodBlock from "@/components/analysis/PodBlock";

export default function ApiContracts({ contracts = [] }) {
  if (!contracts.length) return null;

  return (
    <PodBlock title="API contracts (inferred)" icon={Plug}>
      {contracts.map((c, i) => (
        <div key={i} className="border-l-2 border-primary/20 pl-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm">
              {c.method} {c.endpoint}
            </p>
            {c.linked_table && c.linked_table !== "unlinked" && (
              <Badge variant="outline" className="font-mono text-xs font-normal">
                → {c.linked_table}
              </Badge>
            )}
          </div>
          {c.ui_trigger && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Trigger:</span> {c.ui_trigger}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Request:</span> {c.request_shape}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Response:</span> {c.response_shape}
          </p>
          {c.related_tables && c.related_tables.length > 0 && (
            <p className="text-xs text-muted-foreground">Also touches: {c.related_tables.join(", ")}</p>
          )}
          <p className="text-xs text-muted-foreground">Evidence: {c.evidence}</p>
        </div>
      ))}
    </PodBlock>
  );
}