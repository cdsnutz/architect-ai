import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlaskConical, Loader2, Lock } from "lucide-react";

export default function SkillCatalog({ packs, skills, focus, selectedPackId, onSelectPack, busy }) {
  const packList = Array.isArray(packs) ? packs : [];
  const skillList = Array.isArray(skills) ? skills : [];
  const visible = skillList.filter((skill) => focus === "custom" || skill.focus === focus);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4 text-primary" />
          Unconventional skills
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <Lock className="h-3 w-3" />
            read-only
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {packList.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-3">
            {packList.map((pack) => {
              const active = selectedPackId === pack.id;
              return (
                <button
                  key={pack.id}
                  type="button"
                  disabled={busy}
                  onClick={() => onSelectPack(pack)}
                  className={
                    "rounded-lg border p-3 text-left transition-colors disabled:opacity-60 " +
                    (active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-accent/40")
                  }
                >
                  <p className="flex items-center gap-1.5 text-xs font-semibold">
                    {pack.name}
                    {active && busy && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{pack.objective}</p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-primary">
                    {Array.isArray(pack.skills) ? pack.skills.length : 0} skills · run pack
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {visible.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Select a focus to see the skills it deploys.</p>
        ) : (
          <div className="divide-y divide-border/70">
            {visible.map((skill) => (
              <div key={skill.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{skill.name}</p>
                  {Array.isArray(skill.pods) &&
                    skill.pods.map((pod) => (
                      <Badge key={pod} variant="secondary" className="text-[9px] font-normal">
                        {pod}
                      </Badge>
                    ))}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-foreground/80">{skill.thesis}</p>
                <p className="mt-1 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  proves · {skill.proves}
                </p>
                <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  falsifier · {skill.falsifier}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}