/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radar } from "lucide-react";

export default function IngestSources({ sources, authorized, onUseTarget }) {
  const list = Array.isArray(sources) ? sources : [];
  if (list.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radar className="h-4 w-4 text-primary" />
          Ingest sources
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            probe targets
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {list.map((source) => {
          const active = Array.isArray(authorized) && authorized.includes(source.url);
          return (
            <div
              key={source.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">{source.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-primary">{source.role}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{source.note}</p>
              </div>
              <Button
                variant={active ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => onUseTarget(source.url)}
              >
                {active ? "Authorized" : "Authorize target"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}