/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Check, Radar, X } from "lucide-react";

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
    <section id="proof" className="border-b border-line-soft px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="max-w-[760px] font-display text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[34px]">
          The proof
        </h2>
        <p className="mt-3 max-w-[560px] text-[14.5px] leading-[1.6] text-ink-muted">
          Anyone can produce a list of URLs. The difference is what stands behind each line
          of that list.
        </p>

        <div className="mt-8 grid grid-cols-1 overflow-hidden border border-line bg-surface-panel md:grid-cols-[1fr_1.15fr]">
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-[15px] font-semibold text-ink">Guesswork scanner</h3>
              <span className="whitespace-nowrap border border-[hsl(330_70%_66%/0.35)] bg-[hsl(330_70%_66%/0.12)] px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-[hsl(330_70%_66%)]">
                probably
              </span>
            </div>

            <ul className="mt-4 flex list-none flex-col gap-3">
              {GUESSWORK.map((item) => (
                <li key={item} className="flex gap-2.5 text-[12.5px] leading-[1.55] text-ink-muted">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(330_70%_66%)]" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-5 border-t border-line-soft pt-4 text-[12.5px] leading-[1.6] text-ink-muted">
              The result is one word:{" "}
              <b className="font-medium text-[hsl(330_70%_66%)]">&ldquo;probably&rdquo;</b>. No
              provenance, so nobody downstream can check it.
            </p>
          </div>

          <div className="relative border-t border-line bg-[hsl(var(--surface-raised)/0.4)] p-5 sm:p-6 md:border-l md:border-t-0">
            <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,hsl(var(--signal)),transparent_70%)]" />

            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
                <Radar className="h-4 w-4 text-signal" />
                REVENGINE
              </h3>
              <span className="whitespace-nowrap border border-[hsl(var(--signal)/0.35)] bg-[hsl(var(--signal)/0.12)] px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-signal">
                each stage proves something
              </span>
            </div>

            <ul className="mt-4 flex list-none flex-col gap-3">
              {STAGES.map((stage, index) => (
                <li key={stage.label} className="flex gap-2.5 text-[12.5px] leading-[1.55] text-ink-muted">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
                  <p>
                    <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                      {String(index + 1).padStart(2, "0")} · {stage.label}
                    </span>
                    {stage.proves}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-5 border-t border-line-soft pt-4 text-[12.5px] leading-[1.6] text-ink-muted">
              Every route carries its provenance, so you always know which of the four
              stages put it in the table.
            </p>
            <p className="mt-2.5 text-[12.5px] leading-[1.6] text-ink-muted">
              Templated routes are reported as{" "}
              <code className="border border-[hsl(var(--signal)/0.3)] bg-[hsl(var(--signal)/0.08)] px-1 font-mono text-[11.5px] text-signal">
                pattern_match
              </code>{" "}
              instead of being probed with literal braces.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}