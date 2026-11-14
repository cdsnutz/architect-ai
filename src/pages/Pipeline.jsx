/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import IdeShell from "@/components/ide/IdeShell";
import StageCard from "@/components/pipeline/StageCard";
import { CLONE_STAGES } from "@/lib/pipeline";
import { TOOLKIT_LIST } from "@/lib/toolkits";

export default function Pipeline() {
  return (
    <IdeShell
      active="pipeline"
      crumb="Pipeline / full clone runbook"
      note="eleven stages · evidence before claims"
      status={[
        { label: "stages", value: String(CLONE_STAGES.length) },
        { label: "toolkits", value: String(TOOLKIT_LIST.length) },
        { label: "order", value: "capture → book" }
      ]}
    >
      <div className="mx-auto max-w-4xl space-y-4 p-4">
        <div className="border border-line-soft bg-surface-panel p-3">
          <h1 className="font-display text-sm text-ink">Run a full clone in this order</h1>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
            Every module in the rail sits inside one of these stages. A stage closes only when its gate holds, and the
            output of each one is what the next reads, so a run can be traced back from the clone to the evidence it
            rests on.
          </p>
        </div>

        <ol className="space-y-2">
          {CLONE_STAGES.map((stage, index) => (
            <StageCard key={stage.key} stage={stage} index={index} />
          ))}
        </ol>

        <div className="border border-line-soft bg-surface-panel">
          <div className="border-b border-line-soft p-3">
            <h2 className="font-display text-sm text-ink">Toolkits on hand</h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              Indexed, never executed here. Each one plugs into the stage named beside it.
            </p>
          </div>
          <ul className="divide-y divide-line-soft">
            {TOOLKIT_LIST.map((toolkit) => (
              <li key={toolkit.key} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[12px] text-ink">{toolkit.name}</p>
                  <p className="font-mono text-[10px] text-ink-dim">
                    {toolkit.source || toolkit.owner + "/" + toolkit.repo} · {toolkit.role}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
                    {toolkit.plugsIn}
                  </span>
                  <Link
                    to={toolkit.route}
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted no-underline hover:text-signal"
                  >
                    open <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </IdeShell>
  );
}