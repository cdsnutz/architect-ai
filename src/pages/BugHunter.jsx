/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import IdeShell from "@/components/ide/IdeShell";
import SourceCard from "@/components/bughunter/SourceCard";
import LaneSummary from "@/components/bughunter/LaneSummary";
import CategoryRail from "@/components/bughunter/CategoryRail";
import ToolList from "@/components/bughunter/ToolList";

export default function BugHunter() {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [lane, setLane] = useState("all");

  const load = async () => {
    const page = await base44.entities.BugHunterCatalog.filter({}, { sort: "-created_date", limit: 1 });
    setCatalog((page.items || [])[0] || null);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const sync = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("ingestBugHunter", {});
      const data = response.data || {};
      if (data.record) setCatalog(data.record);
      else if (data.catalog) setCatalog(data.catalog);
    } catch (err) {
      const detail = err && err.response && err.response.data && err.response.data.error;
      setError(detail || (err && err.message) || "The catalog could not be read.");
    } finally {
      setBusy(false);
    }
  };

  const sections = (catalog && catalog.sections) || [];

  const tools = useMemo(() => {
    const source = category === "all" ? sections : sections.filter((section) => section.name === category);
    const needle = query.trim().toLowerCase();
    return source
      .flatMap((section) => section.tools.map((tool) => ({ ...tool, section: section.name })))
      .filter((tool) => lane === "all" || tool.lane === lane)
      .filter(
        (tool) =>
          !needle ||
          (tool.name + " " + tool.description + " " + tool.section).toLowerCase().includes(needle)
      );
  }, [sections, category, lane, query]);

  return (
    <IdeShell
      active="bug-hunter"
      crumb="Bug hunter / arsenal index"
      note="index only · no execution"
      status={[
        { label: "mode", value: "reference" },
        { label: "tools", value: catalog && catalog.counts ? String(catalog.counts.tools) : "0" },
        { label: "shown", value: String(tools.length) }
      ]}
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="space-y-4">
          <SourceCard catalog={catalog} busy={busy} error={error} onSync={sync} />
          <LaneSummary counts={catalog && catalog.counts} lane={lane} onSelect={setLane} />
          <CategoryRail sections={sections} category={category} onSelect={setCategory} />
        </div>

        <div className="min-w-0 space-y-4">
          {loading ? (
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">Reading catalog…</p>
          ) : sections.length ? (
            <>
              <div className="border border-line-soft bg-surface-panel p-3">
                <h1 className="font-display text-sm text-ink">
                  {category === "all" ? "Every section" : category}
                </h1>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  Read-only index of a public catalog. A tool listed here is a citation, not a capability: the lab
                  probes only targets you have authorized, and anything in the off-contract lane is documented for
                  awareness only.
                </p>
              </div>
              <ToolList
                tools={tools}
                query={query}
                onQuery={setQuery}
                lane={lane}
                onLaneReset={() => setLane("all")}
              />
            </>
          ) : (
            <div className="border border-line-soft bg-surface-panel p-6">
              <h1 className="font-display text-sm text-ink">Catalog not indexed yet</h1>
              <p className="mt-2 max-w-prose text-[11px] leading-relaxed text-ink-muted">
                Read the catalog to pull its sections into the IDE. The reader parses the repository README, groups
                every tool under its section, and tags each section with the lane it occupies in this lab.
              </p>
            </div>
          )}
        </div>
      </div>
    </IdeShell>
  );
}