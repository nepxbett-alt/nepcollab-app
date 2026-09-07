import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Container } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NepCollab — Connect your business with the right creators" },
      {
        name: "description",
        content:
          "NepCollab helps businesses in Nepal work with creators for marketing campaigns, content and promotions.",
      },
      { property: "og:title", content: "NepCollab — Connect with the right creators" },
      {
        property: "og:description",
        content: "A simple way for businesses to brief campaigns and work with creators.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nepcollab.vercel.app" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="pb-10">
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-signal/25 blur-3xl" />
        <Container className="relative py-14 sm:py-20">
          <p className="type-kicker text-ink-foreground/55">NepCollab · Nepal</p>
          <h1 className="mt-3 max-w-xl font-display text-[2.4rem] font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Connect your business with the{" "}
            <span className="text-signal">right creators</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-foreground/75">
            A simple platform for businesses to brief campaigns, content and promotions —
            we help match you with the right creator fit.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/request"
              className="tap inline-flex h-12 items-center justify-center rounded-full bg-signal px-7 text-[15px] font-bold text-signal-foreground"
            >
              Get started
            </Link>
            <Link
              to="/how-it-works"
              className="tap inline-flex h-12 items-center justify-center rounded-full border border-ink-foreground/25 px-7 text-[15px] font-semibold text-ink-foreground"
            >
              How it works
            </Link>
          </div>
        </Container>
        <div className="valley-ridge-light mx-auto max-w-[6rem] pb-4" aria-hidden />
      </section>

      <Container className="py-12">
        <p className="type-kicker text-signal">How it works</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Three clear steps</h2>
        <ol className="mt-6 space-y-5">
          {[
            {
              t: "Tell us what you need",
              b: "Submit a short brief: product, audience, content type, and timeline.",
            },
            {
              t: "We find the right fit",
              b: "NepCollab reviews your request and identifies suitable creator matches.",
            },
            {
              t: "Launch your campaign",
              b: "We help move the collaboration forward so your promotion gets made.",
            },
          ].map((s, i) => (
            <li key={s.t} className="flex gap-4 rounded-3xl border border-border bg-card p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-ink-foreground">
                {i + 1}
              </span>
              <div>
                <p className="font-display text-base font-bold tracking-tight">{s.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.b}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>

      <Container className="pb-8">
        <div className="rounded-3xl border border-border bg-secondary/50 p-6 text-center sm:p-8">
          <Sparkles className="mx-auto size-6 text-signal" />
          <h2 className="mt-3 font-display text-xl font-bold tracking-tight">
            Ready to promote your business?
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Share a few details. Our team will review and get back to you.
          </p>
          <Link
            to="/request"
            className="tap mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-8 text-[15px] font-bold text-ink-foreground"
          >
            Work with NepCollab <ArrowRight className="size-4" />
          </Link>
          <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-2 text-left text-[13px] text-muted-foreground">
            {[
              "No account required for businesses",
              "Clear brief — we handle matching",
              "Built for Nepal brands & creators",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-8 text-center text-[12px] text-muted-foreground">
          <Link to="/how-it-works" className="hover:underline">How it works</Link>
          {" · "}
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          {" · "}
          <Link to="/terms" className="hover:underline">Terms</Link>
        </p>
      </Container>
    </div>
  );
}
