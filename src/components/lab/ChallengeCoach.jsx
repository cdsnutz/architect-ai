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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Send, Target } from "lucide-react";

const OPENERS = [
  "Where am I losing the most, and what do I fix first?",
  "This stage stalled — what should I change?",
  "Is there anything here that actually moved?"
];

function summariseRun(run) {
  const stages = (run.stages || []).map((stage) => stage.key + ":" + stage.status).join(", ");
  return [
    "- pack: " + (run.pack_name || run.pack_id),
    "  focus: " + (run.focus || "unset") + " · status: " + run.status,
    "  targets: " + (Array.isArray(run.target_urls) && run.target_urls.length ? run.target_urls.join(", ") : "none"),
    "  stages: " + (stages || "none recorded"),
    "  capability gap: " + (run.capability_gap ? "flagged" : "not flagged")
  ].join("\n");
}

async function buildSeed(run) {
  if (run) {
    return [
      "Current ChallengeRun [" + run.id + "]",
      summariseRun(run),
      "",
      "Read this run and its dossier, then wait for my instruction. Do not re-run or change it."
    ].join("\n");
  }

  const page = await base44.entities.ChallengeRun
    .filter({}, { sort: "-created_date", limit: 3 })
    .catch(() => ({ items: [] }));

  const items = page.items || [];
  if (!items.length) {
    return [
      "No challenge run is open and none has been recorded yet.",
      "",
      "Tell me that, and ask which pack I want to run. Do not invent a run, a stage or a result."
    ].join("\n");
  }

  return [
    "No run is selected. Most recent ChallengeRuns:",
    ...items.map((item) => "[" + item.id + "]\n" + summariseRun(item)),
    "",
    "Ask me which one to coach, then wait before advising."
  ].join("\n");
}

export default function ChallengeCoach({ run }) {
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
        const seed = await buildSeed(run);
        const ref = await base44.agents.createConversation({
          agent_name: "challenge_coach",
          metadata: {
            name: run ? "Coach · " + (run.pack_name || run.pack_id) : "Challenge coach",
            description: "Optimization guidance during a challenge run"
          }
        });
        if (!active) return;
        setConversation(ref);
        unsubscribe = base44.agents.subscribeToConversation(ref.id, (data) => {
          setMessages(data.messages || []);
        });
        await base44.agents.addMessage(ref, { role: "user", content: seed });
        if (active) setStarting(false);
      } catch (err) {
        if (active) {
          setError("The coach could not open a session. Try again in a moment.");
          setStarting(false);
        }
      }
    })();

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, [run && run.id]);

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
          <Target className="h-4 w-4 text-primary" />
          Challenge Coach
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            agent
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {starting && (
          <p className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Reading the run
          </p>
        )}

        {error && (
          <p className="flex items-start gap-2 text-[11px] text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
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
            const isSeed = isUser && index === 0;
            if (isSeed) {
              return (
                <p key={index} className="font-mono text-[10px] text-muted-foreground">
                  {run ? "run telemetry attached" : "no run selected"}
                </p>
              );
            }
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
            placeholder="Ask the coach what to fix next"
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