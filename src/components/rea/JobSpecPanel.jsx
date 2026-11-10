import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, FileJson, Loader2 } from "lucide-react";
import CopyButton from "@/components/analysis/CopyButton";

export default function JobSpecPanel({ analysis }) {
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const build = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("reaTools", {
        action: "job-spec",
        analysis_id: analysis ? analysis.id : ""
      });
      setJob(response.data);
    } catch (err) {
      setError((err && err.response && err.response.data && err.response.data.error) || "The job spec could not be built.");
    }
    setBusy(false);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(job.spec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = job.file;
    link.click();
    URL.revokeObjectURL(url);
  };

  const text = job ? JSON.stringify(job.spec, null, 2) : "";

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <FileJson className="w-4 h-4" />
            Job spec
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {analysis ? "Bundles the open dossier for your agent." : "No dossier open — this bundles your most recent one."}
          </p>
        </div>
        <Button onClick={build} disabled={busy} size="sm" variant="outline" className="shrink-0">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Build spec
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {job && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <code className="truncate font-mono text-xs text-muted-foreground">{job.file}</code>
            <div className="flex shrink-0 items-center gap-1">
              <CopyButton getText={() => text} label="Copy" copiedLabel="Copied" />
              <Button size="sm" variant="ghost" onClick={download} className="gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Download
              </Button>
            </div>
          </div>
          <pre className="max-h-56 overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs">{text}</pre>
        </div>
      )}
    </div>
  );
}