import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import CopyButton from "@/components/analysis/CopyButton";
import { Download, ScrollText, ShieldAlert, Target } from "lucide-react";

function Column({ title, items, tone }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div>
      <p className={"font-mono text-[10px] uppercase tracking-[0.2em] " + tone}>{title}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2 text-[11px] leading-relaxed text-foreground/85">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DossierPanel({ run, onToggleCapabilityGap, onExport }) {
  if (!run) return null;
  const dossier = run.dossier || {};

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <ScrollText className="h-4 w-4 text-primary" />
          Challenge dossier
          <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
            {run.pack_name}
          </Badge>
          <span className="ml-auto flex items-center gap-2">
            <CopyButton label="Copy spec" getText={() => JSON.stringify(run.dossier || {}, null, 2)} />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onExport}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dossier.verdict && (
          <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Verdict</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{dossier.verdict}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Column title="Observed" items={dossier.observed} tone="text-emerald-400" />
          <Column title="Inferred, not observed" items={dossier.inferred} tone="text-amber-400" />
        </div>

        {Array.isArray(dossier.skill_results) && dossier.skill_results.length > 0 && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Skill results · {dossier.skill_results.length}
            </p>
            <div className="mt-1.5 space-y-1.5">
              {dossier.skill_results.map((result, index) => (
                <div key={index} className="rounded-lg border border-border/70 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-primary">{result.skill}</span>
                    <Badge
                      variant="outline"
                      className={
                        "text-[9px] uppercase tracking-wider " +
                        (result.observed ? "border-emerald-500/50 text-emerald-400" : "border-amber-500/50 text-amber-400")
                      }
                    >
                      {result.observed ? "reproduced" : "not reproduced"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-foreground/85">{result.signal}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Column title="Falsifiers" items={dossier.falsifiers} tone="text-destructive" />
          <Column title="Risks" items={dossier.risks} tone="text-muted-foreground" />
        </div>

        {Array.isArray(dossier.next_probes) && dossier.next_probes.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <Target className="h-3 w-3" />
              Next probes
            </p>
            <ol className="mt-1.5 space-y-1">
              {dossier.next_probes.map((probe, index) => (
                <li key={index} className="flex gap-2 text-[11px] leading-relaxed text-foreground/85">
                  <span className="font-mono text-[10px] text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <span>{probe}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/40 px-3 py-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">Did this challenge expose a capability gap?</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Recorded with the run so the lab tracks where the engine cannot reach.
            </p>
          </div>
          <Switch checked={Boolean(run.capability_gap)} onCheckedChange={onToggleCapabilityGap} />
        </div>
      </CardContent>
    </Card>
  );
}