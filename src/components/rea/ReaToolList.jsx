import React from "react";
import { Badge } from "@/components/ui/badge";
import CopyButton from "@/components/analysis/CopyButton";

export default function ReaToolList({ tools = [] }) {
  return (
    <div className="space-y-2">
      {tools.map((tool) => (
        <div key={tool.id} className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{tool.label}</p>
                <Badge variant={tool.kind === "local" ? "outline" : "secondary"} className="text-[10px] uppercase">
                  {tool.kind === "local" ? "local CLI" : "in-app"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{tool.purpose}</p>
              <code className="mt-2 block break-all font-mono text-xs text-foreground">{tool.command}</code>
            </div>
            <CopyButton getText={() => tool.command} label="Copy" className="shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}