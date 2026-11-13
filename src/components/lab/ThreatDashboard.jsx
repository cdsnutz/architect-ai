/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { THREAT_LEVELS, classifyFinding } from "@/lib/threatLevel";

const FILL = {
  rupture: "#ef4444",
  exposure: "#d946ef",
  flaw: "#f59e0b",
  clear: "#10b981"
};

const SHORT = {
  rupture: "Critical rupture",
  exposure: "Data exposure",
  flaw: "Minor flaw",
  clear: "No exposure"
};

export default function ThreatDashboard() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ findings: 0, observed: 0, passes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.DataRequest.filter({}, { sort: "-created_date", limit: 100 });
        const scored = (page.items || []).filter(
          (item) => Array.isArray(item.findings) && item.findings.length > 0
        );

        const counts = { rupture: 0, exposure: 0, flaw: 0, clear: 0 };
        let findings = 0;
        let observed = 0;

        scored.forEach((item) => {
          item.findings.forEach((finding) => {
            counts[classifyFinding(finding).key] += 1;
            findings += 1;
            if (finding.observed) observed += 1;
          });
        });

        setRows(
          THREAT_LEVELS.map((level) => ({
            key: level.key,
            full: level.label,
            label: SHORT[level.key] || level.label,
            count: counts[level.key]
          }))
        );
        setTotals({ findings, observed, passes: scored.length });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-primary" />
          Discovery dashboard
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {totals.findings} findings · {totals.observed} observed · {totals.passes} passes
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : totals.findings === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No findings yet. Run a probe pass and the threat levels will chart here.
          </p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--accent))", opacity: 0.4 }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "hsl(var(--popover-foreground))"
                  }}
                  formatter={(value, name, entry) => [value, entry.payload.full]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {rows.map((row) => (
                    <Cell key={row.key} fill={FILL[row.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}