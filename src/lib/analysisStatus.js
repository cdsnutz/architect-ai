import { ScanLine, Wand2, Download } from "lucide-react";

export const STATUSES = [
  {
    key: "mapped",
    label: "Mapped",
    description: "Logic map captured. Prompts not generated yet.",
    icon: ScanLine,
    accent: "text-muted-foreground",
  },
  {
    key: "optimized",
    label: "Optimized",
    description: "White-label clone prompt generated.",
    icon: Wand2,
    accent: "text-primary",
  },
  {
    key: "ready",
    label: "Ready for download",
    description: "Reconstruction prompt built and ready to hand to Claude Code.",
    icon: Download,
    accent: "text-emerald-500",
  },
];

export function statusOf(analysis) {
  if (analysis.rebuild_prompt) return "ready";
  if (analysis.white_label_prompt) return "optimized";
  return "mapped";
}

export function groupByStatus(analyses) {
  const buckets = { mapped: [], optimized: [], ready: [] };
  analyses.forEach((analysis) => {
    buckets[statusOf(analysis)].push(analysis);
  });
  return buckets;
}