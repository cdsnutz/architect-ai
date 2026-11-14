/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Link } from "react-router-dom";

const BASE =
  "group inline-flex items-center justify-center gap-2 border px-5 py-3 text-[13px] font-semibold tracking-[-0.01em] no-underline transition-[background-color,box-shadow,border-color,transform] duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

const VARIANTS = {
  solid:
    "border-transparent bg-signal text-[hsl(var(--signal-foreground))] shadow-[inset_0_1px_0_hsl(var(--ink)/0.22),0_12px_28px_-16px_hsl(var(--signal)/0.95)] hover:bg-[hsl(var(--signal)/0.92)] hover:shadow-[0_0_0_1px_hsl(var(--signal)/0.45),0_14px_32px_-14px_hsl(var(--signal)/0.8)] active:translate-y-px",
  outline:
    "border-line bg-[hsl(var(--surface-panel)/0.7)] text-ink hover:border-[hsl(var(--signal)/0.55)] hover:bg-surface-raised hover:shadow-[0_0_24px_-12px_hsl(var(--signal)/0.6)] active:translate-y-px",
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