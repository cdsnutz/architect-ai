/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Send, Waypoints } from "lucide-react";

const OPENERS = [
  "What in the last dossier is still unverified?",
  "Which skill would settle it, and on which host?",
  "Where does this pack prove less than it looks?"
];

export default function LabConductor({ requestId }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    let active = true;
    let unsubscribe;

    (async () => {
      try {
        const conversationRef = await base44.agents.createConversation({
          agent_name: "lab_conductor",
          metadata: { name: "Lab Conductor", description: "Engineering challenge lab session" }
        });
        if (!active) return;
        setConversation(conversationRef);
        unsubscribe = base44.agents.subscribeToConversation(conversationRef.id, (data) => {
          setMessages(data.messages || []);
        });
        if (requestId) {
          await base44.agents.addMessage(conversationRef, {
            role: "user",
            content: "data_request_id: " + requestId + "\n\nRead this request and its findings, then wait for my instruction. Do not re-run it."
          });
        }
        setStarting(false);
      } catch (err) {
        if (active) {
          setError("The conductor could not open a session. Try again in a moment.");
          setStarting(false);
        }
      }
    })();

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  const send = async (text) => {
    const content = (text || draft).trim();
    if (!content || !conversation) return;
    setDraft("");
    setError("");
    try {
      await base44.agents.addMessage(conversation, { role: "user", content });
    } catch (err) {
      setError("That message did not send. Try again.");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Waypoints className="h-4 w-4 text-primary" />
          Lab Conductor
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            agent
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {starting && (
          <p className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Opening a conductor session
          </p>
        )}

        {error && (
          <p className="flex items-start gap-2 text-[11px] text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        {!starting && messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {OPENERS.map((opener) => (
              <button
                key={opener}
                type="button"
                onClick={() => send(opener)}
                className="rounded-full border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {opener}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-72 space-y-2.5 overflow-y-auto">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div key={index} className={isUser ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    isUser
                      ? "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-[11px] text-primary-foreground"
                      : "max-w-[95%] rounded-lg border bg-muted/30 px-3 py-2 text-[11px]"
                  }
                >
                  {message.content &&
                    (isUser ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="space-y-2 leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ))}
                  {Array.isArray(message.tool_calls) && message.tool_calls.length > 0 && (
                    <div className="mt-1.5 space-y-0.5 border-t pt-1.5">
                      {message.tool_calls.map((call, callIndex) => (
                        <p key={callIndex} className="font-mono text-[9px] text-muted-foreground">
                          {call.name} · {call.status}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="flex gap-2"
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask the conductor what the evidence supports"
            disabled={starting || !conversation}
            className="text-xs"
          />
          <Button type="submit" size="icon" disabled={starting || !conversation || !draft.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}