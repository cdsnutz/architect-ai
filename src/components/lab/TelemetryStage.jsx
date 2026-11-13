import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

const DOT = {
  queued: "bg-muted-foreground/40",
  running: "bg-primary animate-pulse",
  complete: "bg-emerald-500",
  needs_input: "bg-amber-500",
  skipped: "bg-muted-foreground/40",
  failed: "bg-destructive"
};

const VERDICT = {
  pass: "text-emerald-400",
  attention: "text-amber-400",
  declined: "text-red-400",
  timeout: "text-amber-400"
};

function VerdictRow({ verdict }) {
  return (
    <li className="space-y-0.5 text-[11px] leading-relaxed">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{verdict.stage}</span>
        <span className={"font-mono text-[10px] uppercase " + (VERDICT[verdict.verdict] || "text-muted-foreground")}>
          {verdict.verdict}
        </span>
        {verdict.conversation_id ? (
          <Link
            to={
              "/verdict?conversation=" + verdict.conversation_id +
              "&agent=" + (verdict.agent || "") +
              "&stage=" + (verdict.stage || "")
            }
            className="inline-flex items-center gap-1 text-[10px] font-medium text-primary underline-offset-2 hover:underline"
          >
            {verdict.agent}
            <ExternalLink className="h-3 w-3" />
          </Link>
        ) : (
          <span className="text-[10px] text-muted-foreground">{verdict.agent}</span>
        )}
      </div>
      <p className="text-muted-foreground">{verdict.note}</p>
    </li>
  );
}

export default function TelemetryStage({ stage }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-1">
        <span className={"h-2 w-2 rounded-full " + (DOT[stage.status] || DOT.queued)} />
        <span className="mt-1 w-px flex-1 bg-border" />
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{stage.label}</p>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{stage.status}</span>
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
        {Array.isArray(stage.verdicts) && stage.verdicts.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 border-t border-border/50 pt-1.5">
            {stage.verdicts.map((verdict) => (
              <VerdictRow key={verdict.stage} verdict={verdict} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}