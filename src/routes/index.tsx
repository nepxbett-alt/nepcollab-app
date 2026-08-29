import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, Sparkles, Users } from "lucide-react";
import { Container } from "@/components/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NepCollab — Create. Connect. Grow." },
      {
        name: "description",
        content:
          "Nepal's collaboration platform. Brands post opportunities. Creators apply. Brands select. Both collaborate.",
      },
      { property: "og:title", content: "NepCollab — Create. Connect. Grow." },
      {
        property: "og:description",
        content: "Brands post opportunities. Creators apply. Brands select. Both collaborate.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nepcollab.vercel.app" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function isOpenCampaign(status: string) {
  const s = String(status || "").toLowerCase().replace(/\s+/g, "_");
  return s === "applications_open" || s === "published" || s === "active" || s === "open";
}

function Home() {
  const { campaigns, saved, toggleSaved, loading, signedIn, role } = useStore();
  const openCampaigns = campaigns.filter((c) => isOpenCampaign(c.status));
  const featured = [...openCampaigns]
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, 8);
  const openCount = openCampaigns.length;
  const homeHref =
    signedIn
      ? role === "brand"
        ? "/brand"
        : role === "admin"
          ? "/admin"
          : "/dashboard"
      : "/auth";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-signal/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-ink-foreground/10 blur-3xl" />
        <Container className="relative py-12 md:py-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-signal">
            Nepal · Brand × creator collaborations
          </p>
          <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            CREATE.
            <br />
            CONNECT.
            <br />
            <span className="text-signal">GROW.</span>
          </h1>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink-foreground/75">
            Brands post opportunities. Creators apply. Brands select. Both collaborate—without
            middlemen holding your money.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/campaigns"
              className="tap inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-signal px-6 text-[15px] font-semibold text-signal-foreground hover:bg-signal/90"
            >
              Discover opportunities <ArrowRight className="size-4" />
            </Link>
            <Link
              to={signedIn ? homeHref : "/auth"}
              className="tap inline-flex h-12 items-center justify-center rounded-full border border-ink-foreground/25 bg-ink-foreground/5 px-6 text-[15px] font-semibold text-ink-foreground hover:bg-ink-foreground/10"
            >
              {signedIn ? "Go to my home" : "Join free"}
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-[13px] text-ink-foreground/70">
            <span>
              <strong className="text-ink-foreground">
                {loading && openCount === 0 ? "—" : openCount}
              </strong>{" "}
              open opportunities
            </span>
            <span>Structured applications</span>
            <span>No platform fees on payouts</span>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-b border-border bg-background">
        <Container className="py-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "1. Brands post",
                body: "Publish a clear brief: niche, deliverables, timeline, and what success looks like.",
              },
              {
                icon: Briefcase,
                title: "2. Creators apply",
                body: "Discover open opportunities and apply with a focused pitch—not endless cold DMs.",
              },
              {
                icon: Users,
                title: "3. Collaborate",
                body: "Select talent, message in-thread, and track delivery. Payments stay between you two.",
              },
            ].map((step) => (
              <div key={step.title} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <step.icon className="size-5 text-signal" aria-hidden />
                <h2 className="mt-3 text-[15px] font-bold tracking-tight">{step.title}</h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Public campaigns — horizontal scroll */}
      <section className="border-b border-border bg-background">
        <Container className="py-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-signal">
                Live on the platform
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">Open campaigns</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse real opportunities. Sign in only when you are ready to apply.
              </p>
            </div>
            <Link
              to="/campaigns"
              className="hidden shrink-0 text-sm font-semibold text-signal hover:underline sm:inline-flex"
            >
              View all →
            </Link>
          </div>

          {loading && featured.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading campaigns…</p>
          ) : featured.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
              <p className="font-semibold">No open campaigns yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Brands can publish the first brief in a few minutes.
              </p>
              <Link
                to="/auth"
                className="mt-4 inline-flex text-sm font-semibold text-signal hover:underline"
              >
                Sign in as brand →
              </Link>
            </div>
          ) : (
            <div className="-mx-4 mt-6 sm:-mx-0">
              <div
                className="flex gap-3 overflow-x-auto px-4 pb-2 sm:px-0 snap-x snap-mandatory scroll-smooth"
                style={{ WebkitOverflowScrolling: "touch" }}
                role="list"
                aria-label="Open campaigns"
              >
                {featured.map((c) => (
                  <div
                    key={c.id}
                    className="w-[min(85vw,20rem)] shrink-0 snap-start sm:w-[18.5rem]"
                    role="listitem"
                  >
                    <CampaignCard
                      campaign={c}
                      saved={signedIn ? saved.has(c.id) : undefined}
                      onToggleSave={signedIn ? toggleSaved : undefined}
                    />
                  </div>
                ))}
                <div className="flex w-[min(70vw,12rem)] shrink-0 snap-start items-center sm:w-40">
                  <Link
                    to="/campaigns"
                    className="tap flex h-full min-h-[10rem] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-4 text-center text-sm font-semibold text-signal"
                  >
                    View all
                    <span className="mt-1 text-xs font-normal text-muted-foreground">
                      {openCount} open
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <Link
            to="/campaigns"
            className="mt-4 inline-flex text-sm font-semibold text-signal hover:underline sm:hidden"
          >
            View all campaigns →
          </Link>
        </Container>
      </section>

      {/* Audiences */}
      <section className="border-b border-border bg-background">
        <Container className="py-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-bold tracking-tight">For creators</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Find brand opportunities across Nepal, apply with a clear pitch, and manage delivery
                from one home.
              </p>
              <Link
                to="/campaigns"
                className="mt-4 inline-flex text-sm font-semibold text-signal hover:underline"
              >
                Browse opportunities →
              </Link>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-bold tracking-tight">For brands</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Publish a brief, review applicants for your campaigns, and message selected
                talent—relationship-based, not a public creator directory.
              </p>
              <Link
                to="/auth"
                className="mt-4 inline-flex text-sm font-semibold text-signal hover:underline"
              >
                Sign in as brand →
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-background">
        <Container className="py-12 text-center">
          <h2 className="text-xl font-bold tracking-tight">Ready when you are</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Free to join. Sign in with Google or email—no password required. After sign-in, choose
            creator or brand and finish a short setup.
          </p>
          <Link
            to={signedIn ? homeHref : "/auth"}
            className="tap mt-6 inline-flex h-12 items-center justify-center rounded-full bg-ink px-7 text-[15px] font-semibold text-ink-foreground"
          >
            {signedIn ? "Continue" : "Join NepCollab"}
          </Link>
          <p className="mt-8 text-xs text-muted-foreground">
            <Link to="/help" className="underline underline-offset-2 hover:text-foreground">
              Help
            </Link>
            {" · "}
            <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
              Terms
            </Link>
            {" · "}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
              Privacy
            </Link>
          </p>
        </Container>
      </section>
    </div>
  );
}
