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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import AnalysisResult from "@/components/analysis/AnalysisResult";
import CompareSummary from "@/components/compare/CompareSummary";
import IdeShell from "@/components/ide/IdeShell";
import IdePanel from "@/components/ide/IdePanel";

export default function Compare() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");

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
    <IdeShell
      active="compare"
      crumb="compare / iterations"
      note="two maps, side by side"
      status={[
        { label: "records", value: String(analyses.length) },
        { label: "left", value: left ? left.title : "empty" },
        { label: "right", value: right ? right.title : "empty" },
        { label: "state", value: loading ? "loading" : "ready" },
      ]}
    >
      <div className="space-y-4 p-3 md:p-4">
        <div className="border border-line bg-surface-panel px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">Compare</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">Compare iterations</h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-ink-muted">
            Put two analyses of the same product side by side to see what changed between rebuilds.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center border border-line bg-surface-panel py-12">
            <Loader2 className="h-5 w-5 animate-spin text-signal" />
          </div>
        ) : analyses.length < 2 ? (
          <div className="border border-dashed border-line bg-surface-sunken px-4 py-10 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">not enough records</p>
            <p className="mt-2 text-[12.5px] text-ink-muted">
              You need at least two analyses to compare. Map another page, or paste an updated version of this one.
            </p>
            <Button className="mt-4" asChild>
              <Link to="/workspace">Back to workspace</Link>
            </Button>
          </div>
        ) : (
          <>
            <IdePanel label="Selection">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">Left analysis</p>
                  <Select value={leftId} onValueChange={setLeftId}>
                    <SelectTrigger className="border-line bg-surface-sunken">
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
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">Right analysis</p>
                  <Select value={rightId} onValueChange={setRightId}>
                    <SelectTrigger className="border-line bg-surface-sunken">
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
            </IdePanel>

            {left && right ? (
              <>
                {left.id === right.id ? (
                  <div className="border border-line bg-surface-panel px-4 py-6 text-center text-[12.5px] text-ink-muted">
                    Pick two different analyses to compare.
                  </div>
                ) : (
                  <CompareSummary left={left} right={right} />
                )}

                <div className="grid items-start gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-[0.16em]">
                      Left
                    </Badge>
                    {left && <AnalysisResult analysis={left} />}
                  </div>
                  <div className="space-y-3">
                    <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-[0.16em]">
                      Right
                    </Badge>
                    {right && <AnalysisResult analysis={right} />}
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </IdeShell>
  );
}