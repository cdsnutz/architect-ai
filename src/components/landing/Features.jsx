/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Database, FileCode, Layers, Palette, Workflow, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Layers,
    title: "Screen inventory",
    body: "Every page and view the app exposes, grouped by what it is for.",
  },
  {
    icon: Database,
    title: "Data model inference",
    body: "Entities, likely fields and relationships, derived from what the interface reveals.",
  },
  {
    icon: Workflow,
    title: "Logic flow tracing",
    body: "The sign-up, billing, search and CRUD paths users actually move through.",
  },
  {
    icon: FileCode,
    title: "Reconstruction prompts",
    body: "A build-ready prompt scoped to your stack, formatted for Claude Code.",
  },
  {
    icon: Palette,
    title: "White-label generator",
    body: "Rebrand the clone before you build: your name, your palette, your positioning.",
  },
  {
    icon: Zap,
    title: "Under a minute per map",
    body: "Analysis runs server-side, so you stay in flow instead of babysitting a scrape.",
  },
];

export default function Features() {
  return (
    <section id="features" className="border-b border-border/60 bg-secondary/20">
      <div className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Capabilities</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Everything you need to rebuild with confidence
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border bg-card p-6">
              <feature.icon className="w-5 h-5 text-primary" />
              <h3 className="mt-4 font-display text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}