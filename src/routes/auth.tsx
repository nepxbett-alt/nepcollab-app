import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toUserError } from "@/lib/user-error";
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
        content: "Sign in to NepCollab with Google or a secure email link.",
      },
      { property: "og:title", content: "Sign in — NepCollab" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { requestMagicLink, signInWithGoogle, verifyEmailOtp, signedIn, loading, onboarded } =
    useStore();
  const { next } = Route.useSearch();
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [lastEmail, setLastEmail] = useState("");
  const [otp, setOtp] = useState("");

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
    if (busy || googleBusy) return;
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
      toast.error(
        toUserError(error, "We couldn't send your login link right now. Please try again later."),
      );
    } finally {
      setBusy(false);
    }
  };

  const continueWithGoogle = async () => {
    if (busy || googleBusy) return;
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      // Redirect to Google — keep button disabled
    } catch (error) {
      setGoogleBusy(false);
      toast.error(toUserError(error, "Unable to sign in with Google. Please try again."));
    }
  };

  if (loading) {
    return (
      <Container className="max-w-md py-16 text-center text-sm text-muted-foreground">
        Checking your session…
      </Container>
    );
  }

  if (sent) {
    return (
      <Container className="max-w-md py-10 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Mail className="size-6" />
        </div>
        <h1 className="mt-6 text-xl font-bold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ve sent a secure login link to
          <br />
          <span className="font-medium text-foreground">{lastEmail}</span>
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Open your email and tap the link to continue. You can close this tab after you open the link
          on your phone.
        </p>

        <form
          className="mt-6 space-y-3 text-left"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy || otp.trim().length < 6) return;
            setBusy(true);
            try {
              await verifyEmailOtp(lastEmail, otp.trim());
              toast.success("Signed in");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Invalid or expired code.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Label htmlFor="otp">Or enter the 6-digit code from the email</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
            className="h-12 tracking-widest"
          />
          <Button type="submit" className="h-11 w-full rounded-full" disabled={busy || otp.length < 6}>
            {busy ? "Verifying…" : "Verify code"}
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-2">
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
      </Container>
    );
  }

  return (
    <Container className="max-w-md py-10">
      <Logo size={40} withWordmark={false} />
      <p className="mt-4 text-[13px] font-medium text-signal">Create. Connect. Grow.</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">Sign in or create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Continue with Google, or use a secure email link—no password required.
      </p>

      <Button
        type="button"
        size="lg"
        variant="outline"
        className="mt-8 h-12 w-full rounded-full border-border bg-card text-[15px] font-semibold"
        disabled={busy || googleBusy}
        onClick={() => void continueWithGoogle()}
      >
        {googleBusy ? (
          "Connecting to Google…"
        ) : (
          <span className="inline-flex items-center gap-2">
            <GoogleIcon />
            Continue with Google
          </span>
        )}
      </Button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={(e) => void sendLink(e)} className="space-y-4">
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
          />
        </div>
        <Button
          disabled={busy || googleBusy}
          type="submit"
          size="lg"
          className="h-12 w-full rounded-full bg-signal text-signal-foreground hover:bg-signal/90"
        >
          {busy ? "Sending link…" : "Continue with email"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[12px] text-muted-foreground">
        By continuing you agree to our{" "}
        <a href="/terms" className="underline">
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline">
          Privacy
        </a>
        .
      </p>
    </Container>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3.1l5.7-5.7C34.2 6.5 29.4 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.6-.2-3.1-.5-4.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 8 3.1l5.7-5.7C34.2 6.5 29.4 4.5 24 4.5 16.1 4.5 9.2 8.9 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 45.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 36.9 26.8 38 24 38c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.1 41.1 16 45.5 24 45.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.5 7.1l6.2 5.2C38.9 37.1 44.5 31.8 44.5 25c0-1.6-.2-3.1-.5-4.5z"
      />
    </svg>
  );
}
