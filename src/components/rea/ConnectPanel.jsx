/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2 } from "lucide-react";
import CopyButton from "@/components/analysis/CopyButton";

export default function ConnectPanel() {
  const [connections, setConnections] = useState([]);
  const [label, setLabel] = useState("Local agent");
  const [issued, setIssued] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const response = await base44.functions.invoke("reaTools", { action: "connections" });
    setConnections(response.data.connections || []);
  };

  useEffect(() => {
    load().catch(() => setError("Connections could not be loaded."));
  }, []);

  const mint = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("reaTools", { action: "connect", label });
      setIssued(response.data);
      await load();
    } catch (err) {
      setError((err && err.response && err.response.data && err.response.data.error) || "Could not mint a token.");
    }
    setBusy(false);
  };

  const revoke = async (id) => {
    setError("");
    try {
      await base44.functions.invoke("reaTools", { action: "revoke", connection_id: id });
      setIssued(null);
      await load();
    } catch (err) {
      setError((err && err.response && err.response.data && err.response.data.error) || "Could not revoke that token.");
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="w-4 h-4" />
          Connect REA
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Mints an agent token and the web endpoint your local agent calls. The token is shown once.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Local agent" className="flex-1" />
        <Button onClick={mint} disabled={busy || !label.trim()} className="shrink-0">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Mint token
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {issued && (
        <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Token — copy it now</p>
          <div className="flex items-start gap-2">
            <code className="min-w-0 flex-1 break-all font-mono text-xs">{issued.token}</code>
            <CopyButton getText={() => issued.token} label="Copy" className="shrink-0" />
          </div>
          {issued.endpoint && (
            <div className="flex items-start gap-2">
              <code className="min-w-0 flex-1 break-all font-mono text-xs text-muted-foreground">{issued.endpoint}</code>
              <CopyButton getText={() => issued.endpoint} label="Copy" className="shrink-0" />
            </div>
          )}
          <div className="flex justify-end">
            <CopyButton
              getText={() => JSON.stringify(issued.config, null, 2)}
              label="Copy agent config"
              copiedLabel="Config copied"
            />
          </div>
        </div>
      )}

      {connections.length > 0 && (
        <div className="divide-y rounded-lg border">
          {connections.map((connection) => (
            <div key={connection.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{connection.label}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{connection.prefix}…</p>
              </div>
              <Badge variant={connection.status === "active" ? "secondary" : "outline"} className="text-[10px] uppercase">
                {connection.status}
              </Badge>
              {connection.status === "active" && (
                <Button variant="ghost" size="sm" onClick={() => revoke(connection.id)}>
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}