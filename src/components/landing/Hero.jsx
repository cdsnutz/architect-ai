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
    <section className="relative">
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_IMAGE}
          alt="Abstract network map of endpoints"
          fittingType="fill"
          className="h-full w-full opacity-35"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0D1117_20%,rgba(13,17,23,0.75)_60%,rgba(13,17,23,0.9))]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-8 px-8 pt-[52px] pb-14 md:grid-cols-[1fr_340px]">
        <div>
          <span className="inline-flex items-center gap-[7px] rounded-full border border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.1)] px-2.5 py-[5px] text-[11px] font-semibold text-[#22C55E]">
            <ShieldCheck className="h-3 w-3" />
            Ownership gate on every map
          </span>

          <h1 className="lt-up mt-[18px] text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#E6EDF3]">
            Your API documentation is a lie.
          </h1>

          <p className="mt-4 text-[14px] leading-[1.6] text-[#9AA7B6]">
            Between legacy endpoints, shadow APIs and developer leaks, the surface your app
            actually exposes is bigger than your docs claim. REVENGINE maps every reachable
            endpoint and shows you the evidence for each one.
          </p>

          <div className="mt-[22px] flex flex-col items-start gap-2.5">
            <TelemetryButton to="/workspace">
              Verify ownership, then get your truth table
              <ArrowRight className="h-3.5 w-3.5" />
            </TelemetryButton>
            <TelemetryButton href="#proof" variant="outline">
              See how the map is built
            </TelemetryButton>
          </div>

          <div className="mt-[22px] flex gap-2.5 rounded-lg border border-[#2b3646] border-l-2 border-l-[#38BDF8] bg-[rgba(22,27,34,0.85)] px-3.5 py-3 text-[12.5px] leading-[1.5] text-[#9AA7B6]">
            <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-[#38BDF8]" />
            <span>
              <b className="font-semibold text-[#E6EDF3]">The gate is the product.</b>{" "}
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