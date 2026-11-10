import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal } from "lucide-react";
import CopyButton from "@/components/analysis/CopyButton";

const SETUP_CMD = "npx rea-agents@latest setup --client claude_code";
const VERIFY_CMD = "npx rea-agents@latest doctor";
const ANALYZE_CMD = 'npx -y rea-agents@latest analyze-javascript-application "<local-checkout-path>" --json';

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
          Connect, doctor, the source-level analyze pass and the job spec now run inside this app — open the REA layer
          and choose Run. The local CLI commands below still work if you would rather run them on your machine. The
          bundle carries this analysis and its rebuild prompt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <CommandRow label="1. Connect REA once (approve the plan)" value={SETUP_CMD} copyLabel="Copy setup" />
        <CommandRow label="2. Verify the connection — expect all checks passing" value={VERIFY_CMD} copyLabel="Copy check" />
        <CommandRow label="3. Analyze the checkout" value={ANALYZE_CMD} copyLabel="Copy command" />
        <CommandRow label="4. Hand over this dossier" value="rea-job.json" copyLabel="Copy job spec" />
        <div className="flex justify-end">
          <CopyButton getText={() => jobSpec(analysis)} label="Copy job JSON" copiedLabel="Job JSON copied" />
        </div>
      </CardContent>
    </Card>
  );
}