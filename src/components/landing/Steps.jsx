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
        <code className="font-mono text-[11.5px] break-all text-[#E6EDF3]">
          _revengine-verify.&lt;your-domain&gt;
        </code>{" "}
        or drop a file at{" "}
        <code className="font-mono text-[11.5px] break-all text-[#E6EDF3]">
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
    <section id="steps" className="border-t border-[#1c2431] px-8 py-14">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#E6EDF3]">
          The three steps
        </h2>
        <p className="mt-2.5 max-w-[560px] text-[14px] leading-[1.55] text-[#9AA7B6]">
          From claiming a host to holding the evidence, in order.
        </p>

        <div className="mt-7 flex flex-col items-stretch md:flex-row">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.title}>
                {index > 0 && (
                  <div className="flex w-full shrink-0 items-center justify-center py-1 md:w-[26px] md:py-0">
                    <ArrowRight className="h-4 w-4 rotate-90 text-[#22C55E] md:rotate-0" />
                  </div>
                )}
                <div className="flex-1 border border-[#2b3646] bg-[#161B22] p-5 transition-[border-color,box-shadow] duration-200 hover:border-[#22C55E] hover:shadow-[0_0_22px_rgba(34,197,94,0.2)]">
                  <div className="flex items-center justify-between font-mono text-[12px] text-[#22C55E]">
                    0{index + 1}
                    <Icon className="h-4 w-4 text-[#9AA7B6]" />
                  </div>
                  <h3 className="mt-3.5 text-[16px] font-semibold text-[#E6EDF3]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[12.5px] leading-[1.55] text-[#9AA7B6]">
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