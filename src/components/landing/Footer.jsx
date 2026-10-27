import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStartCheckout } from "@/hooks/use-start-checkout";

export default function Footer() {
  const startCheckout = useStartCheckout();

  return (
    <>
      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Stop guessing how it was built
          </h2>
          <p className="mt-4 text-muted-foreground">
            One payment per website. Its full map and prompt, yours for good.
          </p>
          <Button size="lg" className="mt-8 gap-2" onClick={startCheckout}>
            Analyze a website — $49.99
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      <footer className="bg-background">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-display font-semibold">
            <ScanLine className="w-4 h-4 text-primary" />
            REVENGINE
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
          <p className="text-xs text-muted-foreground">Payments by Base44 Payments</p>
        </div>
      </footer>
    </>
  );
}