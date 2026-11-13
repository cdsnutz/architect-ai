/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Link } from "react-router-dom";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[7px] border px-4 py-2.5 text-[13px] font-semibold no-underline transition-[background,box-shadow,border-color] duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]";

const VARIANTS = {
  solid:
    "border-transparent bg-[#22C55E] text-[#04130a] hover:bg-[#34d46f] hover:shadow-[0_0_18px_rgba(34,197,94,0.45)] active:bg-[#1aa84f]",
  outline:
    "border-[#2b3646] bg-transparent text-[#E6EDF3] hover:border-[#38BDF8] hover:bg-[#161B22] active:bg-[#0f141b]",
};

export default function TelemetryButton({ to, href, variant = "solid", className = "", children }) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={classes}>
      {children}
    </a>
  );
}