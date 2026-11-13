/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import IdeShell from "@/components/ide/IdeShell";
import IdePanel from "@/components/ide/IdePanel";

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
    <IdeShell
      active="lab"
      crumb="lab / sign-off thread"
      note="read-only transcript"
      status={[
        { label: "agent", value: agent || "unknown" },
        { label: "stage", value: stageParam || "unset" },
        { label: "messages", value: loading ? "..." : String(messages.length) },
        { label: "state", value: loading ? "loading" : error ? "error" : "ready" },
      ]}
    >
      <div className="space-y-4 p-3 md:p-4">
        <div className="border border-line bg-surface-panel px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">
            Stage sign-off{stageParam ? ` / ${stageParam}` : ""}
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">{agent || "Stage sign-off"}</h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
            Read-only transcript of the sign-off conversation.
          </p>
        </div>

        <IdePanel
          label={loading ? "Loading thread" : `${messages.length} messages`}
          right={
            conversationId ? (
              <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-dim">
                {conversationId}
              </span>
            ) : null
          }
          bodyClassName="space-y-3"
        >
          {loading && (
            <div className="flex items-center gap-2 text-[12.5px] text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin text-signal" />
              Opening the thread
            </div>
          )}
          {!loading && error && <p className="text-[12.5px] text-destructive">{error}</p>}
          {!loading && !error && messages.length === 0 && (
            <p className="text-[12.5px] text-ink-muted">This thread holds no messages.</p>
          )}
          {!loading &&
            messages.map((message, index) => (
              <div
                key={index}
                className={
                  "border px-3 py-2 text-[12.5px] leading-relaxed " +
                  (message.role === "assistant"
                    ? "border-line bg-surface-raised text-ink"
                    : "border-line-soft bg-transparent text-ink-muted")
                }
              >
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
                  {message.role === "assistant" ? "agent" : "review prompt"}
                </p>
                <p className="whitespace-pre-line break-words">{message.content}</p>
              </div>
            ))}
        </IdePanel>
      </div>
    </IdeShell>
  );
}