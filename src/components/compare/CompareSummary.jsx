/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitCompare } from "lucide-react";

const METRICS = [
  { key: "page_structure", label: "Pages / sections", betterWhen: "up" },
  { key: "data_entities", label: "Data entities", betterWhen: "up" },
  { key: "api_integrations", label: "Integrations", betterWhen: "up" },
  { key: "user_flows", label: "User flows", betterWhen: "up" },
  { key: "bottlenecks", label: "Bottlenecks", betterWhen: "down" },
  { key: "ux_issues", label: "UX / a11y gaps", betterWhen: "down" },
];

const NAMED = [
  { key: "page_structure", label: "Pages" },
  { key: "data_entities", label: "Entities" },
  { key: "api_integrations", label: "Integrations" },
  { key: "user_flows", label: "Flows" },
];

const namesOf = (list) => (list || []).map((item) => (item && item.name ? item.name : "")).filter(Boolean);

function deltaClass(delta, betterWhen) {
  if (delta === 0) return "text-muted-foreground";
  const improved = betterWhen === "up" ? delta > 0 : delta < 0;
  return improved ? "text-emerald-500" : "text-destructive";
}

export default function CompareSummary({ left, right }) {
  const leftIsNewer = new Date(left.created_date) >= new Date(right.created_date);
  const earlier = leftIsNewer ? right : left;
  const newer = leftIsNewer ? left : right;

  const metricRows = METRICS.map((metric) => {
    const before = (earlier.logic_map?.[metric.key] || []).length;
    const after = (newer.logic_map?.[metric.key] || []).length;
    return { ...metric, before, after, delta: after - before };
  });

  const namedChanges = NAMED.map((section) => {
    const before = namesOf(earlier.logic_map?.[section.key]);
    const after = namesOf(newer.logic_map?.[section.key]);
    const added = after.filter((name) => !before.includes(name));
    const removed = before.filter((name) => !after.includes(name));
    return { ...section, added, removed };
  });

  const hasItemChanges = namedChanges.some((section) => section.added.length > 0 || section.removed.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitCompare className="w-5 h-5" />
          Iteration diff
        </CardTitle>
        <p className="text-sm text-muted-foreground break-words">
          Earlier: {earlier.title} → Newer: {newer.title}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metricRows.map((row) => (
            <div key={row.key} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="mt-1 font-display text-lg font-semibold">
                {row.before} <span className="text-muted-foreground text-base">→</span> {row.after}
              </p>
              <p className={`text-xs font-medium ${deltaClass(row.delta, row.betterWhen)}`}>
                {row.delta === 0 ? "No change" : `${row.delta > 0 ? "+" : ""}${row.delta} ${row.delta > 0 ? "more" : "fewer"}`}
              </p>
            </div>
          ))}
        </div>

        {hasItemChanges ? (
          <div className="space-y-3">
            {namedChanges.map((section) =>
              section.added.length === 0 && section.removed.length === 0 ? null : (
                <div key={section.key} className="space-y-1.5">
                  <p className="text-sm font-medium">{section.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {section.added.map((name) => (
                      <Badge key={`add-${name}`} variant="outline" className="text-xs font-normal border-emerald-500/40 text-emerald-500">
                        + {name}
                      </Badge>
                    ))}
                    {section.removed.map((name) => (
                      <Badge key={`rm-${name}`} variant="outline" className="text-xs font-normal border-destructive/40 text-destructive line-through">
                        − {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No items were added or dropped between these two analyses.</p>
        )}
      </CardContent>
    </Card>
  );
}