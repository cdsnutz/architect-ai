import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

const DOT = {
  queued: "bg-muted-foreground/40",
  running: "bg-primary animate-pulse",
  complete: "bg-emerald-500",
  needs_input: "bg-amber-500",
  skipped: "bg-muted-foreground/40",
  failed: "bg-destructive"
};

export default function RunTelemetry({ stages, busy }) {
  if (!Array.isArray(stages) || stages.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Live run telemetry
          {busy && (
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              in flight
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.key} className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <span className={"h-2 w-2 rounded-full " + (DOT[stage.status] || DOT.queued)} />
              <span className="mt-1 w-px flex-1 bg-border" />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{stage.label}</p>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {stage.status}
                </span>
              </div>
              {Array.isArray(stage.pods) && stage.pods.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {stage.pods.map((pod) => (
                    <Badge key={pod} variant="secondary" className="text-[10px] font-normal">
                      {pod}
                    </Badge>
                  ))}
                </div>
              )}
              {stage.detail && <p className="mt-1 text-[11px] text-muted-foreground">{stage.detail}</p>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}