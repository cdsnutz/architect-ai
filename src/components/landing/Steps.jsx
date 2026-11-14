/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { ArrowRight, FileJson, Radar, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    icon: ShieldCheck,
    title: "Prove control",
    body: (
      <>
        Publish a DNS TXT record at{" "}
        <code className="break-all border border-line bg-[hsl(var(--surface-sunken))] px-1 font-mono text-[11px] text-ink">
          _revengine-verify.&lt;your-domain&gt;
        </code>{" "}
        or drop a file at{" "}
        <code className="break-all border border-line bg-[hsl(var(--surface-sunken))] px-1 font-mono text-[11px] text-ink">
          /.well-known/revengine-verify.txt
        </code>
        . Nothing is mapped until one of the two answers.
      </>
    ),
  },
  {
    icon: Radar,
    title: "Run the map",
    body: "The declared bundles are read, a real browser loads what it finds, prefix expansion looks for undocumented siblings, and runtime calls are confirmed.",
  },
  {
    icon: FileJson,
    title: "Receive the truth table",
    body: "You get it as JSON: every path with its status, its access and its provenance, ready to diff against your documentation.",
  },
];

export default function Steps() {
  return (
    <section id="steps" className="border-b border-line-soft px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="font-display text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[34px]">
          The three steps
        </h2>
        <p className="mt-3 max-w-[560px] text-[14.5px] leading-[1.6] text-ink-muted">
          From claiming a host to holding the evidence, in order.
        </p>

        <div className="mt-8 flex flex-col items-stretch gap-3 md:flex-row md:gap-0">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.title}>
                {index > 0 && (
                  <div className="flex w-full shrink-0 items-center justify-center py-0.5 md:w-8 md:py-0">
                    <ArrowRight className="h-4 w-4 rotate-90 text-ink-dim md:rotate-0" />
                  </div>
                )}
                <div className="group flex-1 border border-line bg-surface-panel p-5 transition-[border-color,box-shadow,background-color] duration-200 hover:border-[hsl(var(--signal)/0.45)] hover:bg-surface-raised hover:shadow-[0_18px_40px_-28px_hsl(var(--signal)/0.7)]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] tracking-[0.16em] text-signal">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center border border-line-soft bg-[hsl(var(--surface-sunken))]">
                      <Icon className="h-3.5 w-3.5 text-ink-muted transition-colors group-hover:text-signal" />
                    </span>
                  </div>
                  <h3 className="mt-3.5 font-display text-[15.5px] font-semibold tracking-[-0.01em] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[12.5px] leading-[1.65] text-ink-muted">
                    {step.body}
                  </p>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}