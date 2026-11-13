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
    <section id="proof" className="border-t border-[#1c2431] px-8 py-14">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#E6EDF3]">
          The proof
        </h2>
        <p className="mt-2.5 max-w-[560px] text-[14px] leading-[1.55] text-[#9AA7B6]">
          Anyone can produce a list of URLs. The difference is what stands behind each line
          of that list.
        </p>

        <div className="mt-7 grid grid-cols-1 overflow-hidden rounded-[14px] border border-[#2b3646] bg-[#161B22] md:grid-cols-[1fr_1.15fr]">
          <div className="p-[22px]">
            <div className="flex items-center justify-between gap-2.5">
              <h3 className="text-[16px] font-semibold text-[#E6EDF3]">Guesswork scanner</h3>
              <span className="whitespace-nowrap rounded-[5px] bg-[rgba(244,114,182,0.14)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-[#F472B6]">
                probably
              </span>
            </div>

            <ul className="mt-4 flex list-none flex-col gap-[13px]">
              {GUESSWORK.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-[12.5px] leading-[1.5] text-[#9AA7B6]"
                >
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F472B6]" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-[18px] border-t border-[#2b3646] pt-4 text-[12.5px] leading-[1.55] text-[#9AA7B6]">
              The result is one word:{" "}
              <b className="font-medium text-[#38BDF8]">&ldquo;probably&rdquo;</b>. No
              provenance, so nobody downstream can check it.
            </p>
          </div>

          <div className="border-t border-[#2b3646] bg-[#131a22] p-[22px] md:border-l md:border-t-0">
            <div className="flex items-center justify-between gap-2.5">
              <h3 className="flex items-center gap-2 text-[16px] font-semibold text-[#E6EDF3]">
                <Radar className="h-4 w-4 text-[#22C55E]" />
                REVENGINE
              </h3>
              <span className="whitespace-nowrap rounded-[5px] bg-[rgba(34,197,94,0.14)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-[#22C55E]">
                each stage proves something
              </span>
            </div>

            <ul className="mt-4 flex list-none flex-col gap-[13px]">
              {STAGES.map((stage) => (
                <li
                  key={stage.label}
                  className="flex gap-2.5 text-[12.5px] leading-[1.5] text-[#9AA7B6]"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#22C55E]" />
                  <p>
                    <span className="mb-0.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-[#E6EDF3]">
                      {stage.label}
                    </span>
                    {stage.proves}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-[18px] border-t border-[#2b3646] pt-4 text-[12.5px] leading-[1.55] text-[#9AA7B6]">
              Every route carries its provenance, so you always know which of the four
              stages put it in the table.
            </p>
            <p className="mt-2.5 text-[12.5px] leading-[1.55] text-[#9AA7B6]">
              Templated routes are reported as{" "}
              <code className="font-mono text-[#38BDF8]">pattern_match</code> instead of
              being probed with literal braces.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}