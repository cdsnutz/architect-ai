/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Send } from "lucide-react";

const OPENERS = [
  "What in this dossier is still unverified?",
  "Name the next probe, and why it comes first.",
  "Where does the map contradict itself?"
];

export default function ReaChat({ analysis }) {
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
          agent_name: "rea",
          metadata: {
            name: analysis ? "REA · " + analysis.title : "REA session",
            description: "Reverse-engineering session"
          }
        });
        if (!active) return;
        setConversation(conversationRef);
        unsubscribe = base44.agents.subscribeToConversation(conversationRef.id, (data) => {
          setMessages(data.messages || []);
        });
        if (analysis) {
          await base44.agents.addMessage(conversationRef, {
            role: "user",
            content:
              "Target: " + analysis.title + " (" + analysis.url + ")\n" +
              "analysis_id: " + analysis.id + "\n\n" +
              "Read this dossier and wait for my instruction. Do not re-map it."
          });
        }
        setStarting(false);
      } catch (err) {
        if (active) {
          setError("REA could not open a session. Try again in a moment.");
          setStarting(false);
        }
      }
    })();

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, [analysis && analysis.id]);

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
    <div className="space-y-3">
      {starting && (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Opening a REA session...
        </div>
      )}

      {error && (
        <p className="flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
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
              className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {opener}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-80 space-y-3 overflow-y-auto">
        {messages.map((message, index) => {
          const isUser = message.role === "user";
          return (
            <div key={index} className={isUser ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  isUser
                    ? "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"
                    : "max-w-[95%] rounded-lg border bg-muted/30 px-3 py-2 text-xs"
                }
              >
                {message.content && (
                  isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="space-y-2 leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )
                )}
                {message.tool_calls && message.tool_calls.length > 0 && (
                  <div className="mt-2 space-y-0.5 border-t pt-2">
                    {message.tool_calls.map((call, callIndex) => (
                      <p key={callIndex} className="font-mono text-[10px] text-muted-foreground">
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
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask REA about this dossier"
          disabled={starting || !conversation}
        />
        <Button type="submit" size="icon" disabled={starting || !conversation || !draft.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}