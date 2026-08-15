import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Container } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { checkIsAdmin } from "@/lib/admin";
import { useStore } from "@/lib/store";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { signedIn, role, loading } = useStore();
  const [ok, setOk] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (loading) return;
      if (!signedIn) {
        if (!cancelled) setOk(false);
        return;
      }
      // Fast path from store, then confirm with is_admin RPC
      if (role === "admin") {
        const confirmed = await checkIsAdmin();
        if (!cancelled) setOk(confirmed);
        return;
      }
      const admin = await checkIsAdmin();
      if (!cancelled) setOk(admin);
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn, role, loading]);

  useEffect(() => {
    if (ok === false && !loading && signedIn === false) {
      // leave message on page
    }
  }, [ok, loading, signedIn, navigate]);

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
          body="Only authorized platform administrators can open this area."
          actionLabel={signedIn ? "Back to home" : "Sign in"}
          actionTo={signedIn ? "/dashboard" : "/auth"}
        />
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-primary underline">
            Public site
          </Link>
        </div>
      </Container>
    );
  }

  return <>{children}</>;
}
