/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { X, Check, Radar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const GUESSWORK = [
  "Guesses /admin, /api/v1, /test and calls whatever answers a hit.",
  "Reports a number of endpoints found.",
  "Cannot tell a real endpoint from a catch-all redirect.",
];

const STAGES = [
  { label: "Declared", proves: "The app's own JS bundles name the route." },
  { label: "Verified", proves: "A real browser loaded it." },
  { label: "Hidden", proves: "Prefix expansion found a sibling nobody documented." },
  { label: "Live", proves: "A page called it at runtime and a browser then proved it." },
];

export default function ProofCompare() {
  return (
    <section id="proof" className="border-b border-border/60">
      <div className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            The proof
          </h2>
          <p className="mt-4 text-muted-foreground">
            Anyone can produce a list of URLs. The difference is what stands behind each
            line of that list.
          </p>
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-semibold">Guesswork scanner</h3>
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                probably
              </Badge>
            </div>

            <ul className="mt-6 space-y-4">
              {GUESSWORK.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <X className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-6 border-t border-border/70 pt-5 text-sm text-muted-foreground">
              The result is one word: <span className="text-foreground">&ldquo;probably&rdquo;</span>.
              No provenance, so nobody downstream can check it.
            </p>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <Radar className="w-4 h-4 text-primary" />
                REVENGINE
              </h3>
              <Badge className="bg-primary/15 text-primary border-transparent hover:bg-primary/15">
                each stage proves something
              </Badge>
            </div>

            <ul className="mt-6 space-y-4">
              {STAGES.map((stage) => (
                <li key={stage.label} className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <p className="text-sm">
                    <span className="font-mono text-xs uppercase tracking-wide text-foreground">
                      {stage.label}
                    </span>
                    <span className="block text-muted-foreground">{stage.proves}</span>
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-border/70 pt-5 space-y-3 text-sm text-muted-foreground">
              <p>
                Every route carries its provenance, so you always know which of the four
                stages put it in the table.
              </p>
              <p>
                Templated routes are reported as{" "}
                <span className="font-mono text-foreground">pattern_match</span> instead of
                being probed with literal braces.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}