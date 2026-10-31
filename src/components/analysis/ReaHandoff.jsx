import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal } from "lucide-react";
import CopyButton from "@/components/analysis/CopyButton";

const SETUP_CMD = "npx rea-agents@latest setup --all-detected";
const ANALYZE_CMD = 'rea analyze-javascript-application "<local-checkout-path>" --json';

function jobSpec(analysis) {
  return JSON.stringify(
    {
      target: analysis.url,
      title: analysis.title,
      summary: analysis.summary,
      objectives: [
        "Verify this logic map against the real implementation",
        "Flag dead code, duplicated modules and redundant data fetches",
        "Produce the module breakdown for the white-label clone",
      ],
      logic_map: analysis.logic_map || null,
      rebuild_prompt: analysis.rebuild_prompt || null,
    },
    null,
    2
  );
}

function CommandRow({ label, value, copyLabel }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <code className="mt-1 block break-all font-mono text-xs text-foreground">{value}</code>
      </div>
      <CopyButton getText={() => value} label={copyLabel} className="shrink-0" />
    </div>
  );
}

export default function ReaHandoff({ analysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Terminal className="w-5 h-5" />
          Continue in REA
        </CardTitle>
        <CardDescription>
          REVENGINE hands this dossier to the REA reverse-engineering agent. REA runs on your own machine, so run
          these there — the bundle carries this analysis and its rebuild prompt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <CommandRow label="1. Connect REA once" value={SETUP_CMD} copyLabel="Copy setup" />
        <CommandRow label="2. Analyze the checkout" value={ANALYZE_CMD} copyLabel="Copy command" />
        <CommandRow label="3. Hand over this dossier" value="rea-job.json" copyLabel="Copy job spec" />
        <div className="flex justify-end">
          <CopyButton getText={() => jobSpec(analysis)} label="Copy job JSON" copiedLabel="Job JSON copied" />
        </div>
      </CardContent>
    </Card>
  );
}