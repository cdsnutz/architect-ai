/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Link } from "react-router-dom";
import {
  Binary,
  Bug,
  Crosshair,
  FlaskConical,
  GitBranch,
  GitCompare,
  LayoutDashboard,
  Network,
  Route as RouteIcon,
  ScanLine,
  Waypoints,
  Workflow
} from "lucide-react";
import { CLONE_MODULES } from "@/lib/pipeline";
import { RAIL_TOOLKITS } from "@/lib/toolkits";

const ICONS = {
  pipeline: Workflow,
  workspace: ScanLine,
  lab: FlaskConical,
  symmetry: Network,
  spec: GitBranch,
  compare: GitCompare,
  dashboard: LayoutDashboard,
  structure: Waypoints,
  ghidra: Binary,
  "bug-hunter": Bug,
  shannon: Crosshair,
  "reverse-skill": RouteIcon
};

// Run order first, then the indexed toolkits that feed it.
const ITEMS = [
  ...CLONE_MODULES,
  ...RAIL_TOOLKITS.map((toolkit) => ({ key: toolkit.key, to: toolkit.route, label: toolkit.name }))
];

export default function IdeRail({ active }) {
  return (
    <nav
      aria-label="Workspace sections"
      className="sticky top-11 z-20 hidden h-[calc(100vh-2.75rem)] w-12 shrink-0 flex-col items-center gap-1 border-r border-line-soft bg-surface-sunken py-2 sm:flex"
    >
      {ITEMS.map((item) => {
        const Icon = ICONS[item.key] || Workflow;
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            to={item.to}
            title={item.label}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex h-9 w-9 items-center justify-center no-underline transition-colors ${
              isActive ? "bg-surface-raised text-signal" : "text-ink-dim hover:bg-surface-panel hover:text-ink"
            }`}
          >
            {isActive && <span className="absolute left-0 top-0 h-full w-0.5 bg-signal" />}
            <Icon className="h-4 w-4" />
          </Link>
        );
      })}
    </nav>
  );
}