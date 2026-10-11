import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hammer, Layers, Copy, Check, Loader2, AlertCircle } from "lucide-react";

export default function RebuildPrompt({ analysis }) {
  const [prompt, setPrompt] = useState(analysis.rebuild_prompt || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [brand, setBrand] = useState("");
  const [style, setStyle] = useState("");
  const [whiteLabel, setWhiteLabel] = useState(analysis.white_label_prompt || "");
  const [wlLoading, setWlLoading] = useState(false);
  const [wlError, setWlError] = useState("");
  const [wlCopied, setWlCopied] = useState(false);

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

  const generateWhiteLabel = async () => {
    if (!brand.trim() || wlLoading) return;
    setWlError("");
    setWlLoading(true);
    try {
      const res = await base44.functions.invoke("generateRebuildPrompt", {
        analysis_id: analysis.id,
        brand_name: brand.trim(),
        style: style.trim()
      });
      setWhiteLabel(res.data.prompt);
    } catch (err) {
      setWlError((err && err.response && err.response.data && err.response.data.error) || (err && err.message) || "Generation failed.");
    }
    setWlLoading(false);
  };

  const copy = async (text, setCopiedFlag) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFlag(true);
      setTimeout(() => setCopiedFlag(false), 2000);
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
              <Button variant="outline" size="sm" onClick={() => copy(prompt, setCopied)}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy prompt"}
              </Button>
            </div>
            <pre className="whitespace-pre-wrap text-xs leading-relaxed bg-muted rounded-lg p-4 max-h-96 overflow-y-auto font-mono">
              {prompt}
            </pre>
          </>
        )}

        <div className="border-t pt-4 space-y-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="w-5 h-5 text-primary" />
            White-label clone prompt
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate the same rebuild as a new brand: unique identity, premium UI, full functional parity.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="New brand name (e.g. REVENGINE)"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Style (optional, e.g. Cyber-Minimalist)"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="flex-1"
            />
            <Button onClick={generateWhiteLabel} disabled={wlLoading || !brand.trim()}>
              {wlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              {wlLoading ? "Building..." : "Generate"}
            </Button>
          </div>
          {wlError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {wlError}
            </div>
          )}
          {whiteLabel && (
            <>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => copy(whiteLabel, setWlCopied)}>
                  {wlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {wlCopied ? "Copied" : "Copy white-label prompt"}
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed bg-muted rounded-lg p-4 max-h-96 overflow-y-auto font-mono">
                {whiteLabel}
              </pre>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}