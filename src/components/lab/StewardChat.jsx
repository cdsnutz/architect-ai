import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Send, UserCog } from "lucide-react";

const OPENERS = [
  "What is still pending, and what does each record need?",
  "Which test account is not verified yet?",
  "Can this request run, or is a host still missing?"
];

async function buildSeed(requestId) {
  const [pending, accounts] = await Promise.all([
    base44.entities.DataRequest
      .filter({ status: { $in: ["planned", "authorized"] } }, { sort: "-created_date", limit: 10 })
      .catch(() => ({ items: [] })),
    base44.entities.TestAccount
      .filter({ status: { $in: ["provisioned", "awaiting_verification", "failed", "expired"] } }, { sort: "-created_date", limit: 10 })
      .catch(() => ({ items: [] }))
  ]);

  const requests = (pending.items || []).map(
    (record) =>
      "- " + (record.title || record.request || "untitled") + " [" + record.id + "] · " + record.status +
      " · targets: " + (Array.isArray(record.authorized_targets) && record.authorized_targets.length ? record.authorized_targets.join(", ") : "none")
  );
  const tests = (accounts.items || []).map(
    (account) =>
      "- " + (account.site_label || account.target_url || "untitled") + " [" + account.id + "] · " + account.status + " · " + (account.alias_email || "no alias")
  );

  return [
    "Pending work snapshot from the app database.",
    "",
    "Data requests awaiting fulfillment: " + requests.length,
    ...(requests.length ? requests : ["- none"]),
    "",
    "Test accounts not verified: " + tests.length,
    ...(tests.length ? tests : ["- none"]),
    requestId ? "" : "",
    requestId ? "The operator currently has data request [" + requestId + "] open." : "",
    "",
    "Read these records, then list what each one still needs. Do not run a probe or change a record until I confirm."
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export default function StewardChat({ requestId }) {
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
        const seed = await buildSeed(requestId);
        const ref = await base44.agents.createConversation({
          agent_name: "test_steward",
          metadata: { name: "Test Steward", description: "Test account and pending request stewardship" }
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
          setError("The steward could not open a session. Try again in a moment.");
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
          <UserCog className="h-4 w-4 text-primary" />
          Test Steward
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            agent
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {starting && (
          <p className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Reading pending records
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
            return (
              <div key={index} className={isUser ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    isSeed
                      ? "max-w-full rounded-lg border border-dashed px-3 py-2 font-mono text-[10px] leading-relaxed text-muted-foreground"
                      : isUser
                      ? "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-[11px] text-primary-foreground"
                      : "max-w-[95%] rounded-lg border bg-muted/30 px-3 py-2 text-[11px]"
                  }
                >
                  {message.content &&
                    (isUser ? (
                      <p className="whitespace-pre-wrap">{isSeed ? "pending work snapshot sent" : message.content}</p>
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
            placeholder="Tell the steward what to configure or run"
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