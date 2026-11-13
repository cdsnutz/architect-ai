/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Button } from "@/components/ui/button";

export default function TelemetryFilters({ onlyDeclined, onlySignoff, declinedCount, onToggleDeclined, onToggleSignoff }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        type="button"
        size="sm"
        variant={onlyDeclined ? "default" : "outline"}
        className="h-7 gap-1.5 px-2 text-[11px]"
        onClick={onToggleDeclined}
      >
        Declined only
        <span className="font-mono text-[10px] opacity-70">{declinedCount}</span>
      </Button>
      <Button
        type="button"
        size="sm"
        variant={onlySignoff ? "default" : "outline"}
        className="h-7 px-2 text-[11px]"
        onClick={onToggleSignoff}
      >
        Sign-off conversations only
      </Button>
    </div>
  );
}