/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useMemo, useState } from "react";
import { Network } from "lucide-react";
import PodBlock from "@/components/analysis/PodBlock";
import JourneyDetail from "@/components/analysis/JourneyDetail";
import { COLUMNS, NODE_H, buildJourneys, buildTracks, wrapLabel } from "@/components/analysis/journeyLayout";

const ACCENT = { trigger: "fill-chart-1", endpoint: "fill-chart-2", table: "fill-chart-3" };
const WRAP = { trigger: 24, endpoint: 28, table: 24 };
const DIVIDERS = [208, 462];

function TrackNode({ node, dim }) {
  const lines = wrapLabel(node.label, WRAP[node.lane], 2);
  return (
    <g className={"transition-opacity " + (dim ? "opacity-30" : "opacity-100")}>
      <title>{node.label}</title>
      <rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={NODE_H}
        rx={7}
        strokeWidth={1}
        strokeDasharray={node.mapped ? undefined : "3 3"}
        className={"fill-card " + (node.mapped ? "stroke-border" : "stroke-muted-foreground")}
      />
      <rect x={node.x + 7} y={node.y + 7} width={3} height={NODE_H - 14} rx={1.5} className={ACCENT[node.lane]} />
      {lines.map((line, index) => (
        <text
          key={index}
          x={node.x + 16}
          y={node.y + (lines.length === 1 ? 21 : 14 + index * 11)}
          className={
            "text-[9px] " +
            (node.lane === "trigger" ? "" : "font-mono ") +
            (node.mapped ? "fill-foreground" : "fill-muted-foreground")
          }
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export default function TriggerJourney({ analysis }) {
  const journeys = useMemo(() => buildJourneys(analysis), [analysis]);
  const graph = useMemo(() => buildTracks(journeys), [journeys]);
  const [selected, setSelected] = useState(null);

  if (!journeys.length) return null;

  const active = selected === null ? null : journeys.find((journey) => journey.index === selected) || null;
  const linked = journeys.filter((journey) => journey.complete).length;

  return (
    <PodBlock title="Journey map · action → data request → database update" icon={Network}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          {journeys.length} journey{journeys.length === 1 ? "" : "s"} traced
        </span>
        <span>{linked} fully linked</span>
        {journeys.length - linked > 0 && <span className="text-foreground">{journeys.length - linked} with gaps</span>}
        <span className="flex items-center gap-1.5">
          <svg width="20" height="6" aria-hidden="true">
            <line x1="0" y1="3" x2="20" y2="3" strokeWidth="1.6" className="stroke-primary" />
          </svg>
          observed
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="6" aria-hidden="true">
            <line x1="0" y1="3" x2="20" y2="3" strokeWidth="1.2" strokeDasharray="4 3" className="stroke-muted-foreground" />
          </svg>
          unverified
        </span>
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

      <div className="max-h-[560px] overflow-auto rounded-lg border bg-muted/20 p-2">
        <svg
          viewBox={"0 0 " + graph.width + " " + graph.height}
          className="h-auto w-full min-w-[700px]"
          aria-label="Each journey drawn left to right: user action, its data request, the database table it updates"
        >
          <title>Journey map: user action to data request to database update</title>

          {COLUMNS.map((column) => (
            <text
              key={column.key}
              x={column.x + 2}
              y={13}
              className="fill-muted-foreground text-[9px] font-semibold uppercase tracking-wider"
            >
              {column.title}
            </text>
          ))}

          {DIVIDERS.map((x) => (
            <line
              key={x}
              x1={x}
              y1={22}
              x2={x}
              y2={graph.height - 4}
              strokeWidth={1}
              strokeDasharray="2 4"
              opacity={0.6}
              className="stroke-border"
            />
          ))}

          {graph.tracks.map((track) => {
            const isActive = Boolean(active) && active.index === track.journey.index;
            const dim = Boolean(active) && !isActive;
            const y = track.y + NODE_H / 2;
            const pick = () => setSelected(track.journey.index);

            return (
              <g key={track.journey.index}>
                {isActive && (
                  <rect
                    x={6}
                    y={track.y - 7}
                    width={graph.width - 12}
                    height={NODE_H + 14}
                    rx={8}
                    fillOpacity={0.08}
                    className="fill-primary"
                  />
                )}

                <g
                  role="button"
                  tabIndex={0}
                  aria-label={"Journey: " + (track.journey.trigger || "unmapped action")}
                  onClick={pick}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      pick();
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  {track.links.map((link, index) => {
                    const x1 = link.from.x + link.from.width + 2;
                    const x2 = link.to.x - 4;
                    return (
                      <g key={index} className={"transition-opacity " + (dim ? "opacity-30" : "opacity-100")}>
                        <line
                          x1={x1}
                          y1={y}
                          x2={x2}
                          y2={y}
                          strokeWidth={link.mapped ? 1.6 : 1.2}
                          strokeDasharray={link.mapped ? undefined : "4 3"}
                          className={link.mapped ? "stroke-primary" : "stroke-muted-foreground"}
                        />
                        <polygon
                          points={x2 + "," + y + " " + (x2 - 6) + "," + (y - 4) + " " + (x2 - 6) + "," + (y + 4)}
                          className={link.mapped ? "fill-primary" : "fill-muted-foreground"}
                        />
                      </g>
                    );
                  })}

                  {track.nodes.map((node) => (
                    <TrackNode key={node.lane} node={node} dim={dim} />
                  ))}
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {active ? (
        <JourneyDetail journey={active} />
      ) : (
        <p className="text-xs text-muted-foreground">
          Each row is one journey. Select it to see the state it moves, the keys it writes and the evidence behind it.
        </p>
      )}
    </PodBlock>
  );
}