import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Contrast, Loader2 } from "lucide-react";

export default function ContrastCard({ tokens, onTokensChange, onRun, busy, result }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Contrast className="h-4 w-4 text-primary" />
            Design contrast
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            WCAG 2.2 on the design tokens: normal text 4.5, large text 3, UI parts 3. Optional until a palette exists.
          </p>
        </div>
        {result && (
          <Badge variant="outline" className={result.clean ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400"}>
            {result.failing}/{result.pairs} fail
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={tokens}
          onChange={(event) => onTokensChange(event.target.value)}
          placeholder={'{ "color": { "text": { "base": "#e8ebee" }, "bg": { "base": "#0e1015" } }, "pairs": [["text-base", "bg-base"]] }'}
          className="min-h-24 font-mono text-[11px]"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {result ? result.failing + " of " + result.pairs + " pairs fail AA" : "Paste the token file from the design step to check it."}
          </p>
          <Button size="sm" disabled={busy || !tokens.trim()} onClick={onRun}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check contrast"}
          </Button>
        </div>

        {result?.rows?.some((row) => !row.aa || row.error) && (
          <ul className="max-h-32 space-y-1 overflow-auto rounded bg-muted/40 p-2 font-mono text-[11px]">
            {result.rows
              .filter((row) => !row.aa || row.error)
              .slice(0, 10)
              .map((row, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-red-400">{row.error ? "unknown" : row.ratio + ":1"}</span>
                  <span className="text-muted-foreground">{row.fg} on {row.bg}</span>
                </li>
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}