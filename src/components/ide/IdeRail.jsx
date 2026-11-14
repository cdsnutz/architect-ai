/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Binary,
  Bug,
  Crosshair,
  FlaskConical,
  GitBranch,
  GitCompare,
  LayoutDashboard,
  Network,
  Orbit,
  Radar,
  Route as RouteIcon,
  ScanLine,
  Target,
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
  "reverse-skill": RouteIcon,
  gap: Radar,
  "war-room": Target,
  intel: Activity,
  command: Orbit
};

// Three groups: the strategic reads, the clone modules, then the indexed toolkits.
const GROUPS = [
  [
    { key: "war-room", to: "/war-room", label: "War room" },
    { key: "intel", to: "/intel", label: "Intelligence" },
    { key: "command", to: "/command", label: "Command matrix" },
    { key: "gap", to: "/gap", label: "Gap analyzer" }
  ],
  CLONE_MODULES,
  RAIL_TOOLKITS.map((toolkit) => ({ key: toolkit.key, to: toolkit.route, label: toolkit.name }))
];

export default function IdeRail({ active }) {
  return (
    <nav
      aria-label="Workspace sections"
      className="sticky top-12 z-20 hidden w-14 shrink-0 flex-col items-center gap-1.5 border-r border-line-soft bg-[hsl(var(--surface-sunken)/0.85)] py-2.5 backdrop-blur sm:flex h-[calc(100vh-3rem)]"
    >
      {GROUPS.map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          {groupIndex > 0 && <span aria-hidden className="my-1 h-px w-6 bg-line" />}
          {group.map((item) => {
            const Icon = ICONS[item.key] || Workflow;
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                to={item.to}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex h-10 w-10 items-center justify-center border no-underline transition-[background-color,border-color,color] duration-150 ${
                  isActive
                    ? "border-[hsl(var(--signal)/0.28)] bg-[hsl(var(--signal)/0.12)] text-signal"
                    : "border-transparent text-ink-dim hover:border-line-soft hover:bg-surface-panel hover:text-ink"
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute -left-[9px] top-1/2 h-5 w-[2px] -translate-y-1/2 bg-signal shadow-[0_0_10px_hsl(var(--signal)/0.65)]"
                  />
                )}
                <Icon className="h-[15px] w-[15px]" strokeWidth={isActive ? 2.1 : 1.7} />
              </Link>
            );
          })}
        </React.Fragment>
      ))}
    </nav>
  );
}