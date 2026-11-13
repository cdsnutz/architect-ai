import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Workflow } from "lucide-react";

const TONE = {
  pass: "border-emerald-500/40 text-emerald-400",
  attention: "border-amber-500/40 text-amber-400",
  needs_input: "text-muted-foreground"
};

export default function ReplicaSkillBoard({ stages, counts }) {
  if (!stages?.length) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Workflow className="h-4 w-4 text-primary" />
            Skill board
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">All eleven stages, in pipeline order.</p>
        </div>
        {counts && (
          <div className="flex shrink-0 gap-1.5 font-mono text-[10px] uppercase">
            <span className="text-emerald-400">{counts.pass} pass</span>
            <span className="text-amber-400">{counts.attention} open</span>
            <span className="text-muted-foreground">{counts.needs_input} input</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1.5">
        {stages.map((item) => (
          <details key={item.key} className="rounded border border-border/60 px-2.5 py-1.5">
            <summary className="flex cursor-pointer items-center gap-2">
              <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {item.label}
              </span>
              <span className="flex-1 text-xs">{item.summary}</span>
              <Badge variant="outline" className={TONE[item.status] || TONE.needs_input}>
                {item.status.replace("_", " ")}
              </Badge>
            </summary>
            {(item.agent || item.pods?.length > 0) && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {item.agent}
                {item.pods?.length > 0 ? " · " + item.pods.join(", ") : ""}
                {item.probes_run ? " · " + item.probes_reproduced + "/" + item.probes_run + " probes" : ""}
              </p>
            )}
            {item.agent_verdict && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                <span className="font-mono text-[10px] uppercase tracking-wide text-foreground">
                  agent · {item.agent_verdict.verdict}
                </span>{" "}
                {item.agent_verdict.note}
              </p>
            )}
            {item.details?.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 border-t border-border/40 pt-1.5 text-[11px] text-muted-foreground">
                {item.details.map((detail, index) => (
                  <li key={index} className="font-mono leading-relaxed">{detail}</li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </CardContent>
    </Card>
  );
}