import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { resolvePostAuthDestination } from "@/lib/home-path";
import { toUserError } from "@/lib/user-error";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === "string" ? search.error : undefined,
    error_description:
      typeof search.error_description === "string"
        ? search.error_description
        : typeof search.error_code === "string"
          ? search.error_code
          : undefined,
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  head: () => ({
    meta: [{ title: "Signing you in — NepCollab" }],
  }),
  component: AuthCallbackPage,
});

function oauthErrorMessage(error?: string, description?: string) {
  const e = (error || "").toLowerCase();
  const d = (description || "").toLowerCase();
  if (e === "access_denied" || d.includes("access_denied") || d.includes("cancel")) {
    return "Google sign-in was cancelled. You can try again whenever you're ready.";
  }
  if (description) return description;
  if (error) return `Sign-in failed (${error}). Please try again.`;
  return "Sign-in could not be completed. Please try again.";
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { handleAuthCallback } = useStore();
  const search = Route.useSearch();
  const [phase, setPhase] = useState<"working" | "error">("working");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // OAuth provider error — do not attempt code exchange
    if (search.error) {
      setError(oauthErrorMessage(search.error, search.error_description));
      setPhase("error");
      try {
        window.history.replaceState({}, document.title, "/auth/callback");
      } catch {
        /* ignore */
      }
      return;
    }

    (async () => {
      try {
        const result = await handleAuthCallback();
        if (cancelled) return;
        try {
          sessionStorage.removeItem("nepcollab.auth.email");
          localStorage.removeItem("nepcollab.auth.email");
          window.history.replaceState({}, document.title, "/auth/callback");
        } catch {
          /* ignore */
        }
        // Profile role wins over temporary intent so returning users always land in their workspace
        const dest = resolvePostAuthDestination({
          role: result.role,
          onboarded: result.onboarded,
        });
        navigate({ to: dest as "/" });
      } catch (err) {
        if (cancelled) return;
        setError(toUserError(err, "Sign-in could not be completed. Please try again."));
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handleAuthCallback, navigate, search.error, search.error_description]);

  if (phase === "error") {
    return (
      <Container className="max-w-md py-12 text-center">
        <Logo size={40} withWordmark={false} />
        <h1 className="mt-6 text-xl font-bold tracking-tight">Couldn&apos;t complete sign-in</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button className="h-11 rounded-full" onClick={() => navigate({ to: "/auth" })}>
            Back to sign in
          </Button>
          <Button variant="outline" className="h-11 rounded-full" asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-md py-16 text-center">
      <Logo size={40} withWordmark={false} />
      <p className="mt-6 text-sm text-muted-foreground">Signing you in…</p>
    </Container>
  );
}
