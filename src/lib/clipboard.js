/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function logicMapToText(analysis) {
  const map = analysis.logic_map || {};
  const lines = [`# Logic map — ${analysis.title || analysis.url}`, analysis.url || "", ""];

  if (analysis.summary) lines.push("## Summary", analysis.summary, "");

  const groups = map.page_structure || [];
  if (groups.length) {
    lines.push("## Page / Section Structure");
    groups.forEach((g) => {
      lines.push(`- **${g.name}** — ${g.purpose || ""}`);
      if (g.key_elements && g.key_elements.length) lines.push(`  Elements: ${g.key_elements.join(", ")}`);
    });
    lines.push("");
  }

  const entities = map.data_entities || [];
  if (entities.length) {
    lines.push("## Data Entities");
    entities.forEach((e) => {
      lines.push(`- **${e.name}** — ${e.purpose || ""}`);
      if (e.likely_fields && e.likely_fields.length) lines.push(`  Fields: ${e.likely_fields.join(", ")}`);
    });
    lines.push("");
  }

  const apis = map.api_integrations || [];
  if (apis.length) {
    lines.push("## APIs & Integrations");
    apis.forEach((a) => {
      lines.push(`- **${a.name}** — ${a.purpose || ""}`);
      if (a.evidence) lines.push(`  Evidence: ${a.evidence}`);
    });
    lines.push("");
  }

  const flows = map.user_flows || [];
  if (flows.length) {
    lines.push("## User Flows");
    flows.forEach((f) => {
      lines.push(`- **${f.name}**`);
      (f.steps || []).forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
    });
    lines.push("");
  }

  const bottlenecks = map.bottlenecks || [];
  if (bottlenecks.length) {
    lines.push("## Bottlenecks & Code Smells");
    bottlenecks.forEach((b) => {
      lines.push(`- **${b.area}** (${b.severity || "unknown"}) — ${b.issue || ""}`);
      if (b.suggestion) lines.push(`  Fix: ${b.suggestion}`);
    });
    lines.push("");
  }

  const ux = map.ux_issues || [];
  if (ux.length) {
    lines.push("## UX / Accessibility Gaps");
    ux.forEach((u) => {
      lines.push(`- **${u.area}** — ${u.issue || ""}`);
      if (u.suggestion) lines.push(`  Suggestion: ${u.suggestion}`);
    });
    lines.push("");
  }

  return lines.join("\n").trim();
}