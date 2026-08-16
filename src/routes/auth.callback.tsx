import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { toUserError } from "@/lib/user-error";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Signing you in — NepCollab" }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { handleAuthCallback } = useStore();
  const [phase, setPhase] = useState<"working" | "error">("working");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await handleAuthCallback();
        if (cancelled) return;
        try {
          window.history.replaceState({}, document.title, "/auth/callback");
        } catch {
          /* ignore */
        }
        if (result.onboarded) {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/onboarding" });
        }
      } catch (err) {
        if (cancelled) return;
        setError(toUserError(err, "This login link is invalid or has expired. Please request a new one."));
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handleAuthCallback, navigate]);

  if (phase === "error") {
    return (
      <Container className="max-w-md py-12 text-center">
        <Logo size={40} withWordmark={false} />
        <h1 className="mt-6 text-xl font-bold tracking-tight">Couldn&apos;t complete sign-in</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button className="h-11 rounded-full" onClick={() => navigate({ to: "/auth" })}>
            Request a new link
          </Button>
          <Button variant="ghost" className="h-11 rounded-full" onClick={() => navigate({ to: "/" })}>
            Back to home
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-md py-16 text-center">
      <Logo size={40} withWordmark={false} />
      <div
        className="mx-auto mt-8 size-8 animate-spin rounded-full border-2 border-muted border-t-signal"
        aria-hidden
      />
      <p className="mt-6 text-sm font-medium">Signing you in…</p>
      <p className="mt-1 text-xs text-muted-foreground">This only takes a moment.</p>
    </Container>
  );
}
