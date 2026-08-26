import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, Handshake, Sparkles } from "lucide-react";
import { CampaignCard } from "@/components/CampaignCard";
import { Container, SectionHeader } from "@/components/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NepCollab — Create. Connect. Grow." },
      {
        name: "description",
        content:
          "Nepal's creator × brand collaboration platform. Brands post opportunities. Creators apply. Brands select. Both collaborate.",
      },
      { property: "og:title", content: "NepCollab — Create. Connect. Grow." },
      {
        property: "og:description",
        content: "Discover collaborations. Work with brands. Build your creator journey.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nepcollab.vercel.app" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function isOpenCampaign(status: string) {
  const s = String(status || "");
  return (
    s === "APPLICATIONS_OPEN" ||
    s === "PUBLISHED" ||
    s === "ACTIVE" ||
    s.toLowerCase() === "active" ||
    s.toLowerCase() === "published" ||
    s.toLowerCase() === "applications_open"
  );
}

function Home() {
  const { campaigns, saved, toggleSaved, loading, signedIn } = useStore();
  const open = campaigns.filter((c) => isOpenCampaign(c.status));
  const featured = open.filter((c) => c.featured).slice(0, 6);
  const showcase = featured.length ? featured : open.slice(0, 6);
  const openCount = open.length;

  return (
    <div className="panel-mist min-h-full">
      <section className="relative overflow-hidden border-b border-border/80">
        <Container className="relative py-12 sm:py-16 lg:py-20">
          <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-xl">
              <p className="type-kicker animate-rise text-signal">Nepal · Creator collaborations</p>
              <h1 className="type-display animate-rise-delay-1 mt-4 text-[clamp(2.35rem,7vw,3.75rem)] text-foreground">
                CREATE.
                <br />
                CONNECT.
                <br />
                <span className="text-signal">GROW.</span>
              </h1>
              <div className="animate-rise-delay-2 valley-ridge mt-5 max-w-[11rem]" aria-hidden />
              <p className="animate-rise-delay-2 mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Brands post real opportunities. Creators apply with a clear pitch. Both collaborate
                in one place—without a public creator marketplace or middlemen on payouts.
              </p>
              <div className="animate-rise-delay-3 mt-8 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <Link
                  to={signedIn ? "/campaigns" : "/auth"}
                  {...(signedIn
                    ? {}
                    : { search: { as: "creator" as const, next: undefined } })}
                  className="tap inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[14px] font-semibold text-ink-foreground shadow-sm hover:opacity-95"
                >
                  {signedIn ? "Browse campaigns" : "Join as creator"}
                  <ArrowRight className="size-4 opacity-80" />
                </Link>
                <Link
                  to={signedIn ? "/brand/campaigns" : "/auth"}
                  {...(signedIn
                    ? {}
                    : { search: { as: "brand" as const, next: undefined } })}
                  className="tap inline-flex h-12 items-center justify-center rounded-full border border-border bg-card/80 px-6 text-[14px] font-semibold backdrop-blur hover:bg-secondary"
                >
                  {signedIn ? "Brand workspace" : "I am a brand"}
                </Link>
              </div>
            </div>

            <div className="animate-rise-delay-2 panel-ink relative overflow-hidden rounded-[1.75rem] p-6 shadow-lg sm:p-7">
              <div
                className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-signal/20 blur-2xl"
                aria-hidden
              />
              <p className="type-kicker text-white/55">Live on the platform</p>
              <p className="mt-3 font-display text-[3.25rem] font-bold leading-none tracking-tight tabular-nums">
                {loading && openCount === 0 ? "—" : openCount}
              </p>
              <p className="mt-2 text-[14px] text-white/75">
                open campaign{openCount === 1 ? "" : "s"} ready for applications
              </p>
              <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-[13px] text-white/80">
                <p className="flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-signal" />
                  Discover briefs by niche, city, and platform
                </p>
                <p className="flex items-start gap-2.5">
                  <Briefcase className="mt-0.5 size-4 shrink-0 text-signal" />
                  Apply in minutes with a focused pitch
                </p>
                <p className="flex items-start gap-2.5">
                  <Handshake className="mt-0.5 size-4 shrink-0 text-signal" />
                  Collaborate privately after you are selected
                </p>
              </div>
              <Link
                to="/campaigns"
                className="tap mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white hover:text-signal"
              >
                View all opportunities
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-border/80 py-12 sm:py-14">
        <Container>
          <SectionHeader
            title="How NepCollab works"
            hint="Three steps from brief to collaboration"
          />
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Post or discover",
                body: "Brands publish a clear brief. Creators browse open campaigns—not a public talent directory.",
              },
              {
                n: "02",
                title: "Apply or review",
                body: "Creators pitch once. Brands shortlist applicants for that campaign only.",
              },
              {
                n: "03",
                title: "Collaborate",
                body: "Message, deliver, and track status together until the work is done.",
              },
            ].map((step) => (
              <li
                key={step.n}
                className="surface-card rounded-3xl border border-border bg-card p-5 shadow-sm"
              >
                <span className="font-display text-[13px] font-semibold tabular-nums text-signal">
                  {step.n}
                </span>
                <h2 className="mt-2 text-[16px] font-bold tracking-tight">{step.title}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="py-12 sm:py-14">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="type-kicker text-muted-foreground">Creators</p>
              <h2 className="mt-2 text-lg font-bold tracking-tight">Find campaigns that fit</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Apply to brand opportunities across Nepal, manage applications, and keep
                collaborations in one home.
              </p>
              <Link
                to="/campaigns"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-signal hover:underline"
              >
                Browse opportunities
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="type-kicker text-muted-foreground">Brands</p>
              <h2 className="mt-2 text-lg font-bold tracking-tight">Publish once, review cleanly</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Post a brief, review applicants for your campaigns, and message selected
                talent—relationship-based, not a public creator feed.
              </p>
              <Link
                to="/auth"
                search={{ as: "brand", next: undefined }}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-signal hover:underline"
              >
                Sign in as brand
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {showcase.length > 0 ? (
        <section className="border-t border-border/80 py-12 sm:py-14">
          <Container>
            <SectionHeader
              title="Open opportunities"
              actionLabel="View all"
              actionTo="/campaigns"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  saved={saved.includes(c.id)}
                  onToggleSave={(id) => void toggleSaved(id)}
                />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="border-t border-border py-14">
        <Container className="text-center">
          <div className="valley-ridge mx-auto mb-6 max-w-[6rem]" aria-hidden />
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Ready when you are
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Free to join. Sign in with Google or email—no password required.
          </p>
          <Link
            to="/auth"
            search={{ as: undefined, next: undefined }}
            className="tap mt-6 inline-flex h-12 items-center rounded-full bg-ink px-7 text-[14px] font-semibold text-ink-foreground hover:opacity-95"
          >
            Join NepCollab
          </Link>
          <p className="mt-5 text-[11px] text-muted-foreground">
            <Link to="/help" className="underline-offset-2 hover:underline">
              Help
            </Link>
            {" · "}
            <Link to="/terms" className="underline-offset-2 hover:underline">
              Terms
            </Link>
            {" · "}
            <Link to="/privacy" className="underline-offset-2 hover:underline">
              Privacy
            </Link>
          </p>
        </Container>
      </section>
    </div>
  );
}
