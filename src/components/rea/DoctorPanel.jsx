import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Stethoscope } from "lucide-react";

const VARIANT = { pass: "secondary", warn: "outline", fail: "destructive" };

export default function DoctorPanel() {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("reaTools", { action: "doctor" });
      setResult(response.data);
    } catch (err) {
      setError((err && err.response && err.response.data && err.response.data.error) || "The doctor pass could not run.");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Stethoscope className="w-4 h-4" />
            Doctor
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Checks the pod registry, your agent token, pod telemetry, dossier coverage and the mapping engine against
            this app's live data.
          </p>
        </div>
        <Button onClick={run} disabled={busy} size="sm" variant="outline" className="shrink-0">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Run checks
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {result && (
        <div className="divide-y rounded-lg border">
          {result.rows.map((row) => (
            <div key={row.key} className="flex items-start gap-3 px-3 py-2">
              <Badge variant={VARIANT[row.status] || "outline"} className="mt-0.5 shrink-0 text-[10px] uppercase">
                {row.status}
              </Badge>
              <div className="min-w-0">
                <p className="text-sm">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}