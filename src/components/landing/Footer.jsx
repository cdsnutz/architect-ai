import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <>
      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Stop guessing how it was built
          </h2>
          <p className="mt-4 text-muted-foreground">
            Its full map and prompt, yours for good.
          </p>
          <Button size="lg" className="mt-8 gap-2" asChild>
            <Link to="/workspace">
              Analyze a website
              <ArrowRight className="w-4 h-4" />
            </Link>
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
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
          <p className="text-xs text-muted-foreground">Evidence in, blueprint out</p>
        </div>
      </footer>
    </>
  );
}