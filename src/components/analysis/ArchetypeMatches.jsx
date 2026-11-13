/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Puzzle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PodBlock from "@/components/analysis/PodBlock";

const VARIANT = { strong: "default", partial: "secondary", weak: "outline" };

export default function ArchetypeMatches({ matches = [] }) {
  if (!matches.length) return null;

  return (
    <PodBlock title="Archetype matches" icon={Puzzle}>
      {matches.map((m, i) => (
        <div key={i} className="border-l-2 border-primary/20 pl-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{m.archetype}</p>
            <Badge variant={VARIANT[m.strength] || "outline"} className="text-xs">
              {m.strength}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Matched on: {m.matched_on}</p>
          {(m.filled_blanks || []).length > 0 && (
            <ul className="mt-1.5 space-y-0.5 text-sm text-muted-foreground">
              {m.filled_blanks.map((f, j) => (
                <li key={j}>
                  <Badge variant="outline" className="mr-1.5 text-xs font-normal">
                    inferred
                  </Badge>
                  {f}
                </li>
              ))}
            </ul>
          )}
          {m.caveat && <p className="mt-1 text-xs text-muted-foreground">{m.caveat}</p>}
        </div>
      ))}
    </PodBlock>
  );
}