// Pod lanes for the tracker, plus the derivations it reads off a ReaRun.

export const POD_LANES = [
  { name: "Perimeter Scout", surface: "Frontend" },
  { name: "Protocol Analyst", surface: "API" },
  { name: "Schema Archaeologist", surface: "Data" },
  { name: "Logic Reconstructor", surface: "Logic" },
  { name: "REA Orchestrator", surface: "Pipeline" }
];

export function derivePods(run) {
  const stages = Array.isArray(run && run.stages) ? run.stages : [];

  return POD_LANES.map((lane) => {
    const mine = stages.filter((stage) => Array.isArray(stage.pods) && stage.pods.includes(lane.name));
    if (!mine.length) return { ...lane, state: "idle", detail: "", startedAt: "" };

    const active = mine.find((stage) => stage.status === "running");
    const failed = mine.find((stage) => stage.status === "failed");
    const queued = mine.find((stage) => stage.status === "queued");
    const allSkipped = mine.every((stage) => stage.status === "skipped");
    const stage = active || failed || queued || mine[mine.length - 1];
    const state = active ? "active" : failed ? "failed" : queued ? "queued" : allSkipped ? "skipped" : "done";

    return { ...lane, state, detail: stage.detail || stage.label, startedAt: stage.started_at || "" };
  });
}

export function runProgress(run) {
  const stages = (Array.isArray(run && run.stages) ? run.stages : []).filter((stage) => stage.status !== "skipped");
  if (!stages.length) return 0;
  const done = stages.filter((stage) => stage.status === "complete").length;
  return Math.round((done / stages.length) * 100);
}

export function elapsedSince(iso, now) {
  if (!iso) return "";
  const seconds = Math.round(Math.max(0, now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return seconds + "s";
  const minutes = Math.floor(seconds / 60);
  return minutes + "m " + (seconds % 60) + "s";
}