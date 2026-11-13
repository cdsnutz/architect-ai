/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cable } from "lucide-react";

export default function CrossWireMatrix({ wiring }) {
  if (!wiring?.pods?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cable className="h-4 w-4 text-primary" />
          Pod cross-wire
        </CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          {wiring.stages.length} clone stages wired to {wiring.pods.length} pods and {wiring.skill_count} lab skills.
        </p>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {wiring.pods.map((pod) => (
          <div key={pod.pod} className="rounded border border-border/60 p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-xs font-semibold">{pod.pod}</span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                {pod.stages.length} stages
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {pod.stages.map((stage) => (
                <Badge key={stage} variant="outline" className="font-mono text-[10px] uppercase">
                  {stage}
                </Badge>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              agents: <span className="font-mono">{pod.agents.join(", ")}</span>
            </p>
            {pod.skills.length > 0 && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                skills: {pod.skills.map((skill) => skill.name).join(", ")}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}