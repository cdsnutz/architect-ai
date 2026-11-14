/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function StageCard({ stage, index }) {
  return (
    <li className="border border-line-soft bg-surface-panel">
      <div className="flex items-start gap-3 p-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-line font-mono text-[10px] text-signal">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="font-display text-[13px] text-ink">{stage.label}</h3>
            <Link
              to={stage.module}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted no-underline hover:text-signal"
            >
              {stage.moduleLabel} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">{stage.does}</p>

          <dl className="mt-2 grid gap-1 sm:grid-cols-2">
            <div className="flex gap-2 text-[11px]">
              <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">out</dt>
              <dd className="text-ink">{stage.produces}</dd>
            </div>
            <div className="flex gap-2 text-[11px]">
              <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">gate</dt>
              <dd className="text-ink-muted">{stage.gate}</dd>
            </div>
          </dl>
        </div>
      </div>
    </li>
  );
}