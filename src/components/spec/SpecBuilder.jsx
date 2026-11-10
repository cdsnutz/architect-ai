import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCode2, Loader2 } from "lucide-react";

export default function SpecBuilder({ analyses = [], requests = [], onBuild, busy }) {
  const [kind, setKind] = useState("analysis");
  const [id, setId] = useState("");

  const options = kind === "analysis"
    ? analyses.map((a) => ({ id: a.id, label: a.title || a.url }))
    : requests.map((r) => ({ id: r.id, label: r.title || r.request }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCode2 className="h-4 w-4 text-primary" />
          Compile a rebuild spec
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={kind} onValueChange={(value) => { setKind(value); setId(""); }}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="analysis">Dossier</SelectItem>
            <SelectItem value="request">Lab request</SelectItem>
          </SelectContent>
        </Select>

        <Select value={id} onValueChange={setId}>
          <SelectTrigger className="flex-1"><SelectValue placeholder={options.length ? "Choose a source" : "Nothing captured yet"} /></SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          disabled={!id || busy}
          onClick={() => onBuild(kind === "analysis" ? { analysis_id: id } : { request_id: id })}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Compile"}
        </Button>
      </CardContent>
    </Card>
  );
}