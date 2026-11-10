import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Radar, ShieldCheck } from "lucide-react";

function Section({ label, children }) {
  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

export default function PlanReview({ record, authorized, onToggleTarget, onRun, running }) {
  const plan = record.plan || {};
  const targets = Array.isArray(plan.targets) ? plan.targets : [];
  const steps = Array.isArray(plan.probe_steps) ? plan.probe_steps : [];
  const canRun = authorized.length > 0 && !running;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Radar className="h-4 w-4 text-primary" />
          Reviewable plan
          <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
            {record.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Section label="Restated intent">
          <p className="text-sm leading-relaxed text-foreground/90">{plan.intent || record.request}</p>
        </Section>

        {targets.length > 0 && (
          <Section label={"Authorize targets · " + authorized.length + " of " + targets.length}>
            <div className="space-y-2">
              {targets.map((target) => {
                const on = authorized.includes(target.url);
                return (
                  <button
                    key={target.url}
                    type="button"
                    onClick={() => onToggleTarget(target.url)}
                    className={
                      "flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors " +
                      (on ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/30")
                    }
                  >
                    <span
                      className={
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border " +
                        (on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50")
                      }
                    >
                      {on && <ShieldCheck className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-xs text-foreground">{target.url}</span>
                      {target.why && <span className="mt-0.5 block text-[11px] text-muted-foreground">{target.why}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {Array.isArray(plan.questions) && plan.questions.length > 0 && (
          <Section label="Questions this answers">
            <ul className="space-y-1 text-sm text-foreground/85">
              {plan.questions.map((question, index) => (
                <li key={index} className="flex gap-2">
                  <span className="font-mono text-[11px] text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {steps.length > 0 && (
          <Section label="Read-only probe steps">
            <ol className="space-y-1.5">
              {steps.map((step, index) => (
                <li key={index} className="rounded-lg border border-border/70 bg-background/40 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {step.method}
                    </span>
                    <span className="text-xs font-medium">{step.step}</span>
                  </div>
                  {step.target && <p className="mt-1 truncate font-mono text-[11px] text-primary/90">{step.target}</p>}
                  {step.why && <p className="mt-1 text-[11px] text-muted-foreground">{step.why}</p>}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {(Array.isArray(plan.skills) && plan.skills.length > 0) || (Array.isArray(plan.pods) && plan.pods.length > 0) ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.isArray(plan.pods) && plan.pods.length > 0 && (
              <Section label="Pods">
                <div className="flex flex-wrap gap-1.5">
                  {plan.pods.map((pod) => (
                    <Badge key={pod} variant="secondary" className="text-[10px] font-normal">
                      {pod}
                    </Badge>
                  ))}
                </div>
              </Section>
            )}
            {Array.isArray(plan.skills) && plan.skills.length > 0 && (
              <Section label="Skills deployed">
                <div className="flex flex-wrap gap-1.5">
                  {plan.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-[10px] font-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Section>
            )}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            GET and HEAD only · no cookies · no writes · approved hosts only
          </p>
          <Button onClick={onRun} disabled={!canRun} className="gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
            {running ? "Running probes" : "Approve and run"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}