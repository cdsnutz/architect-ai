import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";

export default function ReplicaSkillGrid({ skills }) {
  if (!skills.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-primary" />
          Replica skill set
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          The eleven staged skills. The three with a runner are executed here and saved against this spec; the rest stay operator-run.
        </p>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {skills.map((skill) => (
          <div key={skill.id} className="rounded-md border border-border/60 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wide text-primary">{skill.command}</span>
              <Badge variant="outline" className={skill.runner ? "border-emerald-500/40 text-emerald-400" : "text-muted-foreground"}>
                {skill.runner ? "run here" : "operator"}
              </Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{skill.purpose}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}