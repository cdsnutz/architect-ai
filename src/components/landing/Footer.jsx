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
    <footer>
      <div className="mx-auto max-w-[1280px] px-6 pt-14 sm:px-8">
        <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden border border-line bg-surface-panel p-6 md:flex-row md:items-center">
          <div aria-hidden className="rev-glow pointer-events-none absolute inset-x-0 -top-24 h-48" />
          <div className="relative">
            <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-ink">
              Need a session-aware map of an authenticated area?
            </h2>
            <p className="mt-2 max-w-[440px] text-[12.5px] leading-[1.6] text-ink-muted">
              Tell us which host and which signed-in surfaces you want covered, and we will
              scope the run with you.
            </p>
          </div>
          <a
            href="mailto:support@klswitch.app?subject=Session-aware%20map%20request"
            className="relative inline-flex items-center gap-2 whitespace-nowrap border border-[hsl(var(--signal)/0.4)] bg-[hsl(var(--signal)/0.1)] px-3.5 py-2.5 text-[13px] font-semibold text-signal no-underline transition-colors duration-200 hover:border-[hsl(var(--signal)/0.7)] hover:bg-[hsl(var(--signal)/0.18)] cursor-pointer"
          >
            <Mail className="h-4 w-4" />
            support@klswitch.app
          </a>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <Link to="/" className="group flex items-center gap-2.5 no-underline">
            <span className="flex h-6 w-6 items-center justify-center border border-[hsl(var(--signal)/0.35)] bg-[hsl(var(--signal)/0.1)]">
              <ScanLine className="h-3.5 w-3.5 text-signal" strokeWidth={2.1} />
            </span>
            <span className="font-display text-[12.5px] font-bold uppercase tracking-[0.16em] text-ink">
              REVENGINE
            </span>
          </Link>
          <div className="flex items-center gap-6 text-[12.5px]">
            <a
              href="#proof"
              className="text-ink-muted no-underline transition-colors duration-200 hover:text-ink cursor-pointer"
            >
              The proof
            </a>
            <a
              href="#pricing"
              className="text-ink-muted no-underline transition-colors duration-200 hover:text-ink cursor-pointer"
            >
              Pricing
            </a>
            <Link
              to="/login"
              className="text-ink-muted no-underline transition-colors duration-200 hover:text-ink cursor-pointer"
            >
              Sign in
            </Link>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">Evidence in, truth table out</p>
        </div>

        <p className="border-t border-line-soft py-6 text-[11.5px] text-ink-dim">
          © {new Date().getFullYear()} Unsaved Changes LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}