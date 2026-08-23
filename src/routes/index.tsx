import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, Sparkles, Users } from "lucide-react";
import { Container, SectionHeader } from "@/components/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import { formatFollowers, listCreators, totalFollowers } from "@/lib/lookup";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NepCollab — Create. Connect. Grow." },
      {
        name: "description",
        content:
          "Nepal's creator × brand marketplace. Discover campaigns, apply in minutes, collaborate without middlemen.",
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
    s.toLowerCase() === "active"
  );
}

function Home() {
  const { campaigns, saved, toggleSaved, loading } = useStore();
  const openCampaigns = campaigns.filter((c) => isOpenCampaign(c.status));
  const featured = [...openCampaigns]
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, 3);
  const openCount = openCampaigns.length;
  const topCreators = listCreators()
    .slice()
    .sort((a, b) => totalFollowers(b.id) - totalFollowers(a.id))
    .slice(0, 4);

  return (
    <div>
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-signal/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-ink-foreground/10 blur-3xl" />
        <Container className="relative py-12 md:py-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-signal">
            Nepal · Creator marketplace
          </p>
          <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            CREATE.
            <br />
            CONNECT.
            <br />
            <span className="text-signal">GROW.</span>
          </h1>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink-foreground/75">
            Find real brand campaigns, apply in minutes, and manage collaborations in one place—without middlemen holding your money.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/campaigns"
              className="tap inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-signal px-6 text-[15px] font-semibold text-signal-foreground hover:bg-signal/90"
            >
              Discover campaigns <ArrowRight className="size-4" />
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
              <strong className="text-ink-foreground">{loading && openCount === 0 ? "—" : openCount}</strong> open campaigns
            </span>
            <span>
              <strong className="text-ink-foreground">{topCreators.length || "—"}</strong> creators to explore
            </span>
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
                title: "1. Discover",
                body: "Browse campaigns by niche, city, and platform—or find creators to work with.",
              },
              {
                icon: Briefcase,
                title: "2. Apply or publish",
                body: "Creators pitch in minutes. Brands post briefs and review applicants in one queue.",
              },
              {
                icon: Users,
                title: "3. Collaborate",
                body: "Track status, message, and deliver. Payments stay between you two.",
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
                Find brand campaigns across Nepal, apply with a clear pitch, and manage delivery from one home.
              </p>
              <Link to="/campaigns" className="mt-4 inline-flex text-sm font-semibold text-signal hover:underline">
                Browse campaigns →
              </Link>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-bold tracking-tight">For brands</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Publish a brief, review applicants, and message talent. Explore the creator directory anytime.
              </p>
              <div className="mt-4 flex flex-col gap-1">
                <Link to="/auth" search={{ as: "brand" }} className="inline-flex text-sm font-semibold text-signal hover:underline">
                  Sign in as brand →
                </Link>
                <Link to="/creators" className="inline-flex text-sm text-muted-foreground hover:underline">
                  Browse creators
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {featured.length > 0 ? (
        <section className="py-10">
          <Container>
            <SectionHeader
              title="Featured campaigns"
              actionLabel="View all"
              actionTo="/campaigns"
            />
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

      {topCreators.length > 0 ? (
        <section className="border-t border-border bg-secondary/30 py-10">
          <Container>
            <SectionHeader title="Creators to watch" actionLabel="Directory" actionTo="/creators" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {topCreators.map((c) => (
                <Link
                  key={c.id}
                  to="/creators/$creatorId"
                  params={{ creatorId: c.id }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-foreground/20"
                >
                  <img
                    src={c.avatar}
                    alt=""
                    className="size-12 rounded-full object-cover bg-muted"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {c.location || "Nepal"} · {formatFollowers(totalFollowers(c.id))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="border-t border-border py-12">
        <Container className="text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Ready when you are</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Free to join. Sign in with email—no password to remember.
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
            {" · "}
            <Link to="/creators" className="underline">
              Creators
            </Link>
          </p>
        </Container>
      </section>
    </div>
  );
}
