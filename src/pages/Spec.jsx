import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import SpecBuilder from "@/components/spec/SpecBuilder";
import SpecList from "@/components/spec/SpecList";
import SpecViewer from "@/components/spec/SpecViewer";
import RunnableSpec from "@/components/spec/RunnableSpec";
import DeployBundle from "@/components/spec/DeployBundle";
import RunCapture from "@/components/spec/RunCapture";
import ReplicaChecks from "@/components/spec/ReplicaChecks";
import { GitBranch } from "lucide-react";

export default function Spec() {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [analysesPage, requestsPage, specsPage] = await Promise.all([
        base44.entities.SiteAnalysis.list({ sort: "-created_date", limit: 30 }),
        base44.entities.DataRequest.list({ sort: "-created_date", limit: 30 }),
        base44.entities.RebuildSpec.list({ sort: "-created_date", limit: 30 })
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
        description: error?.response?.data?.error || error.message
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
        description: error?.response?.data?.error || error.message
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
              <GitBranch className="h-3.5 w-3.5" />
              Rebuild spec
            </p>
            <h1 className="font-display text-2xl font-bold">Contracts in, runnable app out</h1>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/lab">Back to lab</Link>
          </Button>
        </header>

        <SpecBuilder analyses={analyses} requests={requests} onBuild={build} busy={busy} />

        <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-6">
            {selected ? (
              <>
                <SpecViewer spec={selected} />
                <RunnableSpec spec={selected} />
                <RunCapture spec={selected} onCapture={capture} busy={busy} />
                <ReplicaChecks spec={selected} onUpdated={replaceSpec} />
                <DeployBundle spec={selected} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Compile a spec from a dossier or a lab request to begin.</p>
            )}
          </div>

          <aside className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Compiled specs</p>
            <SpecList specs={specs} selectedId={selected?.id} onSelect={setSelected} />
          </aside>
        </div>
      </div>
    </div>
  );
}