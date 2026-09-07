import { createFileRoute, Link } from "@tanstack/react-router";
import { Container, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — NepCollab" },
      {
        name: "description",
        content: "How NepCollab helps businesses work with creators for campaigns and content.",
      },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <Container className="max-w-lg py-8">
      <PageHeader title="How it works" subtitle="Simple process. Real support." />
      <div className="mt-6 space-y-4">
        {[
          {
            n: "1",
            t: "Tell us what you need",
            b: "Submit your business request: what you are promoting, the content you want, and your timeline.",
          },
          {
            n: "2",
            t: "NepCollab finds the right fit",
            b: "Our team reviews your brief and identifies creators who match your category, audience and style.",
          },
          {
            n: "3",
            t: "Launch your campaign",
            b: "We help coordinate next steps so your collaboration moves from brief to published content.",
          },
        ].map((s) => (
          <div key={s.n} className="rounded-3xl border border-border bg-card p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-signal">Step {s.n}</p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight">{s.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.b}</p>
          </div>
        ))}
      </div>
      <Link
        to="/request"
        className="tap mt-8 flex h-12 items-center justify-center rounded-full bg-ink text-[15px] font-bold text-ink-foreground"
      >
        Get started
      </Link>
    </Container>
  );
}
