import React from "react";
import { Badge } from "@/components/ui/badge";

export default function ReaSkillList({ skills = [], agents = [] }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agents</h4>
        <div className="mt-2 divide-y rounded-lg border">
          {agents.map((agent) => (
            <div key={agent.name} className="px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{agent.name}</p>
                <Badge variant={agent.kind === "in-app" ? "default" : "outline"} className="text-[10px] uppercase">
                  {agent.kind}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{agent.role}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</h4>
        <div className="mt-2 space-y-1.5">
          {skills.map((skill) => (
            <div key={skill.name} className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-sm font-medium">{skill.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{skill.proves}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}