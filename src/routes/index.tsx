import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, Sparkles, Users } from "lucide-react";
import { Container, SectionHeader } from "@/components/AppShell";
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
  const s = String(status || "").toLowerCase();
  return (
    s === "applications_open" ||
    s === "published" ||
    s === "active" ||
    s === "open"
  );
}

function Home() {
  const { campaigns, saved, toggleSaved, loading } = useStore();
  const openCampaigns = campaigns.filter((c) => isOpenCampaign(c.status));
  const featured = [...openCampaigns]
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, 3);
  const openCount = openCampaigns.length;

  return (
    <div>
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
            Brands post opportunities. Creators apply. Brands select. Both collaborate—without middlemen holding your money.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/campaigns"
              className="tap inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-signal px-6 text-[15px] font-semibold text-signal-foreground hover:bg-signal/90"
            >
              Discover opportunities <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/auth"
              className="tap inline-flex h-12 items-center justify-center rounded-full border border-ink-foreground/25 bg-ink-foreground/5 px-6 text-[15px] font-semibold text-ink-foreground hover:bg-ink-foreground/10"
            >
              Join free
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

      <section className="border-b border-border bg-background">
        <Container className="py-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-bold tracking-tight">For creators</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Find brand opportunities across Nepal, apply with a clear pitch, and manage delivery from one home.
              </p>
              <Link to="/campaigns" className="mt-4 inline-flex text-sm font-semibold text-signal hover:underline">
                Browse opportunities →
              </Link>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-bold tracking-tight">For brands</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Publish a brief, review applicants for your campaigns, and message selected talent—relationship-based, not a public creator directory.
              </p>
              <Link
                to="/auth"
                search={{ as: "brand" }}
                className="mt-4 inline-flex text-sm font-semibold text-signal hover:underline"
              >
                Sign in as brand →
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {featured.length > 0 ? (
        <section className="py-10">
          <Container>
            <SectionHeader title="Featured opportunities" actionLabel="View all" actionTo="/campaigns" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((c) => (
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

      <section className="border-t border-border py-12">
        <Container className="text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Ready when you are</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Free to join. Sign in with Google or email—no password required.
          </p>
          <Link
            to="/auth"
            className="tap mt-5 inline-flex h-11 items-center rounded-full bg-ink px-6 text-[14px] font-semibold text-ink-foreground hover:opacity-90"
          >
            Join NepCollab
          </Link>
          <p className="mt-4 text-[11px] text-muted-foreground">
            <Link to="/help" className="underline">
              Help
            </Link>
            {" · "}
            <Link to="/terms" className="underline">
              Terms
            </Link>
            {" · "}
            <Link to="/privacy" className="underline">
              Privacy
            </Link>
          </p>
        </Container>
      </section>
    </div>
  );
}
