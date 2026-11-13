/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ListChecks } from "lucide-react";

export default function ParityCard({ matrix, onMatrixChange, onDerive, onRun, busy, result }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-primary" />
            Parity matrix
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Feature matrix from the recon map. Must 3, should 2, could 1; partial counts half; skips are never scored.
          </p>
        </div>
        {result && (
          <Badge variant="outline" className={result.must_have_done === result.must_have_total ? "border-emerald-500/40 text-emerald-400" : "border-amber-500/40 text-amber-400"}>
            {result.feature_score}/100
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={matrix}
          onChange={(event) => onMatrixChange(event.target.value)}
          placeholder={"feature,area,priority,original,clone,notes\nreschedule a booking,booking page,must,yes,partial,reschedule endpoint not captured"}
          className="min-h-32 font-mono text-[11px]"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {result
              ? "Must-haves " + result.must_have_done + "/" + result.must_have_total + " · " + result.counted + " counted · " + result.missing.length + " missing"
              : "Derive a matrix from the captured contracts, then edit it as you build."}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={onDerive}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Derive from contracts"}
            </Button>
            <Button size="sm" disabled={busy || !matrix.trim()} onClick={onRun}>
              Score parity
            </Button>
          </div>
        </div>

        {result?.missing?.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-auto rounded bg-muted/40 p-2 text-[11px]">
            {result.missing.slice(0, 12).map((item, index) => (
              <li key={index} className="flex gap-2">
                <span className="font-mono uppercase text-primary">{item.priority}</span>
                <span className="text-muted-foreground">{item.area || "-"}:</span>
                <span>{item.feature}</span>
                <span className="text-muted-foreground">({item.clone})</span>
              </li>
            ))}
          </ul>
        )}

        {result?.problems?.length > 0 && (
          <p className="text-[11px] text-amber-400">{result.problems.length} matrix rows need fixing; see the row notes.</p>
        )}
      </CardContent>
    </Card>
  );
}