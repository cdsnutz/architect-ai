import React from "react";
import { Workflow } from "lucide-react";
import PodBlock from "@/components/analysis/PodBlock";
import LedgerTrace from "@/components/analysis/LedgerTrace";
import ApiContracts from "@/components/analysis/ApiContracts";
import InferredSchema from "@/components/analysis/InferredSchema";
import StateTransitionTable from "@/components/analysis/StateTransitionTable";
import HeaderProbe from "@/components/analysis/HeaderProbe";
import PodLedger from "@/components/analysis/PodLedger";
import CopyButton from "@/components/analysis/CopyButton";

export default function PodFindings({ analysis }) {
  const contracts = analysis.api_contracts || [];
  const schema = analysis.inferred_schema || [];
  const flows = analysis.logic_flows || [];
  const transitions = analysis.state_transitions || [];
  const findings = analysis.pod_findings || [];
  const traces = analysis.ledger_traces || [];
  const probe = analysis.header_probe || [];

  const empty =
    !contracts.length && !schema.length && !flows.length && !transitions.length && !findings.length && !probe.length;

  if (empty) return null;

  return (
    <div className="space-y-6">
      <LedgerTrace traces={traces} contracts={contracts} />
      <ApiContracts contracts={contracts} />
      <InferredSchema schema={schema} />
      <StateTransitionTable transitions={transitions} />

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