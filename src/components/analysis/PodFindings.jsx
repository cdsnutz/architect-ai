import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Braces, GitBranch, Plug, Workflow } from "lucide-react";
import CopyButton from "@/components/analysis/CopyButton";

function Block({ title, icon: Icon, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export default function PodFindings({ analysis }) {
  const contracts = analysis.api_contracts || [];
  const schema = analysis.inferred_schema || [];
  const flows = analysis.logic_flows || [];
  const transitions = analysis.state_transitions || [];
  const findings = analysis.pod_findings || [];

  if (!contracts.length && !schema.length && !flows.length && !transitions.length && !findings.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      {findings.length > 0 && (
        <Block title="Pod ledger" icon={Workflow}>
          {findings.map((f, i) => (
            <div key={i} className="border-l-2 border-primary/20 pl-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                {f.finding}
                <Badge variant={f.confidence === "observed" ? "default" : "secondary"} className="text-xs">
                  {f.confidence}
                </Badge>
              </p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{f.pod}</p>
              <p className="text-sm text-muted-foreground">{f.evidence}</p>
            </div>
          ))}
        </Block>
      )}

      {contracts.length > 0 && (
        <Block title="API contracts (inferred)" icon={Plug}>
          {contracts.map((c, i) => (
            <div key={i} className="border-l-2 border-primary/20 pl-4">
              <p className="font-mono text-sm">
                {c.method} {c.endpoint}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Request:</span> {c.request_shape}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Response:</span> {c.response_shape}
              </p>
              <p className="text-xs text-muted-foreground">Evidence: {c.evidence}</p>
            </div>
          ))}
        </Block>
      )}

      {schema.length > 0 && (
        <Block title="Inferred schema" icon={Braces}>
          {schema.map((s, i) => (
            <div key={i} className="border-l-2 border-primary/20 pl-4">
              <p className="font-mono text-sm">{s.table}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(s.columns || []).map((col, j) => (
                  <Badge key={j} variant="outline" className="font-mono text-xs font-normal">
                    {col.name}: {col.type}
                  </Badge>
                ))}
              </div>
              {s.keys && s.keys.length > 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">Keys: {s.keys.join(", ")}</p>
              )}
              {s.relations && s.relations.length > 0 && (
                <p className="text-xs text-muted-foreground">Relations: {s.relations.join(", ")}</p>
              )}
            </div>
          ))}
        </Block>
      )}

      {transitions.length > 0 && (
        <Block title="State transitions" icon={GitBranch}>
          {transitions.map((t, i) => (
            <p key={i} className="text-sm">
              <span className="font-medium">{t.entity}</span>{" "}
              <span className="text-muted-foreground">
                {t.from_state} → {t.to_state}
              </span>{" "}
              <span className="text-xs text-muted-foreground">on {t.trigger}</span>
            </p>
          ))}
        </Block>
      )}

      {flows.length > 0 && (
        <Block title="Logic flows" icon={Workflow}>
          {flows.map((f, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{f.name}</p>
                <CopyButton getText={() => f.mermaid} label="Copy diagram" className="shrink-0" />
              </div>
              <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs">
                {f.mermaid}
              </pre>
            </div>
          ))}
        </Block>
      )}
    </div>
  );
}