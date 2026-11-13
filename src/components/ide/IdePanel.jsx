/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

export default function IdePanel({ label, right = null, bodyClassName = "", className = "", children }) {
  return (
    <section className={`border border-[#2b3646] bg-[#0F141B] ${className}`}>
      {(label || right) && (
        <div className="flex items-center justify-between gap-3 border-b border-[#1c2431] px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9AA7B6]">{label}</p>
          {right}
        </div>
      )}
      <div className={`p-3 ${bodyClassName}`}>{children}</div>
    </section>
  );
}