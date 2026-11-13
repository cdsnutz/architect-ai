import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[38rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-5 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="w-3.5 h-3.5" />
          Ownership gate on every map
        </span>

        <h1 className="mt-6 font-display text-4xl sm:text-6xl font-bold leading-[1.05] tracking-tight">
          Your API documentation is a lie.
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Between legacy endpoints, shadow APIs and developer leaks, the surface your app
          actually exposes is bigger than your docs claim. REVENGINE maps every reachable
          endpoint and shows you the evidence for each one.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="gap-2" asChild>
            <Link to="/workspace">
              Verify ownership, then get your truth table
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#proof">See how the map is built</a>
          </Button>
        </div>

        <div className="mt-10 mx-auto max-w-2xl rounded-lg border border-border bg-card/60 px-5 py-4 text-left">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">The gate is the product.</span>{" "}
              REVENGINE maps nothing until you prove you control the host, and every run
              carries that authorisation with it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}