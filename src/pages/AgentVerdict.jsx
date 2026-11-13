import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function AgentVerdict() {
  const [params] = useSearchParams();
  const conversationId = params.get("conversation") || "";
  const agentParam = params.get("agent") || "";
  const stageParam = params.get("stage") || "";
  const [thread, setThread] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!conversationId) {
      setError("This link names no conversation.");
      setLoading(false);
      return () => {};
    }
    base44.functions
      .invoke("verdictThread", { conversation_id: conversationId })
      .then((response) => {
        if (alive) setThread(response.data);
      })
      .catch((err) => {
        if (alive) setError(err?.response?.data?.error || "Could not load that thread.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [conversationId]);

  const messages = (thread && thread.messages) || [];
  const agent = (thread && thread.agent) || agentParam;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/lab" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to the lab
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h1 className="font-heading text-2xl font-semibold">{agent || "Stage sign-off"}</h1>
        {stageParam && (
          <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wide">
            {stageParam}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Read-only transcript of the sign-off conversation.</p>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {loading ? "Loading thread" : messages.length + " messages"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Opening the thread
            </div>
          )}
          {!loading && error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && messages.length === 0 && (
            <p className="text-sm text-muted-foreground">This thread holds no messages.</p>
          )}
          {!loading &&
            messages.map((message, index) => (
              <div
                key={index}
                className={
                  "rounded-md border px-3 py-2 text-sm leading-relaxed " +
                  (message.role === "assistant"
                    ? "border-border bg-secondary/40"
                    : "border-border/60 bg-transparent text-muted-foreground")
                }
              >
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {message.role === "assistant" ? "agent" : "review prompt"}
                </p>
                <p className="whitespace-pre-line break-words">{message.content}</p>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}