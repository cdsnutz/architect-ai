import React from "react";
import { Badge } from "@/components/ui/badge";
import { GitBranch } from "lucide-react";
import PodBlock from "@/components/analysis/PodBlock";

const COLUMNS = ["Current state", "Trigger", "Action", "Next state", "Endpoint", "Table"];

function cell(row) {
  return [
    row.current_state || row.from_state,
    row.trigger,
    row.action,
    row.next_state || row.to_state,
    row.endpoint,
    row.table,
  ];
}

export default function StateTransitionTable({ transitions = [] }) {
  if (!transitions.length) return null;

  return (
    <PodBlock title="State transition matrix" icon={GitBranch}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              {COLUMNS.map((c) => (
                <th key={c} className="py-2 pr-3 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transitions.map((t, i) => (
              <tr key={i} className="border-b border-border/50 align-top">
                {cell(t).map((value, j) => (
                  <td key={j} className="py-2 pr-3">
                    {j === 0 || j === 3 ? (
                      <Badge variant="outline" className="font-mono text-xs font-normal">
                        {value || "—"}
                      </Badge>
                    ) : j === 1 || j === 4 ? (
                      <span className="font-mono">{value || "—"}</span>
                    ) : (
                      <span className="text-muted-foreground">{value || "—"}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Entity: {[...new Set(transitions.map((t) => t.entity))].join(", ")} · each row is one edge of the object lifecycle.
      </p>
    </PodBlock>
  );
}