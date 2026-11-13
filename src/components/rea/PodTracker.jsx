/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import PodStatusRow from "./PodStatusRow";
import { derivePods, elapsedSince, runProgress } from "./podLanes";

export default function PodTracker({ analyzing }) {
  const [run, setRun] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(Date.now());

  const live = Boolean(analyzing) || run?.status === "running";
  const pods = derivePods(run);
  const progress = runProgress(run);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const page = await base44.entities.ReaRun.filter({}, { sort: "-created_date", limit: 1 });
        if (alive) setRun(page.items[0] || null);
      } catch {
        // keep the last known run on screen
      }
      if (alive) setLoaded(true);
    };
    load();
    const timer = setInterval(load, live ? 2500 : 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [live]);

  useEffect(() => {
    const unsubscribe = base44.entities.ReaRun.subscribe((event) => {
      const next = event && event.data;
      if (!next) return;
      setRun((prev) => (!prev || String(next.created_date) >= String(prev.created_date) ? next : prev));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [live]);

  const statusLabel = live
    ? "live"
    : run?.status === "complete"
      ? "last pass complete"
      : run?.status === "failed"
        ? "last pass failed"
        : "idle";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5" />
          Pod status
          <span className="ml-auto flex items-center gap-2 text-xs font-normal text-muted-foreground">
            {live && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
            {statusLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">{run?.target_url || "No pod pass yet"}</span>
            <span className="shrink-0 font-mono">{progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: progress + "%" }}
            />
          </div>
        </div>

        <div className="divide-y">
          {pods.map((pod) => (
            <PodStatusRow
              key={pod.name}
              pod={pod}
              elapsed={pod.state === "active" && pod.startedAt ? elapsedSince(pod.startedAt, now) : ""}
            />
          ))}
        </div>

        {!loaded && <p className="text-xs text-muted-foreground">Loading pod telemetry…</p>}
        {loaded && !run && <p className="text-xs text-muted-foreground">Start a mapping pass — each pod reports in here as it runs.</p>}
        {run?.error && <p className="text-xs text-destructive">{run.error}</p>}
        {run?.status === "running" && (
          <p className="text-xs text-muted-foreground">Updated live · last change {elapsedSince(run.updated_date, now)} ago</p>
        )}
      </CardContent>
    </Card>
  );
}