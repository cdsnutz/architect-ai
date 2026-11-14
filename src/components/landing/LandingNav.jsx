/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScanLine } from "lucide-react";
import TelemetryButton from "@/components/landing/TelemetryButton";

const LINKS = [
  { href: "#proof", label: "The proof" },
  { href: "#steps", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

const LINK_CLASS =
  "px-3 py-1.5 text-[13px] text-ink-muted no-underline transition-colors duration-200 hover:bg-[hsl(var(--surface-raised)/0.8)] hover:text-ink active:bg-surface-raised cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

export default function LandingNav() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-[hsl(var(--surface-base)/0.82)] backdrop-blur-xl">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex h-16 items-center justify-between px-6 sm:px-8">
          <Link to="/" className="group flex items-center gap-2.5 no-underline">
            <span className="flex h-7 w-7 items-center justify-center border border-[hsl(var(--signal)/0.35)] bg-[hsl(var(--signal)/0.1)] transition-colors group-hover:bg-[hsl(var(--signal)/0.18)]">
              <ScanLine className="h-4 w-4 text-signal" strokeWidth={2.1} />
            </span>
            <span className="font-display text-[14px] font-bold uppercase tracking-[0.16em] text-ink">
              REVENGINE
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} className={LINK_CLASS}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden text-[13px] text-ink-muted no-underline transition-colors duration-200 hover:text-ink sm:block cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              Sign in
            </Link>
            <TelemetryButton to="/workspace" className="px-4 py-2.5 text-[12.5px]">
              Verify a host
            </TelemetryButton>
          </div>
        </div>

        <div className="h-[2px] bg-[hsl(var(--surface-raised))]" aria-hidden>
          <div
            className="h-full bg-signal shadow-[0_0_10px_hsl(var(--signal)/0.7)] transition-[width] duration-150"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </header>
  );
}