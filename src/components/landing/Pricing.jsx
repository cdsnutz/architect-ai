/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { ArrowRight, Check } from "lucide-react";
import TelemetryButton from "@/components/landing/TelemetryButton";

const PLANS = [
  {
    name: "Snapshot",
    price: "$1",
    unit: "per map",
    note: "Bought in a $20 pack of 20 credits. Pay as you go.",
    features: [
      "20 credits for $20, one credit per map",
      "Truth table as JSON with provenance per route",
      "Single verified host",
    ],
    cta: "Buy credits",
    highlight: false,
  },
  {
    name: "Sovereign Monitor",
    price: "$99",
    unit: "per month, per account",
    note: "Unlimited maps across up to 3 verified domains, re-mapped daily.",
    features: [
      "Email alert the moment any endpoint appears, disappears or changes behaviour",
      "JSON truth table with per-route provenance",
      "Ownership proof before any scan",
    ],
    fineprint: "Fair use: up to 5,000 maps per month, which is 55 maps per domain per day.",
    cta: "Start monitoring",
    highlight: true,
  },
  {
    name: "Self-hosted licence",
    price: "$2,500",
    unit: "per year",
    note: "Single tenant, inside your own VPC.",
    features: [
      "Runs in your estate, not ours",
      "One tenant, one deployment",
      "For firms whose client authorisation paperwork cannot leave the building",
    ],
    cta: "Talk to us",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="border-b border-line-soft px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="font-display text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[34px]">
          Pricing
        </h2>
        <p className="mt-3 max-w-[560px] text-[14.5px] leading-[1.6] text-ink-muted">
          One map, a watched host, or the whole engine in your own network.
        </p>

        <div className="mt-8 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "relative flex flex-col border border-[hsl(var(--signal)/0.55)] bg-[hsl(var(--signal)/0.05)] p-5 shadow-[0_0_0_1px_hsl(var(--signal)/0.25),0_30px_60px_-40px_hsl(var(--signal)/0.9)]"
                  : "flex flex-col border border-line bg-surface-panel p-5 transition-colors duration-200 hover:border-[hsl(var(--ink)/0.16)]"
              }
            >
              {plan.highlight && (
                <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--signal)),transparent)]" />
              )}

              <div className="flex min-h-6 items-start justify-between gap-2">
                <h3 className="font-display text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
                  {plan.name}
                </h3>
                {plan.highlight && (
                  <span className="whitespace-nowrap bg-signal px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--signal-foreground))]">
                    Recommended
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-baseline gap-1.5">
                <b className="font-display text-[34px] font-semibold leading-none tracking-[-0.035em] text-ink">
                  {plan.price}
                </b>
                <span className="text-[12px] text-ink-dim">{plan.unit}</span>
              </div>

              <p className="mt-2.5 text-[12.5px] leading-[1.55] text-ink-muted">{plan.note}</p>

              <div aria-hidden className="my-4 h-px bg-line-soft" />

              <ul className="flex flex-1 list-none flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-[12px] leading-[1.5] text-ink-muted">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.fineprint && (
                <p className="mt-3 border border-line-soft bg-[hsl(var(--surface-sunken))] px-2 py-1.5 text-[10.5px] leading-[1.5] text-ink-dim">
                  {plan.fineprint}
                </p>
              )}

              <TelemetryButton
                to="/workspace"
                variant={plan.highlight ? "solid" : "outline"}
                className="mt-5 w-full"
              >
                {plan.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </TelemetryButton>
            </div>
          ))}
        </div>

        <p className="mt-5 text-[12px] text-ink-dim">
          Every plan starts with the same ownership check. No verified host, no map.
        </p>
      </div>
    </section>
  );
}