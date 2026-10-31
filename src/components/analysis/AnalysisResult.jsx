import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout, Database, Plug, GitBranch, AlertTriangle, Eye, Globe } from "lucide-react";
import CopyButton from "@/components/analysis/CopyButton";
import { logicMapToText } from "@/lib/clipboard";

const severityColor = { high: "destructive", medium: "default", low: "secondary" };

function Section({ icon: Icon, title, count, children }) {
  if (!count) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5" />
          {title}
          <Badge variant="secondary">{count}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export default function AnalysisResult({ analysis }) {
  const map = analysis.logic_map || {};
  const groups = map.page_structure || [];
  const entities = map.data_entities || [];
  const apis = map.api_integrations || [];
  const flows = map.user_flows || [];
  const bottlenecks = map.bottlenecks || [];
  const ux = map.ux_issues || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5 shrink-0" />
                <span className="truncate">{analysis.title}</span>
              </CardTitle>
              <a href={analysis.url} target="_blank" rel="noreferrer" className="block text-sm text-blue-600 hover:underline break-all">
                {analysis.url}
              </a>
            </div>
            <CopyButton getText={() => logicMapToText(analysis)} label="Copy logic map" className="shrink-0" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
        </CardContent>
      </Card>

      <Section icon={Layout} title="Page / Section Structure" count={groups.length}>
        {groups.map((g, i) => (
          <div key={i} className="border-l-2 border-primary/20 pl-4">
            <p className="font-medium text-sm">{g.name}</p>
            <p className="text-sm text-muted-foreground">{g.purpose}</p>
            {g.key_elements && g.key_elements.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {g.key_elements.map((el, j) => (
                  <Badge key={j} variant="outline" className="text-xs font-normal">{el}</Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </Section>

      <Section icon={Database} title="Data Entities (inferred)" count={entities.length}>
        {entities.map((e, i) => (
          <div key={i} className="border-l-2 border-primary/20 pl-4">
            <p className="font-medium text-sm">{e.name}</p>
            <p className="text-sm text-muted-foreground">{e.purpose}</p>
            {e.likely_fields && e.likely_fields.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {e.likely_fields.map((f, j) => (
                  <Badge key={j} variant="outline" className="text-xs font-normal">{f}</Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </Section>

      <Section icon={Plug} title="APIs & Integrations (inferred)" count={apis.length}>
        {apis.map((a, i) => (
          <div key={i} className="border-l-2 border-primary/20 pl-4">
            <p className="font-medium text-sm">{a.name}</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Evidence:</span> {a.evidence} — {a.purpose}
            </p>
          </div>
        ))}
      </Section>

      <Section icon={GitBranch} title="User Flows" count={flows.length}>
        {flows.map((f, i) => (
          <div key={i} className="border-l-2 border-primary/20 pl-4">
            <p className="font-medium text-sm">{f.name}</p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground mt-1 space-y-0.5">
              {f.steps.map((s, j) => (
                <li key={j}>{s}</li>
              ))}
            </ol>
          </div>
        ))}
      </Section>

      <Section icon={AlertTriangle} title="Bottlenecks & Code Smells" count={bottlenecks.length}>
        {bottlenecks.map((b, i) => (
          <div key={i} className="border-l-2 border-primary/20 pl-4">
            <p className="font-medium text-sm flex items-center gap-2">
              {b.area}
              <Badge variant={severityColor[b.severity] || "secondary"} className="text-xs capitalize">{b.severity}</Badge>
            </p>
            <p className="text-sm text-muted-foreground">{b.issue}</p>
            {b.suggestion && <p className="text-sm mt-1"><span className="font-medium">Fix:</span> {b.suggestion}</p>}
          </div>
        ))}
      </Section>

      <Section icon={Eye} title="UX / Accessibility Gaps" count={ux.length}>
        {ux.map((u, i) => (
          <div key={i} className="border-l-2 border-primary/20 pl-4">
            <p className="font-medium text-sm">{u.area}</p>
            <p className="text-sm text-muted-foreground">{u.issue}</p>
            {u.suggestion && <p className="text-sm mt-1"><span className="font-medium">Suggestion:</span> {u.suggestion}</p>}
          </div>
        ))}
      </Section>
    </div>
  );
}