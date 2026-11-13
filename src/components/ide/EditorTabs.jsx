/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { ClipboardPaste, Link2, Loader2 } from "lucide-react";

const TABS = [
  { key: "url", label: "url.map", icon: Link2 },
  { key: "html", label: "pasted.html", icon: ClipboardPaste },
];

export default function EditorTabs({ mode, onChange, busy, right = null }) {
  return (
    <div className="flex h-9 shrink-0 items-stretch justify-between border-b border-[#1c2431] bg-[#0B0F14]">
      <div className="flex items-stretch overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.key === mode;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative flex items-center gap-1.5 border-r border-[#1c2431] px-3 font-mono text-[11px] transition-colors ${
                isActive
                  ? "bg-[#0F141B] text-[#E6EDF3]"
                  : "text-[#7d8a99] hover:bg-[#11161D] hover:text-[#E6EDF3]"
              }`}
            >
              {isActive && <span className="absolute inset-x-0 top-0 h-0.5 bg-[#22C55E]" />}
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#22C55E]" : ""}`} />
              {tab.label}
              {isActive && busy && <Loader2 className="h-3 w-3 animate-spin text-[#22C55E]" />}
            </button>
          );
        })}
      </div>

      {right && <div className="flex items-center gap-1 px-2">{right}</div>}
    </div>
  );
}