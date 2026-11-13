/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink, FileText } from "lucide-react";
import RepoArchitectureMap from "@/components/lab/RepoArchitectureMap";

export default function RepoIngestResult({ result }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const stats = result.stats || {};
  const sources = result.sources || {};

  const copyDigest = async () => {
    await navigator.clipboard.writeText(result.digest || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-xs text-foreground">{result.record.repo_url}</p>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
          {result.record.branch}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {stats.file_count} files · {stats.tracked_files} tracked · {stats.total_lines} lines
        </span>
      </div>

      {result.record.description && (
        <p className="text-xs leading-relaxed text-muted-foreground">{result.record.description}</p>
      )}

      <RepoArchitectureMap architecture={result.architecture} />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3 w-3" />
            digest · {stats.digest_chars} characters
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" onClick={copyDigest}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" asChild>
              <a href={sources.gitingest} target="_blank" rel="noreferrer">
                gitingest
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" asChild>
              <a href={sources.gitdiagram} target="_blank" rel="noreferrer">
                gitdiagram
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
        <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-background/60 p-3 font-mono text-[10px] leading-relaxed text-foreground/80">
          {result.digest}
        </pre>
      </div>
    </div>
  );
}