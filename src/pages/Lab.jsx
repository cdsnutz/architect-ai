import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertCircle, FlaskConical, LayoutDashboard, ScanLine } from "lucide-react";
import RequestComposer from "@/components/lab/RequestComposer";
import PlanReview from "@/components/lab/PlanReview";
import RunTelemetry from "@/components/lab/RunTelemetry";
import FindingsBoard from "@/components/lab/FindingsBoard";
import DossierPanel from "@/components/lab/DossierPanel";
import SkillCatalog from "@/components/lab/SkillCatalog";
import LabHistory from "@/components/lab/LabHistory";
import LabConductor from "@/components/lab/LabConductor";
import StewardChat from "@/components/lab/StewardChat";
import ThreatDashboard from "@/components/lab/ThreatDashboard";
import TriggerJourney from "@/components/analysis/TriggerJourney";

function readError(error) {
  const data = error && error.response && error.response.data;
  if (data && typeof data.error === "string") return data.error;
  if (data && typeof data.message === "string") return data.message;
  return (error && error.message) || "Something went wrong.";
}

function parseHosts(value) {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function Lab() {
  const [draft, setDraft] = useState("");
  const [focus, setFocus] = useState("production_incident");
  const [hosts, setHosts] = useState("");

  const [catalog, setCatalog] = useState({ packs: [], skills: [] });
  const [current, setCurrent] = useState(null);
  const [authorized, setAuthorized] = useState([]);
  const [stages, setStages] = useState([]);
  const [run, setRun] = useState(null);

  const [requests, setRequests] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const [requestPage, runPage] = await Promise.all([
        base44.entities.DataRequest.filter({}, { sort: "-created_date", limit: 10 }),
        base44.entities.ChallengeRun.filter({}, { sort: "-created_date", limit: 8 })
      ]);
      setRequests(requestPage.items || []);
      setRuns(runPage.items || []);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const catalogResponse = await base44.functions.invoke("labCatalog", {}).catch(() => null);
      if (catalogResponse && catalogResponse.data) {
        setCatalog({ packs: catalogResponse.data.packs || [], skills: catalogResponse.data.skills || [] });
      }
      await loadHistory();
    })();
  }, [loadHistory]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const beginPolling = (id) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const record = await base44.entities.DataRequest.get(id);
        setCurrent(record);
        if (record.run_id) {
          const telemetry = await base44.entities.ReaRun.get(record.run_id).catch(() => null);
          if (telemetry) setStages(telemetry.stages || []);
        }
        if (record.status === "complete" || record.status === "failed") stopPolling();
      } catch {
        // A transient read should not end the run.
      }
    }, 2500);
  };

  const draftPlan = async () => {
    if (!draft.trim() || busy) return;
    setError("");
    setRun(null);
    setStages([]);
    setBusy("plan");
    try {
      const response = await base44.functions.invoke("planDataRequest", {
        request: draft,
        focus,
        targets: parseHosts(hosts)
      });
      const record = response.data.request;
      setCurrent(record);
      setAuthorized(Array.isArray(record.authorized_targets) ? record.authorized_targets : []);
      loadHistory();
    } catch (err) {
      setError(readError(err));
    }
    setBusy("");
  };

  const toggleTarget = (url) => {
    setAuthorized((list) => (list.includes(url) ? list.filter((item) => item !== url) : [...list, url]));
  };

  const runPlan = async () => {
    if (!current || busy) return;
    setError("");
    setBusy("run");
    beginPolling(current.id);
    try {
      const previous = Array.isArray(current.authorized_targets) ? current.authorized_targets : [];
      if (JSON.stringify(previous) !== JSON.stringify(authorized)) {
        await base44.entities.DataRequest.update(current.id, { authorized_targets: authorized });
      }
      const response = await base44.functions.invoke("runDataRequest", { id: current.id });
      const saved = response.data.request;
      setCurrent(saved);
      if (saved.run_id) {
        const telemetry = await base44.entities.ReaRun.get(saved.run_id).catch(() => null);
        if (telemetry) setStages(telemetry.stages || []);
      }
      loadHistory();
    } catch (err) {
      setError(readError(err));
      const fresh = await base44.entities.DataRequest.get(current.id).catch(() => null);
      if (fresh) setCurrent(fresh);
    }
    stopPolling();
    setBusy("");
  };

  const runPack = async (pack) => {
    if (busy) return;
    setError("");
    setBusy(pack.id);
    try {
      const response = await base44.functions.invoke("runChallenge", {
        pack_id: pack.id,
        data_request_id: current ? current.id : ""
      });
      if (response.data.skipped) {
        setError(response.data.reason || "No authorized host yet.");
      } else {
        setRun(response.data.run);
        loadHistory();
      }
    } catch (err) {
      setError(readError(err));
    }
    setBusy("");
  };

  const toggleGap = async (value) => {
    if (!run) return;
    const updated = await base44.entities.ChallengeRun.update(run.id, { capability_gap: value });
    setRun(updated);
    loadHistory();
  };

  const exportRun = () => {
    if (!run) return;
    const spec = {
      pack: run.pack_name,
      focus: run.focus,
      targets: run.target_urls,
      status: run.status,
      data_request_id: run.data_request_id,
      dossier: run.dossier,
      capability_gap: Boolean(run.capability_gap),
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "challenge-" + run.pack_id + ".json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openRequest = async (record) => {
    stopPolling();
    setError("");
    setRun(null);
    setStages([]);
    setCurrent(record);
    setAuthorized(Array.isArray(record.authorized_targets) ? record.authorized_targets : []);
    if (record.run_id) {
      const telemetry = await base44.entities.ReaRun.get(record.run_id).catch(() => null);
      if (telemetry) setStages(telemetry.stages || []);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openRun = (record) => {
    setRun(record);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const planTargets = current && current.plan && Array.isArray(current.plan.targets) ? current.plan.targets : [];
  const hasFindings = current && Array.isArray(current.findings) && current.findings.length > 0;
  const packBusy = Boolean(busy && busy !== "plan" && busy !== "run");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <ScanLine className="h-5 w-5 text-primary" />
            REVENGINE
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to="/workspace">
                <ScanLine className="h-4 w-4" />
                Workspace
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </header>

        <div className="space-y-2">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
            <FlaskConical className="h-3.5 w-3.5" />
            Engineering challenge lab
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Describe the problem.
            <br />
            Get the evidence chain.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Your words become a reviewable probe plan. Pods run it read-only against the hosts you authorize, then hand back
            findings tagged observed or inferred, with the gaps named.
          </p>
        </div>

        <RequestComposer
          value={draft}
          onChange={setDraft}
          focus={focus}
          onFocus={setFocus}
          hosts={hosts}
          onHosts={setHosts}
          onSubmit={draftPlan}
          busy={busy === "plan"}
          error=""
        />

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {current && (
          <>
            {planTargets.length === 0 && (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
                This plan has no authorized host. Add one to the request above and draft the plan again — the lab will not
                probe a host you have not named.
              </p>
            )}
            <PlanReview
              record={current}
              authorized={authorized}
              onToggleTarget={toggleTarget}
              onRun={runPlan}
              running={busy === "run"}
            />
          </>
        )}

        <RunTelemetry stages={stages} busy={busy === "run"} />

        {current && <FindingsBoard request={current} />}

        {hasFindings && (
          <TriggerJourney analysis={{ logic_map: { ledger_traces: current.ledger_traces || [] } }} />
        )}

        <DossierPanel run={run} onToggleCapabilityGap={toggleGap} onExport={exportRun} />

        <SkillCatalog
          packs={catalog.packs}
          skills={catalog.skills}
          focus={focus}
          selectedPackId={packBusy ? busy : ""}
          onSelectPack={runPack}
          busy={packBusy}
        />

        <StewardChat requestId={current ? current.id : ""} />

        <LabConductor requestId={current ? current.id : ""} />

        <ThreatDashboard />

        <LabHistory
          requests={requests}
          runs={runs}
          loading={loadingHistory}
          onOpenRequest={openRequest}
          onOpenRun={openRun}
        />
      </div>
    </div>
  );
}