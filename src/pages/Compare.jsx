/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, GitCompare, Loader2 } from "lucide-react";
import AnalysisResult from "@/components/analysis/AnalysisResult";
import CompareSummary from "@/components/compare/CompareSummary";

export default function Compare() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.SiteAnalysis.filter({}, { sort: "-created_date", limit: 50 });
        const items = page.items;
        setAnalyses(items);
        if (items.length > 0) setLeftId(items[0].id);
        if (items.length > 1) setRightId(items[1].id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const left = analyses.find((a) => a.id === leftId);
  const right = analyses.find((a) => a.id === rightId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <header className="space-y-3">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
            <Link to="/workspace">
              <ArrowLeft className="w-4 h-4" />
              Workspace
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold">Compare iterations</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Put two analyses of the same product side by side to see what changed between rebuilds.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : analyses.length < 2 ? (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <p className="font-medium">You need at least two analyses to compare</p>
              <p className="text-sm text-muted-foreground">Map another page or paste an updated version of this one first.</p>
              <Button asChild>
                <Link to="/workspace">Back to workspace</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Left analysis</p>
                <Select value={leftId} onValueChange={setLeftId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an analysis" />
                  </SelectTrigger>
                  <SelectContent>
                    {analyses.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Right analysis</p>
                <Select value={rightId} onValueChange={setRightId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an analysis" />
                  </SelectTrigger>
                  <SelectContent>
                    {analyses.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {left && right ? (
              <>
                {left.id === right.id ? (
                  <Card>
                    <CardContent className="py-6 text-center text-sm text-muted-foreground">
                      Pick two different analyses to compare.
                    </CardContent>
                  </Card>
                ) : (
                  <CompareSummary left={left} right={right} />
                )}

                <div className="grid gap-6 md:grid-cols-2 items-start">
                  <div className="space-y-3">
                    <Badge variant="secondary">Left</Badge>
                    {left && <AnalysisResult analysis={left} />}
                  </div>
                  <div className="space-y-3">
                    <Badge variant="secondary">Right</Badge>
                    {right && <AnalysisResult analysis={right} />}
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}