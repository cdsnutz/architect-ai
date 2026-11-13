/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CopyButton from "@/components/analysis/CopyButton";
import { FileText } from "lucide-react";

export default function CloneHandoff({ handoff }) {
  if (!handoff) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            1:1 clone handoff
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Every stage written out. Paste it into Claude Code with the deploy bundle to build the clone.
          </p>
        </div>
        <CopyButton getText={() => handoff} label="Copy handoff" className="shrink-0" />
      </CardHeader>
      <CardContent>
        <pre className="max-h-72 overflow-auto rounded bg-muted/40 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
          {handoff}
        </pre>
      </CardContent>
    </Card>
  );
}