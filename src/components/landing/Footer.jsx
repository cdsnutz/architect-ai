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
      <div className="mx-auto max-w-[1280px] px-8">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[14px] border border-[#2b3646] bg-[#161B22] p-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#E6EDF3]">
              Need a session-aware map of an authenticated area?
            </h2>
            <p className="mt-2 max-w-[440px] text-[12.5px] leading-[1.55] text-[#9AA7B6]">
              Tell us which host and which signed-in surfaces you want covered, and we will
              scope the run with you.
            </p>
          </div>
          <a
            href="mailto:support@klswitch.app?subject=Session-aware%20map%20request"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-[7px] border border-[rgba(56,189,248,0.45)] bg-[rgba(56,189,248,0.1)] px-3.5 py-2.5 text-[13px] font-semibold text-[#38BDF8] no-underline transition-colors duration-200 hover:bg-[rgba(56,189,248,0.2)] cursor-pointer"
          >
            <Mail className="h-4 w-4" />
            support@klswitch.app
          </a>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 pb-7 sm:flex-row">
          <Link
            to="/"
            className="flex items-center gap-2 text-[15px] font-bold tracking-[0.04em] text-[#E6EDF3] no-underline"
          >
            <ScanLine className="h-[18px] w-[18px] text-[#22C55E]" />
            REVENGINE
          </Link>
          <div className="flex items-center gap-5 text-[13px]">
            <a
              href="#proof"
              className="text-[#9AA7B6] no-underline transition-colors duration-200 hover:text-[#E6EDF3] cursor-pointer"
            >
              The proof
            </a>
            <a
              href="#pricing"
              className="text-[#9AA7B6] no-underline transition-colors duration-200 hover:text-[#E6EDF3] cursor-pointer"
            >
              Pricing
            </a>
            <Link
              to="/login"
              className="text-[#9AA7B6] no-underline transition-colors duration-200 hover:text-[#E6EDF3] cursor-pointer"
            >
              Sign in
            </Link>
          </div>
          <p className="text-[11.5px] text-[#7d8a99]">Evidence in, truth table out</p>
        </div>

        <p className="border-t border-[#222b38] pt-5 pb-7 text-[11.5px] text-[#7d8a99]">
          © {new Date().getFullYear()} Unsaved Changes LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}