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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Compass, Loader2, Send } from "lucide-react";

const OPENERS = [
  "Walk me through what this analysis claims.",
  "Which parts are inferred rather than observed?",
  "I want to analyse a new target — what do you need from me?"
];

function buildSeed(analysis) {
  if (!analysis) {
    return [
      "No dossier is open in this session.",
      "",
      "Ask me for a target URL, or for pasted HTML if the surface is behind a login. " +
        "Do not map anything until I give you the host."
    ].join("\n");
  }

  return [
    "Open dossier: " + analysis.title,
    "url: " + analysis.url,
    "analysis_id: " + analysis.id,
    "status: " + (analysis.pipeline_status || "unset"),
    "access: " + (analysis.access_state || "unset") + (analysis.gate_type ? " · gate: " + analysis.gate_type : ""),
    "",
    "Read this dossier and wait for my instruction. Do not re-map it."
  ].join("\n");
}

export default function AnalysisGuideChat({ analysis }) {
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
        const ref = await base44.agents.createConversation({
          agent_name: "analysis_guide",
          metadata: {
            name: analysis ? "Analysis · " + analysis.title : "New analysis",
            description: "Site analysis setup and findings walkthrough"
          }
        });
        if (!active) return;
        setConversation(ref);
        unsubscribe = base44.agents.subscribeToConversation(ref.id, (data) => {
          setMessages(data.messages || []);
        });
        await base44.agents.addMessage(ref, { role: "user", content: buildSeed(analysis) });
        if (active) setStarting(false);
      } catch (err) {
        if (active) {
          setError("The guide could not open a session. Try again in a moment.");
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Compass className="h-4 w-4 text-primary" />
          Analysis Guide
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            agent
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
      {starting && (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening a guide session...
        </div>
      )}

      {error && (
        <p className="flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {!starting && messages.length <= 1 && (
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
          const isSeed = isUser && index === 0;
          if (isSeed) {
            return (
              <p key={index} className="font-mono text-[10px] text-muted-foreground">
                {analysis ? "dossier attached" : "no dossier attached"}
              </p>
            );
          }
          return (
            <div key={index} className={isUser ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  isUser
                    ? "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"
                    : "max-w-[95%] rounded-lg border bg-muted/30 px-3 py-2 text-xs"
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
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="flex gap-2"
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about this analysis, or name a target"
          disabled={starting || !conversation}
        />
        <Button type="submit" size="icon" disabled={starting || !conversation || !draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
      </CardContent>
    </Card>
  );
}