/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Check, X } from "lucide-react";

const OLD_WAY = [
  "Weeks clicking through someone else's product",
  "Guesswork about how the data is actually modeled",
  "A spec that drifts from the app the moment you start",
];

const NEW_WAY = [
  "Every screen, entity and flow mapped in one pass",
  "A prompt that rebuilds the app in your stack, not theirs",
  "Evidence behind each assumption, ready to act on",
];

export default function ValueProof() {
  return (
    <section className="border-b border-border/60 bg-secondary/30">
      <div className="max-w-6xl mx-auto px-5 py-14">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">The old way</p>
            <h2 className="mt-2 font-display text-xl font-semibold">Reverse-engineering by hand</h2>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              {OLD_WAY.map((item) => (
                <li key={item} className="flex gap-3">
                  <X className="mt-0.5 w-4 h-4 shrink-0 text-destructive" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
            <p className="text-xs uppercase tracking-wider text-primary">With REVENGINE</p>
            <h2 className="mt-2 font-display text-xl font-semibold">One URL, one rebuild plan</h2>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              {NEW_WAY.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 w-4 h-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}