/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import StatusColumn from "@/components/dashboard/StatusColumn";
import { STATUSES, groupByStatus } from "@/lib/analysisStatus";
import IdeShell from "@/components/ide/IdeShell";

export default function Dashboard() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me().catch(() => null);
        const page = user
          ? await base44.entities.SiteAnalysis.filter(
              { created_by_id: user.id },
              { sort: "-created_date", limit: 50 }
            )
          : { items: [] };
        setAnalyses(page.items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const buckets = groupByStatus(analyses);

  return (
    <IdeShell
      active="dashboard"
      crumb="dashboard / track-record"
      note="sites by status"
      status={[
        { label: "sites", value: String(analyses.length) },
        { label: "columns", value: String(STATUSES.length) },
        { label: "state", value: loading ? "loading" : "ready" },
      ]}
    >
      <div className="space-y-4 p-3 md:p-4">
        <div className="border border-line bg-surface-panel px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">Dashboard</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">Every mapped host, by status</h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-ink-muted">
            {analyses.length} site{analyses.length === 1 ? "" : "s"} tracked. Each record keeps its own
            evidence, so a column is never a guess.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center border border-line bg-surface-panel py-12">
            <Loader2 className="h-5 w-5 animate-spin text-signal" />
          </div>
        ) : analyses.length === 0 ? (
          <div className="border border-dashed border-line bg-surface-sunken px-4 py-10 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">no records</p>
            <p className="mt-2 text-[12.5px] text-ink-muted">
              Map a site and it will show up here by status.
            </p>
            <Button className="mt-4" asChild>
              <Link to="/workspace">Map a website</Link>
            </Button>
          </div>
        ) : (
          <div className="grid items-start gap-4 md:grid-cols-3">
            {STATUSES.map((status) => (
              <StatusColumn key={status.key} status={status} items={buckets[status.key]} />
            ))}
          </div>
        )}
      </div>
    </IdeShell>
  );
}