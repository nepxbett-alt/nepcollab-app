import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Container } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useStore } from "@/lib/store";

/** Client gate for brand-only pages. RLS still enforces data access. */
export function BrandGuard({ children }: { children: ReactNode }) {
  const { signedIn, role, loading } = useStore();

  if (loading) {
    return (
      <Container className="py-16 text-center text-sm text-muted-foreground">
        Loading…
      </Container>
    );
  }

  if (!signedIn) {
    return (
      <Container>
        <EmptyState
          title="Sign in as a brand"
          body="Publish campaigns and review applicants after you create a brand account."
          actionLabel="Sign in as brand"
          actionTo="/auth"
        />
        <p className="mt-3 text-center text-sm">
          <Link
            to="/auth"
            search={{ as: "brand", next: undefined }}
            className="font-semibold text-signal hover:underline"
          >
            Continue as brand →
          </Link>
        </p>
      </Container>
    );
  }

  if (role !== "brand") {
    return (
      <Container>
        <EmptyState
          title="Brand workspace only"
          body="This area is for brand accounts. Open your creator home or sign in with a brand account."
          actionLabel={role === "admin" ? "Admin home" : "Creator home"}
          actionTo={role === "admin" ? "/admin" : "/dashboard"}
        />
      </Container>
    );
  }

  return <>{children}</>;
}
