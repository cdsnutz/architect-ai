import React from "react";
import { Link } from "react-router-dom";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold tracking-tight">
          <ScanLine className="w-5 h-5 text-primary" />
          REVENGINE
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#features" className="hover:text-foreground transition-colors">Capabilities</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Button size="sm" asChild><Link to="/workspace">Get access</Link></Button>
        </div>
      </div>
    </header>
  );
}