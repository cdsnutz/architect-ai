import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStartCheckout } from "@/hooks/use-start-checkout";

const INCLUDED = [
  "Full logic map of one website",
  "Claude Code–ready rebuild prompt",
  "White-label clone generator",
  "Saved so you can reopen it anytime",
  "No subscription, no renewal",
];

export default function Pricing() {
  const startCheckout = useStartCheckout();

  return (
    <section id="pricing" className="border-b border-border/60">
      <div className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium text-primary">Pricing</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            $49.99 per website. Paid once.
          </h2>
          <p className="mt-4 text-muted-foreground">
            No subscription, no seats, no renewals. You pay per site you want to reverse-engineer — nothing else.
          </p>
        </div>

        <div className="mt-12 max-w-xl mx-auto rounded-2xl border border-primary/40 bg-card p-8 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold">Website teardown</h3>
              <p className="text-sm text-muted-foreground">One site, fully reverse-engineered</p>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              One-time
            </span>
          </div>

          <div className="mt-6 flex items-end gap-2">
            <span className="font-display text-5xl font-bold tracking-tight">$49.99</span>
            <span className="pb-1.5 text-sm text-muted-foreground">USD per website</span>
          </div>

          <Button className="mt-6 w-full" size="lg" onClick={startCheckout}>
            Analyze a website — $49.99
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Secure checkout · Access right after payment · No subscription
          </p>

          <ul className="mt-7 space-y-3 border-t border-border/70 pt-7 text-sm">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-3">
                <Check className="mt-0.5 w-4 h-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}