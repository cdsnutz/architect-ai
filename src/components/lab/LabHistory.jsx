/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Loader2 } from "lucide-react";

function Label({ record }) {
  return (
    <span className="min-w-0 flex-1 text-left">
      <span className="block truncate text-sm font-medium">{record.title || record.pack_name || record.request}</span>
      <span className="block truncate text-[11px] text-muted-foreground">{record.request || record.pack_name}</span>
    </span>
  );
}

export default function LabHistory({ requests, runs, loading, onOpenRequest, onOpenRun }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-primary" />
          Recent lab work
          {loading && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Data requests</p>
          {!Array.isArray(requests) || requests.length === 0 ? (
            <p className="mt-1.5 text-[11px] text-muted-foreground">None yet.</p>
          ) : (
            <div className="mt-1.5 divide-y divide-border/70">
              {requests.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => onOpenRequest(record)}
                  className="flex w-full items-center gap-3 px-1 py-2 text-left transition-colors hover:bg-accent/40"
                >
                  <Label record={record} />
                  <Badge variant="outline" className="shrink-0 text-[9px] uppercase tracking-wider">
                    {record.status}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Challenge runs</p>
          {!Array.isArray(runs) || runs.length === 0 ? (
            <p className="mt-1.5 text-[11px] text-muted-foreground">None yet — run a pack above.</p>
          ) : (
            <div className="mt-1.5 divide-y divide-border/70">
              {runs.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => onOpenRun(run)}
                  className="flex w-full items-center gap-3 px-1 py-2 text-left transition-colors hover:bg-accent/40"
                >
                  <Label record={run} />
                  {run.capability_gap && (
                    <Badge variant="outline" className="shrink-0 border-amber-500/50 text-[9px] uppercase text-amber-400">
                      gap
                    </Badge>
                  )}
                  <Badge variant="outline" className="shrink-0 text-[9px] uppercase tracking-wider">
                    {run.status}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}