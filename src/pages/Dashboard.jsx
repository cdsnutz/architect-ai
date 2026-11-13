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
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, LayoutDashboard, Loader2 } from "lucide-react";
import StatusColumn from "@/components/dashboard/StatusColumn";
import { STATUSES, groupByStatus } from "@/lib/analysisStatus";

export default function Dashboard() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.SiteAnalysis.filter({}, { sort: "-created_date", limit: 50 });
        setAnalyses(page.items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const buckets = groupByStatus(analyses);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <header className="space-y-3">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
            <Link to="/workspace">
              <ArrowLeft className="w-4 h-4" />
              Workspace
            </Link>
          </Button>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-primary" />
              <h1 className="font-display text-2xl font-bold">Dashboard</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {analyses.length} site{analyses.length === 1 ? "" : "s"} tracked
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : analyses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <p className="font-medium">No analyses yet</p>
              <p className="text-sm text-muted-foreground">Map a site and it will show up here by status.</p>
              <Button asChild>
                <Link to="/workspace">Map a website</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 items-start">
            {STATUSES.map((status) => (
              <StatusColumn key={status.key} status={status} items={buckets[status.key]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}