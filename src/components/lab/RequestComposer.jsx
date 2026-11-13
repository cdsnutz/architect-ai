/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";

export const FOCUS_OPTIONS = [
  { key: "legacy_migration", label: "Legacy migration", hint: "Hidden writes, orphaned tables" },
  { key: "production_incident", label: "Production incident", hint: "Cascades, retries, clock skew" },
  { key: "adversarial_integration", label: "Adversarial integration", hint: "Contract erosion, silent 200s" },
  { key: "custom", label: "Custom", hint: "Any read-only question" }
];

const EXAMPLES = [
  "We are migrating a billing portal off an old PHP monolith. I need to know which writes happen with no read path so nothing gets orphaned.",
  "Checkout succeeds but orders sometimes double-charge on retry. Trace the action to the request to the row it writes.",
  "A partner API started returning 200 with empty payloads. Find where our integration would silently store nothing."
];

export default function RequestComposer({ value, onChange, focus, onFocus, hosts, onHosts, onSubmit, busy, error }) {
  return (
    <Card className="border-border/80">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Natural-language data request
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            read-only
          </span>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <Textarea
            rows={4}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Describe the engineering problem, the system it lives in, and what you need evidence for."
            className="resize-none bg-background/60 text-sm leading-relaxed"
          />

          <div className="grid gap-2 sm:grid-cols-2">
            {FOCUS_OPTIONS.map((option) => {
              const active = focus === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onFocus(option.key)}
                  className={
                    "rounded-lg border px-3 py-2 text-left transition-colors " +
                    (active
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40 hover:bg-accent/40")
                  }
                >
                  <p className={"text-sm font-medium " + (active ? "text-primary" : "text-foreground")}>
                    {option.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{option.hint}</p>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Hosts you authorize
            </p>
            <Input
              value={hosts}
              onChange={(event) => onHosts(event.target.value)}
              placeholder="https://staging.example.com/checkout, https://api.example.com"
              className="bg-background/60 font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Comma separated. Only these public hosts can be read — private, internal and platform addresses are refused.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Try one</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onChange(example)}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {example.slice(0, 46)}…
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
            <p className="max-w-sm text-[11px] leading-relaxed text-muted-foreground">
              You get a plan first: targets, questions, and the exact read-only probes. Nothing runs until you authorize it.
            </p>
            <Button type="submit" disabled={busy || !value.trim()} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {busy ? "Drafting plan" : "Draft the plan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}