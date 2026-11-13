/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import TelemetryFilters from "@/components/lab/TelemetryFilters";
import TelemetryStage from "@/components/lab/TelemetryStage";

function isDeclined(stage) {
  if (stage.status === "needs_input") return true;
  return Array.isArray(stage.verdicts) && stage.verdicts.some((verdict) => verdict.verdict === "declined");
}

export default function RunTelemetry({ stages, busy }) {
  const [onlyDeclined, setOnlyDeclined] = useState(false);
  const [onlySignoff, setOnlySignoff] = useState(false);

  if (!Array.isArray(stages) || stages.length === 0) return null;

  const visible = stages
    .filter((stage) => !onlySignoff || stage.key === "signoff")
    .filter((stage) => !onlyDeclined || isDeclined(stage))
    .map((stage) => ({
      ...stage,
      verdicts:
        onlyDeclined && Array.isArray(stage.verdicts)
          ? stage.verdicts.filter((verdict) => verdict.verdict === "declined")
          : stage.verdicts
    }));

  const declinedCount = stages.filter(isDeclined).length;

  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Live run telemetry
          {busy && (
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              in flight
            </span>
          )}
        </CardTitle>
        <TelemetryFilters
          onlyDeclined={onlyDeclined}
          onlySignoff={onlySignoff}
          declinedCount={declinedCount}
          onToggleDeclined={() => setOnlyDeclined((value) => !value)}
          onToggleSignoff={() => setOnlySignoff((value) => !value)}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {visible.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {onlyDeclined && onlySignoff
              ? "No sign-off agent declined a stage on this run."
              : onlyDeclined
                ? "No stage was declined on this run."
                : "This run has no sign-off stage."}
          </p>
        ) : (
          visible.map((stage) => <TelemetryStage key={stage.key} stage={stage} />)
        )}
      </CardContent>
    </Card>
  );
}