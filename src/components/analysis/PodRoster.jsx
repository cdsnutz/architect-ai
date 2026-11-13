/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network } from "lucide-react";
import CopyButton from "@/components/analysis/CopyButton";

export default function PodRoster() {
  const [framework, setFramework] = useState(null);

  useEffect(() => {
    base44.functions
      .invoke("podFramework")
      .then((res) => setFramework(res.data))
      .catch(() => setFramework(null));
  }, []);

  if (!framework || !framework.pods) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Network className="w-5 h-5" />
              Pod extraction
            </CardTitle>
            <CardDescription>
              Every analysis pass runs these four pods against the evidence.
            </CardDescription>
          </div>
          <CopyButton
            getText={() => framework.masterPrompt}
            label="Copy master prompt"
            copiedLabel="Master prompt copied"
            className="shrink-0"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {framework.pods.map((pod) => (
            <div key={pod.id} className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm font-semibold">{pod.name}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{pod.surface}</p>
              <p className="mt-2 text-sm text-muted-foreground">{pod.objective}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pod.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs font-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        {framework.layers?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Intelligence layers</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {framework.layers.map((layer) => (
                <div key={layer.id} className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{layer.name}</p>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {layer.phase}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{layer.goal}</p>
                  <p className="mt-1.5 font-mono text-xs text-muted-foreground">writes {layer.output}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {framework.sequence?.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sync sequence</p>
            <ol className="mt-1.5 space-y-1 text-sm text-muted-foreground">
              {framework.sequence.map((phase) => (
                <li key={phase.phase}>
                  <span className="font-medium text-foreground">{phase.phase}:</span> {phase.steps.join(" → ")}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rev-cycle</p>
          <ol className="mt-1.5 list-decimal list-inside space-y-0.5 text-sm text-muted-foreground">
            {framework.revCycle.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Methods</p>
          <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
            {framework.techniques.map((t) => (
              <li key={t.name}>
                <span className="font-medium text-foreground">{t.name}:</span> {t.use}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">{framework.scope}</p>
      </CardContent>
    </Card>
  );
}