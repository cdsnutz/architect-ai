/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import SpecBuilder from "@/components/spec/SpecBuilder";
import SpecList from "@/components/spec/SpecList";
import SpecViewer from "@/components/spec/SpecViewer";
import RunnableSpec from "@/components/spec/RunnableSpec";
import DeployBundle from "@/components/spec/DeployBundle";
import RunCapture from "@/components/spec/RunCapture";
import ReplicaChecks from "@/components/spec/ReplicaChecks";
import IdeShell from "@/components/ide/IdeShell";
import IdePanel from "@/components/ide/IdePanel";

export default function Spec() {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return;
      const owner = { created_by_id: user.id };
      const [analysesPage, requestsPage, specsPage] = await Promise.all([
        base44.entities.SiteAnalysis.filter(owner, { sort: "-created_date", limit: 30 }),
        base44.entities.DataRequest.filter(owner, { sort: "-created_date", limit: 30 }),
        base44.entities.RebuildSpec.filter(owner, { sort: "-created_date", limit: 30 }),
      ]);
      setAnalyses(analysesPage.items || []);
      setRequests(requestsPage.items || []);
      setSpecs(specsPage.items || []);
      setSelected(specsPage.items?.[0] || null);
    })();
  }, []);

  const build = async (payload) => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke("buildRebuildSpec", payload);
      const spec = response.data?.spec;
      setSpecs((prev) => [spec, ...prev]);
      setSelected(spec);
      toast({ title: "Spec compiled", description: "Handoff, run contract and deploy bundle are ready." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not compile",
        description: error?.response?.data?.error || error.message,
      });
    } finally {
      setBusy(false);
    }
  };

  const replaceSpec = (spec) => {
    setSpecs((prev) => prev.map((item) => (item.id === spec.id ? spec : item)));
    setSelected(spec);
  };

  const capture = async (payload) => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke("captureRunOutput", payload);
      const spec = response.data?.spec;
      setSpecs((prev) => prev.map((item) => (item.id === spec.id ? spec : item)));
      setSelected(spec);
      toast({ title: "Run captured", description: "Performance read saved against this spec." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not capture",
        description: error?.response?.data?.error || error.message,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <IdeShell
      active="spec"
      crumb="spec / rebuild"
      note="contracts in, runnable app out"
      sidebar={
        <aside className="sticky top-11 hidden h-[calc(100vh-2.75rem)] w-56 shrink-0 flex-col border-r border-line-soft bg-surface-sunken md:flex">
          <div className="flex items-center justify-between border-b border-line-soft px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">Compiled specs</p>
            <span className="font-mono text-[10px] text-ink-dim">{specs.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SpecList specs={specs} selectedId={selected?.id} onSelect={setSelected} />
          </div>
        </aside>
      }
      status={[
        { label: "specs", value: String(specs.length) },
        { label: "dossiers", value: String(analyses.length) },
        { label: "requests", value: String(requests.length) },
        { label: "state", value: busy ? "compiling" : selected ? "loaded" : "idle" },
      ]}
    >
      <div className="space-y-4 p-3 md:p-4">
        <div className="border border-line bg-surface-panel px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">Rebuild spec</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">Contracts in, runnable app out</h1>
        </div>

        <IdePanel label="Compile from a source">
          <SpecBuilder analyses={analyses} requests={requests} onBuild={build} busy={busy} />
        </IdePanel>

        {selected ? (
          <div className="space-y-4">
            <SpecViewer spec={selected} />
            <RunnableSpec spec={selected} />
            <RunCapture spec={selected} onCapture={capture} busy={busy} />
            <ReplicaChecks spec={selected} onUpdated={replaceSpec} />
            <DeployBundle spec={selected} />
          </div>
        ) : (
          <div className="border border-dashed border-line bg-surface-sunken px-4 py-10 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">no spec open</p>
            <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-relaxed text-ink-muted">
              Compile a spec from a dossier or a lab request to begin, or pick one from the list on the left.
            </p>
          </div>
        )}
      </div>
    </IdeShell>
  );
}