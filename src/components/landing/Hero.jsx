import React from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStartCheckout } from "@/hooks/use-start-checkout";

const ASSURANCES = ["No subscription", "Unlimited maps", "Claude Code ready"];

const OUTPUT = [
  { label: "screens mapped", value: "14" },
  { label: "entities inferred", value: "23" },
  { label: "flows traced", value: "41" },
];

export default function Hero() {
  const startCheckout = useStartCheckout();

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[38rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-16 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
        <div>
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            One-time purchase · Lifetime access
          </span>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl font-bold leading-[1.08] tracking-tight">
            Turn any web app into a blueprint you can ship
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl">
            Paste a competitor&apos;s URL. REVENGINE maps its screens, data model and logic flows, then writes a reconstruction prompt you can hand straight to Claude Code.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="gap-2" onClick={startCheckout}>
              Get lifetime access — $129
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how">See how it works</a>
            </Button>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {ASSURANCES.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
          <div className="flex items-center gap-1.5 pb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
            <span className="ml-2 text-xs text-muted-foreground font-mono">revengine / map</span>
          </div>

          <div className="rounded-lg bg-background/70 border border-border/70 p-4 font-mono text-xs sm:text-sm leading-relaxed">
            <p className="text-muted-foreground">$ revengine map https://competitor.app</p>
            <div className="mt-4 space-y-2">
              {OUTPUT.map((row) => (
                <p key={row.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="text-foreground">{row.value}</span>
                </p>
              ))}
            </div>
            <p className="mt-4 border-t border-border/70 pt-4 text-primary">
              → prompt.md ready for Claude Code
            </p>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Every finding ships with the evidence behind it.
          </p>
        </div>
      </div>
    </section>
  );
}