import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/analysis/CopyButton";
import { GitBranch, Telescope } from "lucide-react";

function Finding({ finding }) {
  const observed = Boolean(finding.observed);
  const evidence = Array.isArray(finding.evidence) ? finding.evidence : [];

  return (
    <div className="rounded-lg border border-border/80 bg-background/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={
            "text-[10px] uppercase tracking-wider " +
            (observed ? "border-emerald-500/50 text-emerald-400" : "border-amber-500/50 text-amber-400")
          }
        >
          {observed ? "observed" : "inferred"}
        </Badge>
        <span className="font-mono text-[11px] text-primary">{finding.skill}</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">{finding.pod}</span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{finding.claim}</p>

      {finding.confidence !== undefined && finding.confidence !== null && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 w-24 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-primary" style={{ width: Math.max(0, Math.min(100, finding.confidence)) + "%" }} />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">{finding.confidence}% confidence</span>
        </div>
      )}

      {evidence.length > 0 && (
        <ul className="mt-2 space-y-1">
          {evidence.map((item, index) => (
            <li key={index} className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
              <span className="break-words">{item}</span>
            </li>
          ))}
        </ul>
      )}

      {finding.gap && (
        <p className="mt-2 rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[11px] text-amber-300">
          Gap: {finding.gap}
        </p>
      )}
      {finding.next_probe && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          <span className="font-mono uppercase tracking-wider">next probe · </span>
          {finding.next_probe}
        </p>
      )}
    </div>
  );
}

export default function FindingsBoard({ request }) {
  const findings = Array.isArray(request.findings) ? request.findings : [];
  if (findings.length === 0) return null;

  const observed = findings.filter((finding) => finding.observed).length;
  const gaps = Array.isArray(request.gaps) ? request.gaps : [];
  const unverified = Array.isArray(request.unverified) ? request.unverified : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Telescope className="h-4 w-4 text-primary" />
          Pod findings
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {observed} observed · {findings.length - observed} inferred
          </span>
          <span className="ml-auto">
            <CopyButton
              label="Copy findings"
              getText={() =>
                findings
                  .map(
                    (finding) =>
                      "[" + (finding.observed ? "observed" : "inferred") + "] " + finding.skill + " — " + finding.claim +
                      (finding.evidence && finding.evidence.length ? "\n  evidence: " + finding.evidence.join(" | ") : "")
                  )
                  .join("\n")
              }
            />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {request.summary && (
          <p className="text-sm leading-relaxed text-foreground/90">{request.summary}</p>
        )}

        {typeof request.confidence === "number" && (
          <p className="text-xs text-muted-foreground">
            Overall confidence <span className="font-mono text-foreground">{request.confidence}%</span>
          </p>
        )}

        <div className="space-y-2">
          {findings.map((finding, index) => (
            <Finding key={index} finding={finding} />
          ))}
        </div>

        {(gaps.length > 0 || unverified.length > 0) && (
          <div className="grid gap-3 border-t border-border/70 pt-3 sm:grid-cols-2">
            {gaps.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">
                  <GitBranch className="h-3 w-3" />
                  Capability gaps
                </p>
                <ul className="mt-1.5 space-y-1">
                  {gaps.map((gap, index) => (
                    <li key={index} className="text-[11px] leading-relaxed text-muted-foreground">{gap}</li>
                  ))}
                </ul>
              </div>
            )}
            {unverified.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Not observable
                </p>
                <ul className="mt-1.5 space-y-1">
                  {unverified.map((item, index) => (
                    <li key={index} className="text-[11px] leading-relaxed text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}