/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Image } from "@/components/ui/image";
import TelemetryButton from "@/components/landing/TelemetryButton";
import TruthTablePreview from "@/components/landing/TruthTablePreview";

const HERO_IMAGE =
  "https://media.base44.com/images/public/6acbfbcf65532c58a25774fd/fae447e9a_generated_23907d33.jpg";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line-soft">
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_IMAGE}
          alt="Abstract network map of endpoints"
          fittingType="fill"
          className="h-full w-full opacity-30"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--surface-base))_14%,hsl(var(--surface-base)/0.82)_58%,hsl(var(--surface-base)/0.94))]" />
        <div className="rev-grid absolute inset-0 opacity-[0.45]" />
        <div className="rev-glow absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-10 px-6 pb-16 pt-14 sm:px-8 md:grid-cols-[minmax(0,1fr)_350px] md:pt-20">
        <div>
          <span className="inline-flex items-center gap-[7px] border border-[hsl(var(--signal)/0.35)] bg-[hsl(var(--signal)/0.09)] px-2.5 py-[5px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-signal">
            <ShieldCheck className="h-3 w-3" />
            Ownership gate on every map
          </span>

          <h1 className="lt-up mt-5 max-w-[15ch] font-display text-[36px] font-semibold leading-[1.04] tracking-[-0.035em] text-ink sm:text-[46px] lg:text-[54px]">
            Your API documentation is a lie.
          </h1>

          <p className="mt-5 max-w-[560px] text-[14.5px] leading-[1.65] text-ink-muted">
            Between legacy endpoints, shadow APIs and developer leaks, the surface your app
            actually exposes is bigger than your docs claim. REVENGINE maps every reachable
            endpoint and shows you the evidence for each one.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <TelemetryButton to="/workspace">
              Verify ownership, then get your truth table
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </TelemetryButton>
            <TelemetryButton href="#proof" variant="outline">
              See how the map is built
            </TelemetryButton>
          </div>

          <div className="mt-8 flex max-w-[560px] gap-3 border border-line-soft border-l-2 border-l-signal bg-[hsl(var(--surface-panel)/0.85)] px-4 py-3.5 backdrop-blur-sm">
            <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-signal" />
            <span className="text-[12.5px] leading-[1.6] text-ink-muted">
              <b className="font-semibold text-ink">The gate is the product.</b>{" "}
              REVENGINE maps nothing until you prove you control the host, and every run
              carries that authorisation with it.
            </span>
          </div>
        </div>

        <TruthTablePreview />
      </div>
    </section>
  );
}