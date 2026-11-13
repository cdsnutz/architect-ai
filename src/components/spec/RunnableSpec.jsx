/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal } from "lucide-react";
import CopyButton from "@/components/analysis/CopyButton";

export default function RunnableSpec({ spec }) {
  const run = spec.runnable_spec || {};
  const stages = Array.isArray(run.stages) ? run.stages : [];
  const cli = "# In the rebuilt repo, on your machine\n" + stages.map((s) => s.run).filter(Boolean).join("\n");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="h-4 w-4 text-primary" />
            Run contract
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{run.run_contract}</p>
        </div>
        <CopyButton getText={() => cli} label="Copy commands" className="shrink-0" />
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.key} className="border-l-2 border-primary/20 pl-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px] uppercase">{stage.key}</Badge>
              <p className="font-mono text-xs break-all">{stage.run}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stage.expect ? "expect " + stage.expect + " · " : ""}
              {stage.wait_for ? "wait for " + stage.wait_for + " · " : ""}
              {stage.capture ? "captures " + stage.capture.join(", ") : ""}
            </p>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Post the transcript and metrics below to capture how the rebuilt app performed.
        </p>
      </CardContent>
    </Card>
  );
}