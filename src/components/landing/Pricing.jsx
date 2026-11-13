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
    <section id="pricing" className="border-t border-[#1c2431] px-8 py-14">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#E6EDF3]">
          Pricing
        </h2>
        <p className="mt-2.5 max-w-[560px] text-[14px] leading-[1.55] text-[#9AA7B6]">
          One map, a watched host, or the whole engine in your own network.
        </p>

        <div className="mt-7 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "flex flex-col rounded-[14px] border border-[#22C55E] bg-[#14201d] p-5 shadow-[0_0_0_1px_rgba(34,197,94,0.5),0_0_34px_rgba(34,197,94,0.3)]"
                  : "flex flex-col rounded-[14px] border border-[#2b3646] bg-[#161B22] p-5"
              }
            >
              <div className="flex min-h-6 items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-[#E6EDF3]">{plan.name}</h3>
                {plan.highlight && (
                  <span className="whitespace-nowrap rounded-full bg-[#22C55E] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#04130a]">
                    Recommended
                  </span>
                )}
              </div>

              <div className="mt-3.5 flex flex-wrap items-baseline gap-1.5">
                <b className="text-[34px] font-semibold tracking-[-0.03em] text-[#E6EDF3]">
                  {plan.price}
                </b>
                <span className="text-[12px] text-[#9AA7B6]">{plan.unit}</span>
              </div>

              <p className="mt-2.5 text-[12.5px] leading-[1.5] text-[#9AA7B6]">{plan.note}</p>

              <ul className="mt-4 flex flex-1 list-none flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex gap-2 text-[12px] leading-[1.45] text-[#C5D0DC]"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#22C55E]" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.fineprint && (
                <p className="mt-3 text-[10.5px] leading-[1.5] text-[#7d8a99]">
                  {plan.fineprint}
                </p>
              )}

              <TelemetryButton
                to="/workspace"
                variant={plan.highlight ? "solid" : "outline"}
                className="mt-[18px]"
              >
                {plan.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </TelemetryButton>
            </div>
          ))}
        </div>

        <p className="mt-[18px] text-[12px] text-[#7d8a99]">
          Every plan starts with the same ownership check. No verified host, no map.
        </p>
      </div>
    </section>
  );
}