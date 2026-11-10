import React from "react";
import { Badge } from "@/components/ui/badge";
import { Braces } from "lucide-react";
import PodBlock from "@/components/analysis/PodBlock";

export default function InferredSchema({ schema = [] }) {
  if (!schema.length) return null;

  return (
    <PodBlock title="Inferred schema (type-inferred)" icon={Braces}>
      {schema.map((s, i) => (
        <div key={i} className="border-l-2 border-primary/20 pl-4">
          <p className="font-mono text-sm">{s.table}</p>
          {s.purpose && <p className="text-xs text-muted-foreground">{s.purpose}</p>}
          <div className="mt-2 space-y-1.5">
            {(s.columns || []).map((col, j) => (
              <div key={j}>
                <p className="font-mono text-xs">
                  <span className="text-foreground">{col.name}</span>
                  <span className="text-muted-foreground"> : {col.type}</span>
                </p>
                {(col.constraints || []).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {col.constraints.map((c, k) => (
                      <Badge key={k} variant="secondary" className="text-xs font-normal">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
                {col.evidence && <p className="mt-0.5 text-xs text-muted-foreground">Evidence: {col.evidence}</p>}
              </div>
            ))}
          </div>
          {s.keys && s.keys.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">Keys: {s.keys.join(", ")}</p>
          )}
          {s.relations && s.relations.length > 0 && (
            <p className="text-xs text-muted-foreground">Relations: {s.relations.join(", ")}</p>
          )}
          {s.written_by && s.written_by.length > 0 && (
            <p className="text-xs text-muted-foreground">Written by: {s.written_by.join(", ")}</p>
          )}
        </div>
      ))}
    </PodBlock>
  );
}