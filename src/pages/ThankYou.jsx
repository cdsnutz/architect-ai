import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Loader2, ScanLine } from "lucide-react";

export default function ThankYou() {
  const [state, setState] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    const poll = async (attempt) => {
      try {
        const response = await base44.functions.invoke("checkAccess");
        if (cancelled) return;
        if (response.data?.hasAccess) {
          setState("granted");
          return;
        }
        if (response.data?.signedIn === false) {
          setState("signedOut");
          return;
        }
      } catch (err) {
        // keep polling — fulfillment may still be landing
      }
      if (attempt >= 4) {
        if (!cancelled) setState("pending");
        return;
      }
      setTimeout(() => poll(attempt + 1), 2500);
    };

    poll(0);
    return () => {
      cancelled = true;
    };
  }, []);

  const copy = {
    checking: {
      title: "Confirming your payment",
      body: "This usually takes a few seconds. Keep this page open.",
    },
    granted: {
      title: "You're in — your website is unlocked",
      body: "Open the workspace and paste the URL of the site you paid for.",
    },
    pending: {
      title: "Payment received, access is landing",
      body: "If the workspace is still locked, wait a minute and reload this page.",
    },
    signedOut: {
      title: "Payment received — sign in to finish",
      body: "Sign in with the email you used at checkout to attach your website.",
    },
  }[state];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 font-display font-bold mb-8">
          <ScanLine className="w-5 h-5 text-primary" />
          REVENGINE
        </Link>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {state === "checking" ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              )}
            </div>

            <h1 className="mt-5 font-display text-2xl font-bold">{copy.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{copy.body}</p>

            <div className="mt-7 space-y-3">
              {state === "signedOut" ? (
                <Button className="w-full" asChild>
                  <Link to="/login?returnTo=%2Fworkspace">Sign in</Link>
                </Button>
              ) : (
                <Button className="w-full gap-2" asChild disabled={state === "checking"}>
                  <Link to="/workspace">
                    Open workspace
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}