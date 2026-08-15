import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — NepCollab" },
      {
        name: "description",
        content: "Sign in or create your NepCollab account with a secure email link. No password required.",
      },
      { property: "og:title", content: "Sign in — NepCollab" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { requestMagicLink, signedIn, loading, onboarded } = useStore();
  const { next } = Route.useSearch();
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [lastEmail, setLastEmail] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nepcollab.auth.email");
      if (saved) setEmail(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (signedIn && onboarded) {
      navigate({ to: safeNext as "/" });
    } else if (signedIn && !onboarded) {
      navigate({ to: "/onboarding" });
    }
  }, [loading, signedIn, onboarded, navigate, safeNext]);

  const sendLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      await requestMagicLink(normalized);
      setLastEmail(normalized);
      setSent(true);
      toast.success("Check your email for the login link.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't send the login link. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Container className="max-w-md py-10">
        <Logo size={40} withWordmark={false} />
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-signal/12">
            <Mail className="size-5 text-signal" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a secure login link to{" "}
            <strong className="text-foreground">{lastEmail}</strong>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Open your email and tap the link to continue. You can close this tab after you open the link.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full"
              disabled={busy}
              onClick={() => void sendLink()}
            >
              {busy ? "Sending…" : "Resend link"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-full"
              onClick={() => {
                setSent(false);
                setBusy(false);
              }}
            >
              Use a different email
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-md py-10">
      <Logo size={40} withWordmark={false} />
      <p className="mt-4 text-[13px] font-medium text-signal">Create. Connect. Grow.</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">Sign in or create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        No password required. We'll send you a secure login link.
      </p>

      <form onSubmit={(e) => void sendLink(e)} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 h-12"
            autoFocus
          />
        </div>
        <Button
          disabled={busy}
          type="submit"
          size="lg"
          className="h-12 w-full rounded-full bg-signal text-signal-foreground hover:bg-signal/90"
        >
          {busy ? "Sending link…" : "Continue with email"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[12px] text-muted-foreground">
        First time here? Use your email — we'll create your account when you open the link.
      </p>
    </Container>
  );
}
