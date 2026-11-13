/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Activity, Loader2 } from "lucide-react";

const METRICS = [
  { key: "build_seconds", label: "Build s" },
  { key: "test_passed", label: "Tests passed" },
  { key: "test_failed", label: "Tests failed" },
  { key: "endpoints_total", label: "Endpoints" },
  { key: "endpoints_ok", label: "Endpoints ok" },
  { key: "p95_latency_ms", label: "p95 ms" }
];

const TONE = {
  pass: "border-emerald-500/40 text-emerald-400",
  degraded: "border-amber-500/40 text-amber-400",
  fail: "border-red-500/40 text-red-400"
};

export default function RunCapture({ spec, onCapture, busy }) {
  const [stdout, setStdout] = useState("");
  const [exitCode, setExitCode] = useState("0");
  const [metrics, setMetrics] = useState({});
  const perf = spec.performance;
  const hasInput = stdout.trim().length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Capture run output
        </CardTitle>
        {perf && (
          <Badge variant="outline" className={TONE[perf.verdict] || ""}>
            {perf.verdict} · {perf.tests?.pass_rate ?? "—"}% tests
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {METRICS.map((metric) => (
            <label key={metric.key} className="space-y-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{metric.label}</span>
              <Input
                type="number"
                inputMode="numeric"
                value={metrics[metric.key] ?? ""}
                onChange={(event) => setMetrics({ ...metrics, [metric.key]: event.target.value })}
                className="h-8 font-mono text-xs"
              />
            </label>
          ))}
        </div>

        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Exit code</span>
          <Input
            type="number"
            value={exitCode}
            onChange={(event) => setExitCode(event.target.value)}
            className="h-8 w-24 font-mono text-xs"
          />
        </label>

        <Textarea
          value={stdout}
          onChange={(event) => setStdout(event.target.value)}
          placeholder={"\u0070aste the build / test / probe transcript here"}
          className="min-h-32 font-mono text-xs"
        />

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {perf ? "Last capture " + new Date(perf.captured_at).toLocaleString() : "No run captured yet."}
          </p>
          <Button
            size="sm"
            disabled={!hasInput || busy}
            onClick={() => onCapture({ spec_id: spec.id, stdout, exit_code: Number(exitCode) || 0, metrics })}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Capture run"}
          </Button>
        </div>

        {spec.run_output?.stdout && (
          <pre className="max-h-48 overflow-auto rounded bg-muted/50 p-3 font-mono text-[11px] leading-relaxed">
            {spec.run_output.stdout}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}