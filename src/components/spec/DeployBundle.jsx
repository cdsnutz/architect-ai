import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket } from "lucide-react";
import CopyButton from "@/components/analysis/CopyButton";

export default function DeployBundle({ spec }) {
  const files = Array.isArray(spec.deploy_bundle) ? spec.deploy_bundle : [];
  const [active, setActive] = useState(files[0]?.path || "");
  const current = files.find((file) => file.path === active) || files[0];

  if (!files.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="h-4 w-4 text-primary" />
          Deploy bundle
        </CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          Railway, Neon and Fly.io configs. Deploys run from your own accounts.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => setActive(file.path)}
              className={`rounded border px-2 py-1 font-mono text-[11px] transition-colors ${
                current?.path === file.path
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {file.path}
            </button>
          ))}
        </div>

        {current && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{current.note}</p>
              <CopyButton getText={() => current.content} label="Copy file" className="shrink-0" />
            </div>
            <pre className="max-h-72 overflow-auto rounded bg-muted/50 p-3 font-mono text-[11px] leading-relaxed">
              {current.content}
            </pre>
          </div>
        )}
        <Badge variant="outline" className="text-[10px]">commands for each target are in DEPLOY.md</Badge>
      </CardContent>
    </Card>
  );
}