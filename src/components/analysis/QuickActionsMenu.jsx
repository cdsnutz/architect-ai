/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowUpRight, Hammer, Map, Zap } from "lucide-react";
import { copyToClipboard, logicMapToText } from "@/lib/clipboard";

export default function QuickActionsMenu({ analyses }) {
  const { toast } = useToast();
  const available = (analyses || []).filter((a) => a.logic_map || a.rebuild_prompt);

  const copy = async (text, label) => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) toast({ title: `${label} copied` });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Zap className="w-4 h-4" />
          <span className="hidden sm:inline">Quick Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel>Copy from any analysis</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {available.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">No logic maps or rebuild prompts yet.</p>
        ) : (
          available.map((analysis) => (
            <DropdownMenuSub key={analysis.id}>
              <DropdownMenuSubTrigger>
                <span className="truncate">{analysis.title || analysis.url}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                <DropdownMenuItem
                  disabled={!analysis.logic_map}
                  onSelect={() => copy(logicMapToText(analysis), "Logic map")}
                >
                  <Map className="w-4 h-4" />
                  Copy logic map
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!analysis.rebuild_prompt}
                  onSelect={() => copy(analysis.rebuild_prompt, "Rebuild prompt")}
                >
                  <Hammer className="w-4 h-4" />
                  Copy rebuild prompt
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/workspace?analysis=${analysis.id}`}>
                    <ArrowUpRight className="w-4 h-4" />
                    Open analysis
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}