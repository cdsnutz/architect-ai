/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React from "react";
import { Workflow } from "lucide-react";
import PodBlock from "@/components/analysis/PodBlock";
import LedgerTrace from "@/components/analysis/LedgerTrace";
import ApiContracts from "@/components/analysis/ApiContracts";
import InferredSchema from "@/components/analysis/InferredSchema";
import StateTransitionTable from "@/components/analysis/StateTransitionTable";
import HeaderProbe from "@/components/analysis/HeaderProbe";
import PodLedger from "@/components/analysis/PodLedger";
import TemporalProfile from "@/components/analysis/TemporalProfile";
import DependencyGraph from "@/components/analysis/DependencyGraph";
import ArchetypeMatches from "@/components/analysis/ArchetypeMatches";
import LogicMirror from "@/components/analysis/LogicMirror";
import ParityMap from "@/components/analysis/ParityMap";
import CopyButton from "@/components/analysis/CopyButton";

export default function PodFindings({ analysis }) {
  const contracts = analysis.api_contracts || [];
  const schema = analysis.inferred_schema || [];
  const flows = analysis.logic_flows || [];
  const transitions = analysis.state_transitions || [];
  const findings = analysis.pod_findings || [];
  const traces = analysis.ledger_traces || [];
  const probe = analysis.header_probe || [];
  const temporal = analysis.temporal_profile || [];
  const graph = analysis.dependency_graph || null;
  const matches = analysis.archetype_matches || [];
  const mirrors = analysis.logic_mirror || [];
  const parity = analysis.parity_map || null;

  const empty =
    !contracts.length &&
    !schema.length &&
    !flows.length &&
    !transitions.length &&
    !findings.length &&
    !probe.length &&
    !temporal.length &&
    !matches.length &&
    !mirrors.length &&
    !graph?.nodes?.length &&
    !parity?.gaps?.length;

  if (empty) return null;

  return (
    <div className="space-y-6">
      <LedgerTrace traces={traces} contracts={contracts} />
      <ApiContracts contracts={contracts} />
      <InferredSchema schema={schema} />
      <StateTransitionTable transitions={transitions} />

      <TemporalProfile rows={temporal} />
      <DependencyGraph graph={graph} />
      <ArchetypeMatches matches={matches} />
      <LogicMirror mirrors={mirrors} />
      <ParityMap map={parity} />

      {flows.length > 0 && (
        <PodBlock title="Logic flows" icon={Workflow}>
          {flows.map((f, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{f.name}</p>
                <CopyButton getText={() => f.mermaid} label="Copy diagram" className="shrink-0" />
              </div>
              <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs">{f.mermaid}</pre>
            </div>
          ))}
        </PodBlock>
      )}

      <HeaderProbe results={probe} />
      <PodLedger findings={findings} />
    </div>
  );
}