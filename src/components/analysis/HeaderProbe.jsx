import React from "react";
import { Badge } from "@/components/ui/badge";
import { Radar } from "lucide-react";
import PodBlock from "@/components/analysis/PodBlock";

const VARIANT = {
  changed: "default",
  status_changed: "default",
  same: "secondary",
  error: "outline",
};

export default function HeaderProbe({ results = [] }) {
  if (!results.length) return null;

  return (
    <PodBlock title="Header probe (observed)" icon={Radar}>
      {results.map((r, i) => (
        <div key={i} className="border-l-2 border-primary/20 pl-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm break-all">{r.url}</p>
            <Badge variant={VARIANT[r.verdict] || "outline"} className="text-xs">
              {r.verdict}
            </Badge>
          </div>
          <div className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
            <p>
              HTML request: {r.baseline ? `${r.baseline.status} · ${r.baseline.content_type || "unknown"} · ${r.baseline.bytes}b` : "no response"}
            </p>
            <p>
              XHR request: {r.variant ? `${r.variant.status} · ${r.variant.content_type || "unknown"} · ${r.variant.bytes}b` : "no response"}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{r.note}</p>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Anonymous GET only — no cookies, credentials or payloads, and no state-changing paths.
      </p>
    </PodBlock>
  );
}