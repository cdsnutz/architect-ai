import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import ReplicaSkillGrid from "./ReplicaSkillGrid";
import ParityCard from "./ParityCard";
import SweepCard from "./SweepCard";
import ContrastCard from "./ContrastCard";

const TONE = {
  pass: "border-emerald-500/40 text-emerald-400",
  blocked: "border-red-500/40 text-red-400",
  unchecked: "text-muted-foreground"
};

export default function ReplicaChecks({ spec, onUpdated }) {
  const { toast } = useToast();
  const [skills, setSkills] = useState([]);
  const [matrix, setMatrix] = useState(spec.replica?.matrix_csv || "");
  const [tokens, setTokens] = useState(spec.replica?.tokens_json || "");
  const [avoid, setAvoid] = useState(((spec.replica?.sweep?.avoid) || []).join(", "));
  const [busy, setBusy] = useState("");

  const replica = spec.replica || null;

  useEffect(() => {
    base44.functions
      .invoke("replicaSkill", { action: "catalog" })
      .then((response) => setSkills(response.data?.skills || []))
      .catch(() => setSkills([]));
  }, []);

  useEffect(() => {
    setMatrix(spec.replica?.matrix_csv || "");
    setTokens(spec.replica?.tokens_json || "");
    setAvoid(((spec.replica?.sweep?.avoid) || []).join(", "));
  }, [spec.id]);

  const run = async (action, payload = {}) => {
    setBusy(action);
    try {
      const response = await base44.functions.invoke("replicaSkill", {
        action,
        spec_id: spec.id,
        ...payload
      });
      const next = response.data?.replica;
      if (next?.matrix_csv) setMatrix(next.matrix_csv);
      if (next?.sweep?.avoid) setAvoid(next.sweep.avoid.join(", "));
      if (response.data?.spec && onUpdated) onUpdated(response.data.spec);
      return response.data;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Replica check failed",
        description: error?.response?.data?.error || error.message
      });
      return null;
    } finally {
      setBusy("");
    }
  };

  const derive = async () => {
    const data = await run("derive");
    if (data?.matrix_csv) {
      setMatrix(data.matrix_csv);
      toast({ title: "Matrix derived", description: data.rows + " feature rows read from the captured contracts." });
    }
  };

  const runAll = async () => {
    const data = await run("run_all", { tokens: tokens || undefined });
    if (data?.replica) {
      toast({
        title: "Replica gates " + data.replica.verdict,
        description: "Score " + data.replica.score + " saved against this spec."
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Replica gates
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Ported from the replica skill set. Results are stored on this spec and count toward the run read.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {replica && (
              <Badge variant="outline" className={TONE[replica.verdict] || TONE.unchecked}>
                {replica.verdict} · {replica.score}
              </Badge>
            )}
            <Button size="sm" variant="secondary" disabled={Boolean(busy)} onClick={runAll}>
              {busy === "run_all" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run all gates"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {replica?.gates?.length ? (
            replica.gates.map((gate) => (
              <div key={gate.key} className="flex items-center justify-between gap-3 rounded border border-border/60 px-2.5 py-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{gate.key}</span>
                <span className="flex-1 text-xs">{gate.label}</span>
                <Badge variant="outline" className={gate.pass ? TONE.pass : TONE.blocked}>
                  {gate.pass ? "pass" : "blocked"}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              No gate has run yet. Derive the matrix, sweep the bundle, and check tokens before the deploy stage.
            </p>
          )}
          {replica?.checked_at && (
            <p className="text-[11px] text-muted-foreground">Last check {new Date(replica.checked_at).toLocaleString()}</p>
          )}
        </CardContent>
      </Card>

      <ReplicaSkillGrid skills={skills} />

      <ParityCard
        matrix={matrix}
        onMatrixChange={setMatrix}
        onDerive={derive}
        onRun={() => run("parity", { matrix_csv: matrix })}
        busy={busy === "parity" || busy === "derive"}
        result={replica?.parity}
      />

      <SweepCard
        avoid={avoid}
        onAvoidChange={setAvoid}
        onRun={() =>
          run("sweep", {
            avoid: avoid.split(",").map((item) => item.trim()).filter(Boolean)
          })
        }
        busy={busy === "sweep"}
        result={replica?.sweep}
      />

      <ContrastCard
        tokens={tokens}
        onTokensChange={setTokens}
        onRun={() => run("contrast", { tokens })}
        busy={busy === "contrast"}
        result={replica?.contrast}
      />
    </div>
  );
}