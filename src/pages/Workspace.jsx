import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowRight, ClipboardPaste, GitCompare, History, LayoutDashboard, Link2, Loader2, Lock, ScanLine, Search } from "lucide-react";
import AnalysisResult from "@/components/analysis/AnalysisResult";
import RebuildPrompt from "@/components/analysis/RebuildPrompt";
import PasteHtmlForm from "@/components/analysis/PasteHtmlForm";
import QuickActionsMenu from "@/components/analysis/QuickActionsMenu";

export default function Workspace() {
  const [status, setStatus] = useState("loading");
  const [access, setAccess] = useState(null);
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState("url");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  async function loadHistory() {
    try {
      const page = await base44.entities.SiteAnalysis.filter({}, { sort: "-created_date", limit: 20 });
      setHistory(page.items);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadAccess() {
    const response = await base44.functions.invoke("checkAccess");
    const data = response.data || {};
    setAccess(data);
    setStatus(data.hasAccess ? "ready" : "locked");
    return data;
  }

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) {
        setStatus("anonymous");
        return;
      }
      const data = await loadAccess();
      if (!data.hasAccess) return;
      await loadHistory();
      const targetId = new URLSearchParams(window.location.search).get("analysis");
      if (!targetId) return;
      const record = await base44.entities.SiteAnalysis.get(targetId).catch(() => null);
      if (record) {
        setCurrent(record);
        setUrl(record.url);
      }
    })().catch(() => setStatus("locked"));
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
      loadAccess();
      loadHistory();
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
      loadAccess();
      loadHistory();
    } catch (err) {
      setError(
        (err && err.response && err.response.data && err.response.data.error) ||
          (err && err.message) ||
          "Analysis failed."
      );
    }
    setAnalyzing(false);
  };

  const canAnalyze = !!access?.admin || (access?.remaining ?? 0) > 0;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "anonymous" || status === "locked") {
    const locked = status === "locked";
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-5 py-20">
          <Link to="/" className="flex items-center justify-center gap-2 font-display font-bold mb-8">
            <ScanLine className="w-5 h-5 text-primary" />
            REVENGINE
          </Link>
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <h1 className="mt-5 font-display text-2xl font-bold">
                {locked ? "Buy a website teardown to start" : "Sign in to open your workspace"}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {locked
                  ? "Each website is a one-time $49.99 — its full logic map, rebuild prompt and white-label clone."
                  : "Use your account to access your saved analyses and purchases."}
              </p>
              <div className="mt-7 space-y-3">
                {locked ? (
                  <>
                    <Button className="w-full gap-2" asChild>
                      <Link to="/checkout">
                        Get started — $49.99 per website
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/">Back to overview</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full" asChild>
                      <Link to="/login?returnTo=%2Fworkspace">Sign in</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/register?returnTo=%2Fworkspace">Create an account</Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
            <ScanLine className="w-6 h-6 text-primary" />
            REVENGINE
          </Link>
          <div className="flex items-center gap-2">
            <QuickActionsMenu analyses={history} />
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to="/compare">
                <GitCompare className="w-4 h-4" />
                <span className="hidden sm:inline">Compare</span>
              </Link>
            </Button>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {access?.admin
                ? "Admin · unlimited"
                : `${access?.remaining ?? 0} website${access?.remaining === 1 ? "" : "s"} left`}
            </span>
          </div>
        </header>

        {canAnalyze ? (
          <div className="space-y-4">
            <div className="inline-flex rounded-lg border p-1">
              <button
                type="button"
                onClick={() => setMode("url")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link2 className="w-4 h-4" />
                Analyze a URL
              </button>
              <button
                type="button"
                onClick={() => setMode("html")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === "html" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                Paste gated page HTML
              </button>
            </div>

            {mode === "url" ? (
              <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={analyzing}>
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {analyzing ? "Mapping..." : "Map logic"}
                </Button>
              </form>
            ) : (
              <PasteHtmlForm onSubmit={handleAnalyzeHtml} busy={analyzing} />
            )}
          </div>
        ) : (
          <Card className="border-primary/40">
            <CardContent className="p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div>
                <p className="font-display font-semibold">No websites left on your account</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each teardown is a one-time $49.99. Add another website to keep mapping.
                </p>
              </div>
              <Button className="mt-4 sm:mt-0 shrink-0 gap-2" asChild>
                <Link to="/checkout">
                  Add a website — $49.99
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {analyzing && (
          <Card>
            <CardContent className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Deconstructing the page logic — this takes up to a minute.
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-3 py-6 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </CardContent>
          </Card>
        )}

        {current && <AnalysisResult analysis={current} />}
        {current && <RebuildPrompt analysis={current} />}

        {!current && !analyzing && !error && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <History className="w-4 h-4" />
              Past analyses
            </h2>
            {loadingHistory ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No analyses yet — map your first URL above.
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrent(item);
                      setUrl(item.url);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
                  >
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}