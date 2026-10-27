import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Check, Loader2, Lock, ScanLine } from "lucide-react";

const INCLUDED = [
  "Full logic map of one website",
  "Claude Code–ready rebuild prompt",
  "White-label clone generator",
  "Saved so you can reopen it anytime",
  "No subscription, no renewal",
];

export default function Checkout() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.auth
      .me()
      .then((user) => setEmail(user.email))
      .catch(() => {});
  }, []);

  const handlePay = async () => {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const response = await base44.functions.invoke("create-checkout", {
        productId: "revengine-analysis",
        quantity: 1,
      });
      if (!response.data?.redirectUrl) throw new Error("Could not start checkout.");
      window.location.href = response.data.redirectUrl;
    } catch (err) {
      setError(
        (err && err.response && err.response.data && err.response.data.error) ||
          (err && err.message) ||
          "Could not start checkout."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-5 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="mt-8 flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <ScanLine className="w-5 h-5 text-primary" />
          REVENGINE
        </div>

        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">Add a website teardown</h1>
        <p className="mt-2 text-muted-foreground">
          $49.99 once per website. No subscription, no renewal.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold">Website teardown</h2>
                  <p className="text-sm text-muted-foreground">One site, fully reverse-engineered</p>
                </div>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  One-time
                </span>
              </div>

              <div className="mt-6 flex items-end gap-2 border-b border-border/70 pb-6">
                <span className="font-display text-4xl font-bold tracking-tight">$49.99</span>
                <span className="pb-1 text-sm text-muted-foreground">USD per website</span>
              </div>

              <ul className="mt-5 space-y-2.5 text-sm">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check className="mt-0.5 w-4 h-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-display text-lg font-semibold">Payment</h2>
              {email && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Access goes to <span className="text-foreground">{email}</span>
                </p>
              )}

              {error && (
                <div className="mt-4 flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button className="mt-5 w-full" size="lg" onClick={handlePay} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting checkout...
                  </>
                ) : (
                  "Pay $49.99 — one website"
                )}
              </Button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="w-3.5 h-3.5" />
                Secure checkout by Base44 Payments
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                You&apos;ll enter payment details on the secure checkout page, then return here with access unlocked.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}