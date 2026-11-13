import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eraser } from "lucide-react";

export default function SweepCard({ avoid, onAvoidChange, onRun, busy, result }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eraser className="h-4 w-4 text-primary" />
            Brand sweep
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Scans the deploy bundle and the handoff spec for the original's name, domain and colours.
          </p>
        </div>
        {result && (
          <Badge variant="outline" className={result.clean ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400"}>
            {result.clean ? "clean" : result.hits.length + " hits"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Names to avoid (comma separated)</span>
          <Input
            value={avoid}
            onChange={(event) => onAvoidChange(event.target.value)}
            placeholder="Original App, OriginalApp LLC"
            className="h-8 font-mono text-xs"
          />
        </label>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {result
              ? result.scanned + " artifacts scanned · " + (result.clean ? "nothing of the original left" : result.hits.length + " replacements needed")
              : "Sweep before launch. Any hit blocks the deploy gate."}
          </p>
          <Button size="sm" disabled={busy || !avoid.trim()} onClick={onRun}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run sweep"}
          </Button>
        </div>

        {result?.hits?.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-auto rounded bg-muted/40 p-2 font-mono text-[11px]">
            {result.hits.slice(0, 20).map((hit, index) => (
              <li key={index} className="flex gap-2">
                <span className="uppercase text-red-400">{hit.kind}</span>
                <span className="text-muted-foreground">{hit.file}{hit.line ? ":" + hit.line : ""}</span>
                <span>{hit.match}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}