/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import IdeShell from "@/components/ide/IdeShell";
import RunPicker from "@/components/structure/RunPicker";
import StructureMetrics from "@/components/structure/StructureMetrics";
import AnomalyList from "@/components/structure/AnomalyList";
import { auditGraph } from "@/lib/graphTheory";
import { copyToClipboard } from "@/lib/clipboard";

export default function Structure() {
  const [runs, setRuns] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    base44.entities.SymmetryRun.filter({}, { sort: "-created_date", limit: 20 })
      .then((page) => {
        if (!alive) return;
        const items = page.items || [];
        setRuns(items);
        setSelectedId((current) => current || (items[0] ? items[0].id : ""));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const selected = runs.find((run) => run.id === selectedId) || null;
  const audit = useMemo(() => (selected ? auditGraph(selected) : null), [selected]);

  const copyPlan = async () => {
    if (!audit) return;
    const ok = await copyToClipboard(audit.plan);
    setCopied(ok);
  };

  return (
    <IdeShell
      active="structure"
      crumb="Structure / graph audit and repair"
      note="read-only · anomalies derived from the captured graph"
      status={[
        { label: "anomalies", value: String(audit ? audit.metrics.anomalies : 0) },
        { label: "chain", value: String(audit ? audit.metrics.chain : 0) },
        { label: "captures", value: String(runs.length) }
      ]}
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="space-y-4">
          {loading ? (
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">Reading captures…</p>
          ) : runs.length ? (
            <RunPicker runs={runs} selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <div className="border border-line-soft bg-surface-panel p-3">
              <p className="text-[11px] leading-relaxed text-ink-muted">
                No capture yet. Run a Symmetry pass first, then come back and the graph is audited here.
              </p>
              <Link
                to="/symmetry"
                className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted no-underline hover:text-signal"
              >
                run a pass <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          <div className="border border-line-soft bg-surface-panel p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">how the audit reads</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
              Topology only: degree distribution, strongly connected components, chain depth, duplicate edges and
              origin spread. It never touches the target again, and a finding here is a shape in the capture, not a
              claim about runtime behaviour.
            </p>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          {!audit ? (
            <div className="border border-line-soft bg-surface-panel p-4">
              <h1 className="font-display text-sm text-ink">No graph to audit</h1>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
                The auditor reads the dependency graph a Symmetry pass writes. Once a pass is saved its nodes and edges
                show up here, with every structural anomaly and the fix each one needs.
              </p>
            </div>
          ) : (
            <>
              <div className="border border-line-soft bg-surface-panel">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line-soft p-3">
                  <div className="min-w-0">
                    <h1 className="truncate font-display text-sm text-ink">{audit.label || audit.target}</h1>
                    <p className="truncate font-mono text-[10px] text-ink-muted">{audit.target}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyPlan}
                    className="inline-flex items-center gap-1.5 border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-signal"
                  >
                    <Copy className="h-3 w-3" /> {copied ? "copied" : "copy fix plan"}
                  </button>
                </div>
                <div className="p-3">
                  <StructureMetrics metrics={audit.metrics} />
                  <p className="mt-2 text-[11px] leading-relaxed text-ink-dim">
                    {audit.metrics.anomalies
                      ? "Each anomaly below carries the fix it needs. Apply the plan to your own deploy; the capture is never written back to."
                      : "Nothing structural stood out in this capture. That is a statement about the sample, not a guarantee."}
                  </p>
                </div>
              </div>

              <AnomalyList anomalies={audit.anomalies} />

              <div className="flex flex-wrap items-center justify-between gap-2 border border-line-soft bg-surface-panel px-3 py-2">
                <p className="text-[11px] leading-relaxed text-ink-muted">
                  Fixes land where the rebuild is compiled, so the corrected graph is what the clone is built from.
                </p>
                <Link
                  to="/spec"
                  className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted no-underline hover:text-signal"
                >
                  rebuild spec <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </IdeShell>
  );
}