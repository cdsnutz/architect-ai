import React from "react";
import ConnectPanel from "./ConnectPanel";
import DoctorPanel from "./DoctorPanel";
import AnalyzePanel from "./AnalyzePanel";
import JobSpecPanel from "./JobSpecPanel";

export default function ReaRunner({ analysis, onAnalyzed }) {
  return (
    <div className="space-y-6">
      <ConnectPanel />
      <div className="border-t pt-5">
        <DoctorPanel />
      </div>
      <div className="border-t pt-5">
        <AnalyzePanel onAnalyzed={onAnalyzed} />
      </div>
      <div className="border-t pt-5">
        <JobSpecPanel analysis={analysis} />
      </div>
    </div>
  );
}