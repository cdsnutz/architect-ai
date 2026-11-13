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
  "rounded-md px-3 py-2 text-[13px] text-[#9AA7B6] no-underline transition-colors duration-200 hover:bg-[#161B22] hover:text-[#E6EDF3] active:bg-[#1d2530] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]";

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

  const reached = Math.floor(progress * 4);

  return (
    <header className="sticky top-0 z-50 border-b border-[#222b38] bg-[#0D1117]">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex h-[60px] items-center justify-between px-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-[15px] font-bold tracking-[0.04em] text-[#E6EDF3] no-underline"
          >
            <ScanLine className="h-5 w-5 text-[#22C55E]" />
            REVENGINE
          </Link>

          <nav className="hidden items-center gap-1.5 md:flex">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} className={LINK_CLASS}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3.5">
            <Link
              to="/login"
              className="text-[13px] text-[#9AA7B6] no-underline transition-colors duration-200 hover:text-[#E6EDF3] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
            >
              Sign in
            </Link>
            <TelemetryButton to="/workspace">Verify a host</TelemetryButton>
          </div>
        </div>

        <div className="flex h-[3px] gap-1 px-8">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={`block h-[3px] flex-1 ${
                index < reached
                  ? "bg-[#22C55E]"
                  : index === reached
                    ? "bg-[#38BDF8]"
                    : "bg-[#1c2431]"
              }`}
            />
          ))}
        </div>
      </div>
    </header>
  );
}