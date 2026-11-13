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
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, Lock, ScanLine, Search } from "lucide-react";
import AnalysisResult from "@/components/analysis/AnalysisResult";
import TriggerJourney from "@/components/analysis/TriggerJourney";
import RebuildPrompt from "@/components/analysis/RebuildPrompt";
import PasteHtmlForm from "@/components/analysis/PasteHtmlForm";
import QuickActionsMenu from "@/components/analysis/QuickActionsMenu";
import ReaHandoff from "@/components/analysis/ReaHandoff";
import PodFindings from "@/components/analysis/PodFindings";
import AnalysisGuideChat from "@/components/analysis/AnalysisGuideChat";
import OnboardingGuide from "@/components/analysis/OnboardingGuide";
import ReaConsole from "@/components/rea/ReaConsole";
import PodTracker from "@/components/rea/PodTracker";
import IdeShell from "@/components/ide/IdeShell";
import IdePanel from "@/components/ide/IdePanel";
import AnalysisExplorer from "@/components/ide/AnalysisExplorer";
import EditorTabs from "@/components/ide/EditorTabs";

export default function Workspace() {
  const [status, setStatus] = useState("loading");
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState("url");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  async function loadHistory(ownerId) {
    try {
      const page = await base44.entities.SiteAnalysis.filter(
        { created_by_id: ownerId },
        { sort: "-created_date", limit: 20 }
      );
      setHistory(page.items);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) {
        setStatus("anonymous");
        return;
      }
      setStatus("ready");
      setUserId(user.id);
      setUserEmail(user.email || user.full_name || "signed in");
      await loadHistory(user.id);
      const targetId = new URLSearchParams(window.location.search).get("analysis");
      if (!targetId) return;
      const record = await base44.entities.SiteAnalysis.get(targetId).catch(() => null);
      if (record && record.created_by_id === user.id) {
        setCurrent(record);
        setUrl(record.url);
      }
    })().catch(() => setStatus("anonymous"));
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url.trim() || analyzing) return;
    setError("");
    setCurrent(null);
    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke("analyzeSite", { url });
      setCurrent(response.data.analysis);
      loadHistory(userId);
    } catch (err) {
      setError(
        (err && err.response && err.response.data && err.response.data.error) ||
          (err && err.message) ||
          "Analysis failed."
      );
    }
    setAnalyzing(false);
  };

  const handleAnalyzeHtml = async (payload) => {
    if (analyzing) return;
    setError("");
    setCurrent(null);
    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke("analyzePastedHtml", payload);
      setCurrent(response.data.analysis);
      loadHistory(userId);
    } catch (err) {
      setError(
        (err && err.response && err.response.data && err.response.data.error) ||
          (err && err.message) ||
          "Analysis failed."
      );
    }
    setAnalyzing(false);
  };

  const openAnalysis = (item) => {
    setCurrent(item);
    setUrl(item.url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (status === "loading") {
    return (
      <div className="ide-surface flex min-h-screen items-center justify-center bg-[#0D1117]">
        <Loader2 className="h-5 w-5 animate-spin text-[#22C55E]" />
      </div>
    );
  }

  if (status === "anonymous") {
    return (
      <div className="ide-surface min-h-screen bg-[#0D1117] text-[#E6EDF3]">
        <div className="mx-auto max-w-lg px-5 py-20">
          <Link
            to="/"
            className="mb-8 flex items-center justify-center gap-2 font-display font-bold no-underline"
          >
            <ScanLine className="h-5 w-5 text-[#22C55E]" />
            REVENGINE
          </Link>
          <Card className="border-[#2b3646] bg-[#0F141B]">
            <CardContent className="p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.1)]">
                <Lock className="h-5 w-5 text-[#22C55E]" />
              </div>
              <h1 className="mt-5 font-display text-2xl font-bold">Sign in to open your workspace</h1>
              <p className="mt-3 text-sm text-[#9AA7B6]">
                Use your account to access your saved analyses.
              </p>
              <div className="mt-7 space-y-3">
                <Button className="w-full" asChild>
                  <Link to="/login?returnTo=%2Fworkspace">Sign in</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/register?returnTo=%2Fworkspace">Create an account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <IdeShell
      active="workspace"
      crumb="workspace / truth-table"
      note="evidence in, truth table out"
      sidebar={
        <AnalysisExplorer
          history={history}
          loading={loadingHistory}
          currentId={current ? current.id : ""}
          onOpen={openAnalysis}
        />
      }
      tabs={
        <EditorTabs
          mode={mode}
          onChange={setMode}
          busy={analyzing}
          right={<QuickActionsMenu analyses={history} />}
        />
      }
      status={[
        { label: "user", value: userEmail },
        { label: "records", value: String(history.length) },
        { label: "mode", value: mode === "url" ? "live fetch" : "pasted html" },
        { label: "state", value: analyzing ? "mapping" : current ? "mapped" : "idle" },
      ]}
    >
      <div className="space-y-4 p-3 md:p-4">
        <IdePanel
          label={mode === "url" ? "Target host" : "Captured source"}
          right={
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#7d8a99]">
              read-only
            </span>
          }
        >
          {mode === "url" ? (
            <form onSubmit={handleAnalyze} className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="flex-1 border-[#2b3646] bg-[#0B0F14] font-mono text-[12px]"
              />
              <Button type="submit" disabled={analyzing}>
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {analyzing ? "Mapping..." : "Map logic"}
              </Button>
            </form>
          ) : (
            <PasteHtmlForm onSubmit={handleAnalyzeHtml} busy={analyzing} />
          )}
        </IdePanel>

        <PodTracker analyzing={analyzing} />

        {error && (
          <div className="flex items-start gap-2 border border-[rgba(244,114,182,0.4)] bg-[rgba(244,114,182,0.06)] px-3 py-2 text-[12px] text-[#F472B6]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {current ? (
          <div className="space-y-4">
            <AnalysisResult analysis={current} />
            <TriggerJourney analysis={current} />
            <PodFindings analysis={current} />
            <RebuildPrompt analysis={current} />
            <ReaHandoff analysis={current} />
          </div>
        ) : (
          !analyzing &&
          !error && (
            <div className="border border-dashed border-[#2b3646] bg-[#0B0F14] px-4 py-10 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7d8a99]">
                no map open
              </p>
              <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-relaxed text-[#9AA7B6]">
                Enter a host and run the map, or pick a saved analysis from the explorer on the left.
              </p>
            </div>
          )
        )}

        <OnboardingGuide />
        <AnalysisGuideChat analysis={current} />
        <ReaConsole analysis={current} onValidated={setCurrent} />
      </div>
    </IdeShell>
  );
}