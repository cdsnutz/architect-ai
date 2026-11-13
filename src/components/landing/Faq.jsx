/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ITEMS = [
  {
    q: "What exactly do I get?",
    a: "A workspace where you paste any public URL and get a structured map of screens, entities and flows, plus a reconstruction prompt and a white-label variation you can hand to your coding agent.",
  },
  {
    q: "How does pricing work?",
    a: "No. Sign in and map as many websites as you need — there is no subscription, no renewal date, and no per-seat pricing.",
  },
  {
    q: "Do I need Claude Code?",
    a: "No. The prompts are plain structured text and work with any capable coding agent. Claude Code is simply the format they are tuned for.",
  },
  {
    q: "Can I analyze any website?",
    a: "Any publicly reachable web app. Pages that sit behind a login cannot be fetched, so private dashboards are out of scope.",
  },
  {
    q: "How fast is an analysis?",
    a: "Most maps finish in under a minute. You can keep several saved in your workspace and revisit them anytime.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="border-b border-border/60 bg-secondary/20">
      <div className="max-w-3xl mx-auto px-5 py-20">
        <h2 className="font-display text-3xl font-bold tracking-tight">Questions before you buy</h2>
        <Accordion type="single" collapsible className="mt-8">
          {ITEMS.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left text-sm sm:text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}