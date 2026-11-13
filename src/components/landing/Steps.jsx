import React from "react";
import { ShieldCheck, Radar, FileJson } from "lucide-react";

const STEPS = [
  {
    icon: ShieldCheck,
    title: "Prove control",
    body: (
      <>
        Publish a DNS TXT record at{" "}
        <span className="font-mono text-foreground">_revengine-verify.&lt;your-domain&gt;</span>{" "}
        or drop a file at{" "}
        <span className="font-mono text-foreground">/.well-known/revengine-verify.txt</span>.
        Nothing is mapped until one of the two answers.
      </>
    ),
  },
  {
    icon: Radar,
    title: "Run the map",
    body: "The declared bundles are read, a real browser loads what it finds, prefix expansion looks for undocumented siblings, and runtime calls are confirmed.",
  },
  {
    icon: FileJson,
    title: "Receive the truth table",
    body: "You get it as JSON: every path with its status, its access and its provenance, ready to diff against your documentation.",
  },
];

export default function Steps() {
  return (
    <section id="steps" className="border-b border-border/60">
      <div className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            The three steps
          </h2>
          <p className="mt-4 text-muted-foreground">
            From claiming a host to holding the evidence, in order.
          </p>
        </div>

        <ol className="mt-10 grid md:grid-cols-3 gap-5">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="rounded-2xl border border-border bg-card/40 p-6">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-xs text-primary">
                    0{index + 1}
                  </span>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}