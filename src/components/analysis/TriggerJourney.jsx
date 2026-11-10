import React, { useMemo, useState } from "react";
import { Network } from "lucide-react";
import PodBlock from "@/components/analysis/PodBlock";
import JourneyDetail from "@/components/analysis/JourneyDetail";
import { LANES, NODE_H, buildJourneys, buildLaneGraph, edgePath, wrapLabel } from "@/components/analysis/journeyLayout";

export default function TriggerJourney({ analysis }) {
  const journeys = useMemo(() => buildJourneys(analysis), [analysis]);
  const graph = useMemo(() => buildLaneGraph(journeys), [journeys]);
  const [selected, setSelected] = useState(null);

  if (!journeys.length) return null;

  const active = selected === null ? null : journeys.find((journey) => journey.index === selected) || null;
  const linkedCount = journeys.filter((journey) => journey.complete).length;
  const gaps = journeys.length - linkedCount;

  const dimmed = (indexes) => Boolean(active) && !indexes.includes(active.index);

  return (
    <PodBlock title="Action journey · trigger → API path → table" icon={Network}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          {journeys.length} action{journeys.length === 1 ? "" : "s"} traced
        </span>
        <span>{linkedCount} fully linked</span>
        {gaps > 0 && <span className="text-foreground">{gaps} with gaps</span>}
        {active && (
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="ml-auto underline decoration-dotted transition-colors hover:text-foreground"
          >
            Show all
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-muted/20 p-2">
        <svg
          viewBox={"0 0 " + graph.width + " " + graph.height}
          className="h-auto w-full min-w-[680px]"
          aria-label="UI triggers connected to their API paths and database tables"
        >
          <title>Action journey: UI trigger to API path to table</title>

          {LANES.map((lane) => (
            <text
              key={lane.key}
              x={lane.x}
              y={13}
              className="fill-muted-foreground text-[9px] font-semibold uppercase tracking-wider"
            >
              {lane.title}
            </text>
          ))}

          {graph.edges.map((edge, index) => {
            const dim = dimmed([edge.journey]);
            const hot = Boolean(active) && !dim;
            return (
              <path
                key={index}
                d={edgePath(edge.from, edge.to)}
                fill="none"
                strokeWidth={hot ? 1.8 : 1}
                className={
                  "transition-all " + (hot ? "stroke-primary " : "stroke-border ") + (dim ? "opacity-20" : "opacity-100")
                }
              />
            );
          })}

          {graph.nodes.map((node) => {
            const dim = dimmed(node.journeys);
            const hot = Boolean(active) && !dim;
            const lines = wrapLabel(node.label, node.lane === "endpoint" ? 30 : 24, 2);
            return (
              <g
                key={node.lane + ":" + node.key}
                className={"cursor-pointer transition-opacity " + (dim ? "opacity-20" : "opacity-100")}
                onClick={() => setSelected(node.journeys[0])}
              >
                <title>{node.label}</title>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={NODE_H}
                  rx={6}
                  strokeWidth={1}
                  strokeDasharray={node.mapped ? undefined : "3 3"}
                  fillOpacity={hot ? 0.14 : 1}
                  className={hot ? "fill-primary stroke-primary" : "fill-card stroke-border"}
                />
                {lines.map((line, lineIndex) => (
                  <text
                    key={lineIndex}
                    x={node.x + 8}
                    y={node.y + (lines.length === 1 ? 22 : 15 + lineIndex * 12)}
                    className={
                      "text-[9px] " +
                      (node.lane === "endpoint" ? "font-mono " : "") +
                      (node.mapped ? "fill-foreground" : "fill-muted-foreground")
                    }
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {active ? (
        <JourneyDetail journey={active} />
      ) : (
        <p className="text-xs text-muted-foreground">
          Select any node to open that action's full journey, the state it moves and the evidence behind it.
        </p>
      )}
    </PodBlock>
  );
}