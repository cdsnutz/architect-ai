import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Cable, Loader2, Rocket } from "lucide-react";
import ReplicaSkillBoard from "@/components/spec/ReplicaSkillBoard";
import CloneHandoff from "@/components/spec/CloneHandoff";

export default function CrossWirePanel({ authorized, busy, result, error, onRun }) {
  const [target, setTarget] = useState("");

  useEffect(() => {
    setTarget(authorized[0] || "");
  }, [authorized]);

  const capture = result?.capture;
  const replica = result?.spec?.replica;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cable className="h-4 w-4 text-primary" />
          Capture the site, build the clone
        </CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Pods crawl every authorized page, run the wired skills, compile the contracts into a spec, then score all eleven
          clone stages and write the handoff.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="h-9 flex-1 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="">{authorized.length ? "Pick an authorized host" : "No authorized host yet"}</option>
            {authorized.map((url) => (
              <option key={url} value={url}>
                {url}
              </option>
            ))}
          </select>
          <Button size="sm" disabled={busy || !target} onClick={() => onRun(target)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {busy ? "Capturing" : "Capture + clone"}
          </Button>
        </div>

        {error && (
          <p className="flex items-start gap-2 rounded border border-destructive/40 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        {capture && (
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-muted-foreground sm:grid-cols-4">
            <span>{capture.page_count} pages</span>
            <span>{capture.route_paths.length} routes</span>
            <span>{capture.forms.length} forms</span>
            <span>{capture.bundles.length} bundles</span>
            <span className="col-span-2 sm:col-span-4">{capture.limits}</span>
          </div>
        )}

        {replica && <ReplicaSkillBoard stages={replica.stages} counts={replica.stage_counts} />}
        {replica?.clone_handoff && <CloneHandoff handoff={replica.clone_handoff} />}

        {result?.spec && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/spec">Open the compiled spec</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}