import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hammer, Copy, Check, Loader2, AlertCircle } from "lucide-react";

export default function RebuildPrompt({ analysis }) {
  const [prompt, setPrompt] = useState(analysis.rebuild_prompt || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("generateRebuildPrompt", { analysis_id: analysis.id });
      setPrompt(res.data.prompt);
    } catch (err) {
      setError((err && err.response && err.response.data && err.response.data.error) || (err && err.message) || "Generation failed.");
    }
    setLoading(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — user can select the text manually
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Hammer className="w-5 h-5" />
          Reconstruction prompt for Claude Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!prompt && !loading && !error && (
          <Button onClick={generate}>
            <Hammer className="w-4 h-4" />
            Generate Claude Code prompt
          </Button>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Drafting the full reconstruction prompt...
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {prompt && (
          <>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy prompt"}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap text-xs leading-relaxed bg-muted rounded-lg p-4 max-h-96 overflow-y-auto font-mono">
              {prompt}
            </pre>
          </>
        )}
      </CardContent>
    </Card>
  );
}