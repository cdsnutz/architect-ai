import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Layers, Loader2, Terminal } from "lucide-react";
import PodRoster from "@/components/analysis/PodRoster";
import ReaToolList from "./ReaToolList";
import ReaSkillList from "./ReaSkillList";
import ReaWorkflowList from "./ReaWorkflowList";
import ReaChat from "./ReaChat";
import ReaRunner from "./ReaRunner";
import StructureAdvisorChat from "./StructureAdvisorChat";

export default function ReaConsole({ analysis, onValidated }) {
  const [registry, setRegistry] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await base44.functions.invoke("reaRegistry");
        if (active) setRegistry(response.data || {});
      } catch (err) {
        if (active) setError("The REA registry could not be loaded.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Terminal className="w-5 h-5" />
          REA layer
        </CardTitle>
        <CardDescription>
          Every REA tool, skill, pod and workflow wired to this engine — plus the orchestrator that reads your dossiers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!registry && !error && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading the REA inventory...
          </div>
        )}

        {registry && (
          <Tabs defaultValue="run" className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-7">
              <TabsTrigger value="run" className="text-xs">Run</TabsTrigger>
              <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
              <TabsTrigger value="skills" className="text-xs">Skills</TabsTrigger>
              <TabsTrigger value="pods" className="text-xs">Pods</TabsTrigger>
              <TabsTrigger value="workflows" className="text-xs">Workflows</TabsTrigger>
              <TabsTrigger value="agent" className="gap-1 text-xs">
                <Bot className="w-3.5 h-3.5" />
                Agent
              </TabsTrigger>
              <TabsTrigger value="structure" className="gap-1 text-xs">
                <Layers className="w-3.5 h-3.5" />
                Structure
              </TabsTrigger>
            </TabsList>

            <TabsContent value="run" className="mt-4">
              <ReaRunner analysis={analysis} onAnalyzed={onValidated} />
            </TabsContent>

            <TabsContent value="tools" className="mt-4">
              <ReaToolList tools={registry.tools} />
            </TabsContent>

            <TabsContent value="skills" className="mt-4">
              <ReaSkillList skills={registry.skills} agents={registry.agents} />
            </TabsContent>

            <TabsContent value="pods" className="mt-4">
              <PodRoster />
            </TabsContent>

            <TabsContent value="workflows" className="mt-4">
              <ReaWorkflowList workflows={registry.workflows} analysis={analysis} onValidated={onValidated} />
            </TabsContent>

            <TabsContent value="agent" className="mt-4">
              <ReaChat analysis={analysis} />
            </TabsContent>

            <TabsContent value="structure" className="mt-4">
              <StructureAdvisorChat analysis={analysis} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}