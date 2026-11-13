/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CopyButton from "@/components/analysis/CopyButton";

const COMPONENTS = {
  h1: (props) => <h1 className="mt-4 font-display text-xl font-bold" {...props} />,
  h2: (props) => <h2 className="mt-6 border-b border-border pb-1 font-display text-base font-semibold" {...props} />,
  p: (props) => <p className="text-sm leading-relaxed text-muted-foreground" {...props} />,
  li: (props) => <li className="ml-4 list-disc text-sm text-muted-foreground" {...props} />,
  code: (props) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground" {...props} />,
  table: (props) => <div className="overflow-x-auto"><table className="w-full text-left text-xs" {...props} /></div>,
  th: (props) => <th className="border-b py-1.5 pr-3 font-medium text-foreground" {...props} />,
  td: (props) => <td className="border-b border-border/50 py-1.5 pr-3 align-top" {...props} />
};

export default function SpecViewer({ spec }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-base">Claude Code handoff</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Compiled from {spec.contract_counts?.api_contracts || 0} contracts · {spec.contract_counts?.inferred_schema || 0} tables · {spec.contract_counts?.ledger_traces || 0} traces
          </p>
        </div>
        <CopyButton getText={() => spec.spec_markdown || ""} label="Copy spec" className="shrink-0" />
      </CardHeader>
      <CardContent>
        <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-2">
          <ReactMarkdown components={COMPONENTS}>{spec.spec_markdown || ""}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}