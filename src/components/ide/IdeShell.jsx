/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import IdeTopBar from "@/components/ide/IdeTopBar";
import IdeRail from "@/components/ide/IdeRail";
import IdeStatusBar from "@/components/ide/IdeStatusBar";

export default function IdeShell({ active, crumb, note, sidebar = null, tabs = null, status = [], children }) {
  return (
    <div className="ide-surface flex min-h-screen flex-col bg-surface-base text-ink">
      <IdeTopBar crumb={crumb} note={note} />
      <div className="flex flex-1 items-start">
        <IdeRail active={active} />
        {sidebar}
        <div className="flex min-w-0 flex-1 flex-col">
          {tabs}
          <main className="flex-1">{children}</main>
          <IdeStatusBar items={status} />
        </div>
      </div>
    </div>
  );
}