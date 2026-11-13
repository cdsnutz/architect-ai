/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ReaWorkflowList({ workflows = [], analysis, onValidated }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runValidation = async () => {
    if (!analysis || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("reaValidate", { analysis_id: analysis.id });
      setResult(response.data);
      const updated = await base44.entities.SiteAnalysis.get(analysis.id);
      if (onValidated) onValidated(updated);
    } catch (err) {
      setError(
        (err && err.response && err.response.data && err.response.data.error) ||
          (err && err.message) ||
          "Validation failed."
      );
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {workflows.map((flow) => (
          <div key={flow.name} className="rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{flow.name}</p>
              <Badge variant="outline" className="text-[10px] uppercase">
                {flow.trigger}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{flow.detail}</p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">{flow.steps.join(" → ")}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Validation pass</p>
            <p className="text-xs text-muted-foreground">
              {analysis
                ? "Scores parity on the open dossier and separates verified claims from inference."
                : "Open a dossier to run the validation pass."}
            </p>
          </div>
          <Button size="sm" className="gap-2" onClick={runValidation} disabled={!analysis || busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {busy ? "Validating..." : "Run validation"}
          </Button>
        </div>

        {error && (
          <p className="mt-3 flex items-start gap-2 text-xs text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}

        {result && (
          <div className="mt-3 space-y-1 border-t pt-3 text-xs">
            <p className="flex items-center gap-2 font-medium">
              Verdict: <span className="text-primary">{result.verdict}</span>
              <span className="text-muted-foreground">· parity {result.parity_score}/100</span>
            </p>
            {result.validation && result.validation.rationale && (
              <p className="text-muted-foreground">{result.validation.rationale}</p>
            )}
            {result.validation && result.validation.unverified_claims && result.validation.unverified_claims.length > 0 && (
              <p className="text-muted-foreground">
                {result.validation.unverified_claims.length} unverified claim
                {result.validation.unverified_claims.length === 1 ? "" : "s"} · next probe: {result.validation.next_probe}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}