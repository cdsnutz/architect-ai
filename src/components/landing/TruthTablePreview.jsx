/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const ROWS = [
  { path: "/api/v1/users", label: "Declared", tone: "bg-[rgba(125,138,153,0.16)] text-[#9AA7B6]" },
  { path: "/account/billing", label: "Verified", tone: "bg-[rgba(34,197,94,0.14)] text-[#22C55E]" },
  { path: "/internal/export", label: "Hidden", tone: "bg-[rgba(250,204,21,0.14)] text-[#FACC15]" },
  { path: "/api/v1/orders/{id}", label: "Live", tone: "bg-[rgba(244,114,182,0.14)] text-[#F472B6]" },
  {
    path: "/api/v1/orders/{id}",
    label: "pattern_match",
    tone: "bg-[rgba(125,138,153,0.16)] text-[#9AA7B6]",
  },
];

export default function TruthTablePreview() {
  return (
    <div className="lt-up-late relative overflow-hidden border border-[#2b3646] bg-[#161B22] p-4 shadow-[0_0_40px_rgba(34,197,94,0.14),0_20px_40px_rgba(0,0,0,0.4)]">
      <span className="lt-scan pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-[linear-gradient(180deg,transparent,#22C55E,transparent)] shadow-[0_0_14px_2px_rgba(34,197,94,0.8)]" />

      <div className="mb-3 flex gap-1.5">
        <span className="block h-2 w-2 bg-[#2b3646]" />
        <span className="block h-2 w-2 bg-[#2b3646]" />
        <span className="block h-2 w-2 bg-[#2b3646]" />
      </div>

      {ROWS.map((row, index) => (
        <div
          key={`${row.label}-${index}`}
          className="mono flex items-center justify-between border-t border-[#222b38] py-[9px] font-mono text-[11.5px] text-[#C5D0DC]"
        >
          <span className="truncate pr-2">{row.path}</span>
          <span
            className={`shrink-0 px-[7px] py-[3px] text-[10px] font-bold uppercase tracking-[0.06em] ${row.tone}`}
          >
            {row.label}
          </span>
        </div>
      ))}
    </div>
  );
}