/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardPaste, Loader2 } from "lucide-react";

export default function PasteHtmlForm({ onSubmit, busy }) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [label, setLabel] = useState("");
  const [html, setHtml] = useState("");

  const ready = html.trim().length >= 200;
  const minChars = 200;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !busy) onSubmit({ source_url: sourceUrl, label, html });
      }}
      className="space-y-4 rounded-lg border p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="paste-source-url">Page URL (optional)</Label>
          <Input
            id="paste-source-url"
            placeholder="https://app.example.com/dashboard"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="paste-label">Page name (optional)</Label>
          <Input
            id="paste-label"
            placeholder="Dashboard"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="paste-html">Page HTML</Label>
        <Textarea
          id="paste-html"
          rows={8}
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="Sign in to the site, open the gated page, view its source, copy everything, and paste it here."
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          {html.length.toLocaleString()} characters pasted
          {ready ? " — ready to map." : ` — needs at least ${minChars}.`}
        </p>
      </div>

      <Button type="submit" disabled={!ready || busy} className="w-full sm:w-auto gap-2">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardPaste className="w-4 h-4" />}
        {busy ? "Mapping..." : "Map pasted page"}
      </Button>
    </form>
  );
}