/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Link } from "react-router-dom";
import { Mail, ScanLine } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background">
      <div className="max-w-6xl mx-auto px-5 py-14">
        <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <h2 className="font-display text-xl font-semibold">
              Need a session-aware map of an authenticated area?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Tell us which host and which signed-in surfaces you want covered, and we will
              scope the run with you.
            </p>
          </div>
          <a
            href="mailto:support@klswitch.app?subject=Session-aware%20map%20request"
            className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/15 transition-colors"
          >
            <Mail className="w-4 h-4" />
            support@klswitch.app
          </a>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-display font-semibold">
            <ScanLine className="w-4 h-4 text-primary" />
            REVENGINE
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#proof" className="hover:text-foreground transition-colors">The proof</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
          <p className="text-xs text-muted-foreground">Evidence in, truth table out</p>
        </div>

        <p className="mt-8 border-t border-border pt-6 text-center sm:text-left text-xs text-muted-foreground">
          © {new Date().getFullYear()} Unsaved Changes LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}