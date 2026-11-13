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
import { AlertCircle, Loader2, Rocket, Send } from "lucide-react";

const FIRST_RUN_OPENERS = [
  "I'm new — where do I start?",
  "What does an analysis actually show me?",
  "How do I get from a map to a working project?"
];

const RETURNING_OPENERS = [
  "How do I launch my project from my last analysis?",
  "What goes into the rebuild prompt?",
  "What should I check before I hand it to Claude Code?"
];

async function buildSeed() {
  const total = await base44.entities.SiteAnalysis.count({}).catch(() => null);
  const page = await base44.entities.SiteAnalysis
    .filter({}, { sort: "-created_date", limit: 1 })
    .catch(() => ({ items: [] }));
  const latest = (page.items || [])[0];

  if (!total) {
    return [
      "This operator has no SiteAnalysis yet. This is their first run.",
      "",
      "Guide them one step at a time: ask for one public URL (or pasted HTML from a gated page they already have access to), " +
        "explain what the map will and will not show, then start it only once they name the host themselves. " +
        "After it lands, walk them to the rebuild prompt and the Claude Code handoff. " +
        "Ask one check question between steps.",
      latest ? "Most recent record: " + latest.title + " [" + latest.id + "]" : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "This operator already has " + total + " SiteAnalysis record" + (total === 1 ? "" : "s") + ".",
    latest ? "Most recent: " + latest.title + " (" + latest.url + ") [" + latest.id + "]" : "",
    "",
    "The first analysis step is done, so begin at launching the project: generateRebuildPrompt and the handoff into Claude Code. " +
      "Do not re-map anything. Take one step at a time and check understanding.",
    "Do not open by congratulating them; state where they are and what the next step produces."
  ]
    .filter(Boolean)
    .join("\n");
}

export default function OnboardingGuide() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState(true);
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    let active = true;
    let unsubscribe;

    (async () => {
      try {
        const total = await base44.entities.SiteAnalysis.count({}).catch(() => 0);
        if (active) setIsFirstRun(!total);
        const seed = await buildSeed();
        const ref = await base44.agents.createConversation({
          agent_name: "onboarding_guide",
          metadata: { name: "First project", description: "Onboarding walkthrough" }
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
          setError("The guide could not open a session. Try again in a moment.");
          setStarting(false);
        }
      }
    })();

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

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

  const openers = isFirstRun ? FIRST_RUN_OPENERS : RETURNING_OPENERS;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="h-4 w-4 text-primary" />
          {isFirstRun ? "Your first project" : "Launch your project"}
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            guide
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {starting && (
          <p className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking where you are
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
            {openers.map((opener) => (
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

        <div className="max-h-80 space-y-2.5 overflow-y-auto">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const isSeed = isUser && index === 0;
            if (isSeed) {
              return (
                <p key={index} className="font-mono text-[10px] text-muted-foreground">
                  workspace checked
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
            placeholder="Ask what to do next"
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