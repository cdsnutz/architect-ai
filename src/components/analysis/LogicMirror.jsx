import React from "react";
import { Braces } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PodBlock from "@/components/analysis/PodBlock";

const VARIANT = { observed: "default", inferred: "secondary", unverified: "outline" };

export default function LogicMirror({ mirrors = [] }) {
  if (!mirrors.length) return null;

  return (
    <PodBlock title="Cognitive logic mirror" icon={Braces}>
      {mirrors.map((m, i) => (
        <div key={i} className="border-l-2 border-primary/20 pl-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{m.name}</p>
            <Badge variant={VARIANT[m.confidence] || "outline"} className="text-xs">
              {m.confidence}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Input: <span className="font-mono">{m.input}</span></p>
          <pre className="mt-1.5 overflow-x-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs">{m.rule}</pre>
          <p className="mt-1 text-xs text-muted-foreground">
            Output: <span className="font-mono">{m.output}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Parity check: {m.parity_check}</p>
        </div>
      ))}
    </PodBlock>
  );
}