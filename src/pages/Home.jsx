import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Loader2, AlertCircle, History, Search } from "lucide-react";
import AnalysisResult from "@/components/analysis/AnalysisResult";

export default function Home() {
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = async () => {
    try {
      const page = await base44.entities.SiteAnalysis.filter({}, { sort: "-created_date", limit: 20 });
      setHistory(page.items);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
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
      loadHistory();
    } catch (err) {
      setError((err && err.response && err.response.data && err.response.data.error) || (err && err.message) || "Analysis failed.");
    }
    setAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold flex items-center justify-center gap-2">
            <Globe className="w-7 h-7" />
            URL Logic Mapper
          </h1>
          <p className="text-muted-foreground">
            Paste a URL and the app fetches, deconstructs, and maps its logic for your review.
          </p>
        </header>

        <form onSubmit={handleAnalyze} className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={analyzing}>
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {analyzing ? "Mapping..." : "Map logic"}
          </Button>
        </form>

        {analyzing && (
          <Card>
            <CardContent className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Fetching the site and deconstructing its logic — this takes up to a minute.
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
              <p className="text-sm text-muted-foreground text-center py-6">No analyses yet — map your first URL above.</p>
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