/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";

const FIELDS = [
  { key: "nodes", label: "nodes" },
  { key: "edges", label: "edges" },
  { key: "observed", label: "observed" },
  { key: "inferred", label: "inferred" },
  { key: "orphans", label: "orphans" },
  { key: "dangling", label: "dangling" },
  { key: "cycles", label: "cycles" },
  { key: "chain", label: "chain depth" },
  { key: "hubs", label: "hubs" },
  { key: "foreign", label: "off-origin" }
];

export default function StructureMetrics({ metrics }) {
  return (
    <dl className="grid grid-cols-2 gap-px border border-line-soft bg-line-soft sm:grid-cols-5">
      {FIELDS.map((field) => (
        <div key={field.key} className="bg-surface-panel px-2 py-2">
          <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">{field.label}</dt>
          <dd className="mt-0.5 font-display text-sm text-ink">{metrics[field.key] ?? 0}</dd>
        </div>
      ))}
    </dl>
  );
}