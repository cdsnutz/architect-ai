import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileCode2, Loader2 } from "lucide-react";

const MAX_FILES = 12;
const EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json", ".sql", ".prisma"];

export default function AnalyzePanel({ onAnalyzed }) {
  const [label, setLabel] = useState("Local checkout");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (event) => {
    const chosen = Array.from(event.target.files || [])
      .filter((file) => EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension)))
      .slice(0, MAX_FILES);
    const read = await Promise.all(
      chosen.map(async (file) => ({ name: file.name, content: (await file.text()).slice(0, 90000) }))
    );
    setFiles(read);
    setError(read.length ? "" : "Those files are not JavaScript, TypeScript, SQL or Prisma sources.");
  };

  const analyze = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("reaTools", { action: "analyze", label, files });
      setFiles([]);
      if (onAnalyzed) onAnalyzed(response.data.analysis);
    } catch (err) {
      setError((err && err.response && err.response.data && err.response.data.error) || "The source pass failed.");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="flex items-center gap-2 text-sm font-medium">
          <FileCode2 className="w-4 h-4" />
          Analyze checkout
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          A source-level pass over your own modules: imports, outbound requests, route handlers, models and env usage.
          The files are read in your browser and sent once for this pass.
        </p>
      </div>

      <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Local checkout" />
      <input
        type="file"
        multiple
        accept={EXTENSIONS.join(",")}
        onChange={pick}
        className="block w-full cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:text-secondary-foreground"
      />

      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((file) => (
            <Badge key={file.name} variant="outline" className="font-mono text-[10px]">
              {file.name} · {Math.round(file.content.length / 1000)}k
            </Badge>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={analyze} disabled={busy || !files.length || !label.trim()} size="sm">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? "Running pods…" : "Analyze source"}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}