import React from "react";
import { cn } from "@/lib/utils";

const DOT = {
  active: "bg-primary animate-pulse",
  done: "bg-primary/60",
  queued: "bg-muted-foreground/30",
  skipped: "bg-border",
  failed: "bg-destructive",
  idle: "bg-muted-foreground/20"
};

const LABEL = {
  active: "active",
  done: "done",
  queued: "queued",
  skipped: "skipped",
  failed: "failed",
  idle: "idle"
};

export default function PodStatusRow({ pod, elapsed }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT[pod.state] || DOT.idle)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className={cn("text-sm font-medium", pod.state === "idle" && "text-muted-foreground")}>{pod.name}</p>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{LABEL[pod.state] || "idle"}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{pod.surface}</span>
        </div>
        {pod.detail && <p className="truncate text-xs text-muted-foreground">{pod.detail}</p>}
      </div>
      {elapsed && <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">{elapsed}</span>}
    </div>
  );
}