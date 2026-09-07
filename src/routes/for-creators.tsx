import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Container, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/for-creators")({
  head: () => ({
    meta: [
      { title: "For creators — NepCollab" },
      {
        name: "description",
        content: "Register as a creator. Get notified when businesses list on NepCollab.",
      },
    ],
  }),
  component: ForCreators,
});

function ForCreators() {
  return (
    <Container className="max-w-lg py-8">
      <PageHeader
        title="For creators"
        subtitle="Register once. Get notified when businesses list. Admin handles the match."
      />
      <div className="mt-6 space-y-4">
        {[
          {
            t: "We’ll notify you",
            b: "When a business is approved and listed on the homepage, active creators receive an alert in their workspace.",
          },
          {
            t: "No cold outreach required",
            b: "NepCollab admin proposes fits based on niche and platform. Brands select — then we notify you.",
          },
          {
            t: "Login required for your space",
            b: "Sign in with the same email (Google) to see alerts, status, and matches.",
          },
        ].map((x) => (
          <div key={x.t} className="rounded-3xl border border-border bg-card p-5">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <h2 className="font-display text-base font-bold tracking-tight">{x.t}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{x.b}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link
        to="/join-creator"
        className="tap mt-8 flex h-12 items-center justify-center rounded-full bg-ink text-[15px] font-bold text-ink-foreground"
      >
        Register as creator
      </Link>
      <Link
        to="/auth"
        search={{ next: "/creator" } as any}
        className="tap mt-3 flex h-11 items-center justify-center text-sm font-semibold text-signal"
      >
        Already registered? Sign in
      </Link>
    </Container>
  );
}
