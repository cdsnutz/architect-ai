/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const STEPS = [
  {
    number: "01",
    title: "Drop the URL",
    body: "Point REVENGINE at any publicly reachable web app. No access, no credentials, no scraping rules to fight.",
  },
  {
    number: "02",
    title: "Get the logic map",
    body: "Screens, entities, relationships and the user flows that connect them — structured, not a wall of notes.",
  },
  {
    number: "03",
    title: "Ship from the prompt",
    body: "Generate a reconstruction prompt, then hand it to Claude Code to build your own white-label version.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-b border-border/60">
      <div className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            From someone else&apos;s app to your own build
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three steps, one sitting. Most analyses finish in under a minute.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="rounded-xl border border-border bg-card p-6">
              <span className="font-mono text-sm text-primary">{step.number}</span>
              <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}