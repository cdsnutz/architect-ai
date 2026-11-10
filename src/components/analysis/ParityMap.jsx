import React from "react";
import { GitCompare } from "lucide-react";
import PodBlock from "@/components/analysis/PodBlock";
import CopyButton from "@/components/analysis/CopyButton";

export default function ParityMap({ map }) {
  const target = map?.target_mermaid;
  const mirror = map?.mirror_mermaid;
  const gaps = map?.gaps || [];

  if (!target && !mirror && !gaps.length) return null;

  return (
    <PodBlock title="Parity map · target vs mirror" icon={GitCompare}>
      {[
        { key: "Target", text: target },
        { key: "Mirror", text: mirror }
      ]
        .filter((d) => d.text)
        .map((d) => (
          <div key={d.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{d.key}</p>
              <CopyButton getText={() => d.text} label="Copy diagram" />
            </div>
            <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs">{d.text}</pre>
          </div>
        ))}

      {gaps.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Area</th>
                <th className="py-2 pr-3 font-medium">Target</th>
                <th className="py-2 pr-3 font-medium">Mirror</th>
                <th className="py-2 pr-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((g, i) => (
                <tr key={i} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-3 font-medium">{g.area}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{g.target_state}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{g.mirror_state}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{g.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PodBlock>
  );
}