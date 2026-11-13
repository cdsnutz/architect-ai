/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <section id="pricing" className="border-b border-border/60">
      <div className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            One map, a watched host, or the whole engine in your own network.
          </p>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "rounded-2xl border border-primary/40 bg-card p-6 shadow-xl flex flex-col"
                  : "rounded-2xl border border-border bg-card/40 p-6 flex flex-col"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                {plan.highlight && (
                  <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-primary-foreground">
                    Recommended
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold tracking-tight">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">{plan.unit}</span>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">{plan.note}</p>

              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.fineprint && (
                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/80">
                  {plan.fineprint}
                </p>
              )}

              <Button
                className="mt-7 gap-2"
                variant={plan.highlight ? "default" : "outline"}
                asChild
              >
                <Link to="/workspace">
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Every plan starts with the same ownership check. No verified host, no map.
        </p>
      </div>
    </section>
  );
}