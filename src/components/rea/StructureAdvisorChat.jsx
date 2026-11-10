import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Send } from "lucide-react";

const OPENERS = [
  "Read the last run and tell me how the structure should change.",
  "Which stage gave no evidence, and what does that block?",
  "Give me the migration order for the first recommendation."
];

async function buildSeed(analysis) {
  const page = await base44.entities.ReaRun
    .filter({}, { sort: "-created_date", limit: 5 })
    .catch(() => ({ items: [] }));

  const runs = (page.items || []).map((run) => {
    const stages = (run.stages || [])
      .map((stage) => stage.key + ":" + stage.status)
      .join(", ");
    return (
      "- [" + run.id + "] " + run.target_url + " · " + run.mode + " · " + run.status +
      " · " + (stages || "no stages recorded") +
      (run.analysis_id ? " · dossier " + run.analysis_id : "")
    );
  });

  return [
    "ReaRun records available: " + runs.length,
    ...(runs.length ? runs : ["- none recorded"]),
    analysis
      ? "Open dossier: " + analysis.title + " (" + analysis.url + ") [" + analysis.id + "]"
      : "",
    "Interpret the most recent run and propose improvements to the modernized code structure. " +
      "Nothing in a run is proof of code you have not seen."
  ]
    .filter(Boolean)
    .join("\n");
}

export default function StructureAdvisorChat({ analysis }) {
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
        const seed = await buildSeed(analysis);
        const ref = await base44.agents.createConversation({
          agent_name: "structure_advisor",
          metadata: {
            name: analysis ? "Structure · " + analysis.title : "Structure review",
            description: "ReaRun interpretation and structural recommendations"
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
          setError("The advisor could not open a session. Try again in a moment.");
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
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading the latest runs...
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
                run telemetry attached
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
          placeholder="Ask how the structure should change"
          disabled={starting || !conversation}
        />
        <Button type="submit" size="icon" disabled={starting || !conversation || !draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}