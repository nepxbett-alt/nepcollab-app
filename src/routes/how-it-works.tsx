import { createFileRoute, Link } from "@tanstack/react-router";
import { Container, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — NepCollab" },
      {
        name: "description",
        content: "How businesses and creators work with NepCollab.",
      },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <Container className="max-w-lg py-8">
      <PageHeader title="How it works" subtitle="Businesses list. Creators register. Admin matches." />
      <div className="mt-6 space-y-4">
        {[
          {
            n: "1",
            t: "Business lists",
            b: "Submit a short profile. After admin approval, the business appears on the homepage.",
          },
          {
            n: "2",
            t: "Creators get notified",
            b: "Active creators see an alert in their space when a new business is published.",
          },
          {
            n: "3",
            t: "Admin matches & closes",
            b: "Admin proposes creators. Brand selects. Admin notifies the creator and the deal moves forward.",
          },
        ].map((s) => (
          <div key={s.n} className="rounded-3xl border border-border bg-card p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-signal">Step {s.n}</p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight">{s.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.b}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        <Link
          to="/list-business"
          className="tap flex h-12 items-center justify-center rounded-full bg-ink text-sm font-bold text-ink-foreground"
        >
          List business
        </Link>
        <Link
          to="/join-creator"
          className="tap flex h-12 items-center justify-center rounded-full border border-border text-sm font-bold"
        >
          Join as creator
        </Link>
      </div>
    </Container>
  );
}
