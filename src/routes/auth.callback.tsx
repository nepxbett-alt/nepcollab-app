import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
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
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await handleAuthCallback();
        if (cancelled) return;
        // Clean query params from URL without reload
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
        setError(err instanceof Error ? err.message : "Could not complete sign-in.");
        setWorking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handleAuthCallback, navigate]);

  if (error) {
    return (
      <Container className="max-w-md py-12 text-center">
        <Logo size={40} withWordmark={false} />
        <h1 className="mt-6 text-xl font-bold tracking-tight">Sign-in link problem</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-6 h-11 rounded-full" onClick={() => navigate({ to: "/auth" })}>
          Request a new link
        </Button>
      </Container>
    );
  }

  return (
    <Container className="max-w-md py-16 text-center">
      <Logo size={40} withWordmark={false} />
      <p className="mt-6 text-sm text-muted-foreground">
        {working ? "Signing you in…" : "Almost there…"}
      </p>
    </Container>
  );
}
