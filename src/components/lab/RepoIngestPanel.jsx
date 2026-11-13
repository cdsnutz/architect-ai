/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, GitFork, Loader2 } from "lucide-react";
import RepoIngestResult from "@/components/lab/RepoIngestResult";

function readError(error) {
  const data = error && error.response && error.response.data;
  if (data && typeof data.error === "string") return data.error;
  return (error && error.message) || "The repository could not be ingested.";
}

export default function RepoIngestPanel() {
  const [repoUrl, setRepoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const ingest = async () => {
    if (!repoUrl.trim() || busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await base44.functions.invoke("ingestRepo", { repo_url: repoUrl.trim() });
      setResult(response.data);
    } catch (err) {
      setError(readError(err));
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitFork className="h-4 w-4 text-primary" />
          Repository ingest
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            digest + diagram
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={repoUrl}
            disabled={busy}
            onChange={(event) => setRepoUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") ingest();
            }}
            placeholder="owner/repo or https://github.com/owner/repo"
            className="font-mono text-xs"
          />
          <Button onClick={ingest} disabled={busy || !repoUrl.trim()} className="gap-2 sm:w-40">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitFork className="h-3.5 w-3.5" />}
            {busy ? "Reading repo" : "Ingest repo"}
          </Button>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Reads the repository tree and source files read-only, then builds a gitingest-style digest and a
          gitdiagram-style architecture map inside the app.
        </p>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <RepoIngestResult result={result} />
      </CardContent>
    </Card>
  );
}