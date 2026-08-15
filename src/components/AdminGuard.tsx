import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Container } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { checkIsAdmin } from "@/lib/admin";
import { useStore } from "@/lib/store";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { signedIn, role, loading } = useStore();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (loading) return;
      if (!signedIn) {
        if (!cancelled) setOk(false);
        return;
      }
      if (role === "admin") {
        if (!cancelled) setOk(true);
        return;
      }
      const admin = await checkIsAdmin();
      if (!cancelled) setOk(admin);
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn, role, loading]);

  if (loading || ok === null) {
    return (
      <Container className="py-16 text-center text-sm text-muted-foreground">
        Checking admin access…
      </Container>
    );
  }

  if (!ok) {
    return (
      <Container>
        <EmptyState
          title="Admin access required"
          body="This area is only for platform administrators. Sign in with an admin account."
          actionLabel="Go to sign in"
          actionTo="/auth"
        />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          First-time setup: run the admin SQL migration, then{" "}
          <code className="rounded bg-muted px-1">bootstrap_first_admin</code> for your user id.
        </p>
        <div className="mt-2 text-center">
          <Link to="/dashboard" className="text-sm text-primary underline">
            Back to app
          </Link>
        </div>
      </Container>
    );
  }

  return <>{children}</>;
}
