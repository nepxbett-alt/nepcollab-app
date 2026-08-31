import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Compass,
  Handshake,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import { Container } from "@/components/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import { daysLeft, getBrand } from "@/lib/lookup";
import type { Campaign } from "@/data/types";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NepCollab — Create. Connect. Grow." },
      {
        name: "description",
        content:
          "Nepal's premier collaboration marketplace. Brands post opportunities. Creators apply. Brands select. Both collaborate.",
      },
      { property: "og:title", content: "NepCollab — Create. Connect. Grow." },
      {
        property: "og:description",
        content:
          "Nepal's premier collaboration marketplace. Brands post opportunities. Creators apply. Brands select. Both collaborate.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nepcollab.vercel.app" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function isOpenStatus(status: string) {
  const s = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  return s === "applications_open" || s === "published" || s === "active" || s === "open";
}

/** Homepage only: open, not expired, and not obvious test/junk rows. */
function isHomeFeedCampaign(c: Campaign) {
  if (!isOpenStatus(c.status)) return false;
  const left = daysLeft(c.deadline);
  if (!Number.isFinite(left) || left < 0) return false;

  const title = String(c.title || "").trim();
  const desc = String(c.description || "").trim();
  if (title.length < 6) return false;
  if (desc.length < 24) return false;

  const brand = getBrand(c.brandId);
  const brandName = String(brand?.name || "").trim().toLowerCase();
  const junkBrand =
    !brandName ||
    brandName === "xxx" ||
    brandName === "test" ||
    brandName.startsWith("test ") ||
    /^[a-z]{1,4}$/.test(brandName);
  const junkTitle = /^(test|xxx|fhii|asdf|qwer|demo)\b/i.test(title);
  if (junkBrand || junkTitle) return false;

  return true;
}

type Step = { icon: typeof Sparkles; title: string; body: string };

function Home() {
  const { campaigns, saved, toggleSaved, loading, signedIn, role } = useStore();

  const openCampaigns = campaigns
    .filter(isHomeFeedCampaign)
    .sort((a, b) => {
      const feat = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      if (feat !== 0) return feat;
      // Soonest deadline first among the rest
      return daysLeft(a.deadline) - daysLeft(b.deadline);
    });

  const feed = openCampaigns.slice(0, 9);

  const homeHref = signedIn
    ? role === "brand"
      ? "/brand"
      : role === "admin"
        ? "/admin"
        : "/dashboard"
    : "/auth";

  const isBrand = signedIn && role === "brand";
  const isCreator = signedIn && (role === "creator" || role === null);

  const steps: Step[] = isBrand
    ? [
        {
          icon: Sparkles,
          title: "1. Publish a campaign",
          body: "Describe the brief, deliverables, timeline, and what success looks like for your brand.",
        },
        {
          icon: Users,
          title: "2. Review applicants",
          body: "Creators apply with a focused pitch. Shortlist and select the right fit for this opportunity.",
        },
        {
          icon: Handshake,
          title: "3. Collaborate",
          body: "Message in-thread, track delivery, and finish the collaboration in one place.",
        },
      ]
    : isCreator
      ? [
          {
            icon: Compass,
            title: "1. Discover campaigns",
            body: "Browse open opportunities across Nepal by niche, city, and platform.",
          },
          {
            icon: Briefcase,
            title: "2. Apply with a pitch",
            body: "Send one clear application—your profile is attached automatically.",
          },
          {
            icon: MessageCircle,
            title: "3. Deliver together",
            body: "If selected, message the brand, submit work, and complete the collab.",
          },
        ]
      : [
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
            body: "Select talent, message in-thread, and track delivery until the work is done.",
          },
        ];

  const stepsLabel = isBrand
    ? "How brands use NepCollab"
    : isCreator
      ? "How creators use NepCollab"
      : "How it works";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-signal/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-ink-foreground/10 blur-3xl" />
        <Container className="relative py-14 md:py-20">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-signal">
            Nepal&apos;s premier collaboration marketplace
          </p>
          <h1 className="mt-4 max-w-xl text-[36px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[3.25rem]">
            CREATE.
            <br />
            CONNECT.
            <br />
            <span className="text-signal">GROW.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-foreground/78">
            Brands post opportunities. Creators apply. Brands select. Both collaborate.
          </p>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {isBrand ? (
              <>
                <Link
                  to="/brand/campaigns/new"
                  className="tap inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-signal px-6 text-[15px] font-semibold text-signal-foreground hover:bg-signal/90"
                >
                  Create campaign <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/brand/applicants"
                  className="tap inline-flex h-12 items-center justify-center rounded-full border border-ink-foreground/25 bg-ink-foreground/5 px-6 text-[15px] font-semibold text-ink-foreground hover:bg-ink-foreground/10"
                >
                  View applicants
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <p className="mt-8 text-[13px] text-ink-foreground/60">
            Structured applications · Clear collaboration · Built for Nepal
          </p>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-b border-border bg-background">
        <Container className="py-11">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-signal">
            {stepsLabel}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm"
              >
                <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                  0{i + 1}
                </span>
                <step.icon className="mt-3 size-5 text-signal" aria-hidden />
                <h2 className="mt-2.5 text-[15px] font-bold tracking-tight">{step.title}</h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Open campaigns */}
      <section className="border-b border-border bg-background">
        <Container className="py-11">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-signal">
                Live on the platform
              </p>
              <h2 className="mt-1.5 text-xl font-bold tracking-tight">Open campaigns</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {isBrand
                  ? "See active opportunities — or publish your own brief."
                  : "Browse real opportunities. Sign in when you are ready to apply."}
              </p>
            </div>
            <Link
              to="/campaigns"
              className="tap inline-flex h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary"
            >
              View all
            </Link>
          </div>

          {loading && feed.length === 0 ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-3xl border border-border bg-muted/35"
                />
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="mt-7 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
              <p className="text-base font-semibold">No open campaigns right now</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                New briefs appear here when brands publish. Check back soon, or create one if you are
                a brand.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link
                  to="/campaigns"
                  className="tap inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-semibold"
                >
                  Browse all
                </Link>
                <Link
                  to={isBrand ? "/brand/campaigns/new" : "/auth"}
                  className="tap inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-ink-foreground"
                >
                  {isBrand ? "Create a campaign" : "Sign in as brand"}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="-mx-4 mt-7 sm:hidden">
                <div
                  className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scroll-smooth"
                  style={{ WebkitOverflowScrolling: "touch" }}
                  role="list"
                  aria-label="Open campaigns"
                >
                  {feed.map((c) => (
                    <div
                      key={c.id}
                      className="w-[min(86vw,20.5rem)] shrink-0 snap-start"
                      role="listitem"
                    >
                      <CampaignCard
                        campaign={c}
                        saved={signedIn ? saved.includes(c.id) : undefined}
                        onToggleSave={signedIn ? toggleSaved : undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-7 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                {feed.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    saved={signedIn ? saved.includes(c.id) : undefined}
                    onToggleSave={signedIn ? toggleSaved : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </Container>
      </section>

      {/* Creators / brands */}
      <section className="border-b border-border bg-background">
        <Container className="py-11">
          <div className="grid gap-4 md:grid-cols-2">
            <div
              className={`rounded-3xl border bg-card p-6 shadow-sm ${
                isCreator ? "border-signal/35 ring-1 ring-signal/15" : "border-border"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-signal">
                Creators
              </p>
              <h2 className="mt-1.5 text-lg font-bold tracking-tight">Find work that fits</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Discover brand opportunities across Nepal, apply with one clear pitch, and manage
                delivery from a single home.
              </p>
              <ul className="mt-4 space-y-2 text-[13px] text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-signal">·</span> Discover open campaigns
                </li>
                <li className="flex gap-2">
                  <span className="text-signal">·</span> Apply once — profile attached
                </li>
                <li className="flex gap-2">
                  <span className="text-signal">·</span> Track applications & collaborations
                </li>
              </ul>
              <Link
                to={signedIn ? "/campaigns" : "/auth"}
                className="tap mt-5 inline-flex h-11 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-semibold text-ink-foreground"
              >
                {isCreator ? "Browse campaigns" : "Join as creator"}
                <ArrowRight className="size-4 opacity-80" />
              </Link>
            </div>

            <div
              className={`rounded-3xl border bg-card p-6 shadow-sm ${
                isBrand ? "border-signal/35 ring-1 ring-signal/15" : "border-border"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-signal">
                Brands
              </p>
              <h2 className="mt-1.5 text-lg font-bold tracking-tight">Hire through campaigns</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Publish a brief, review applicants for your campaigns, and message selected
                talent—relationship-based, not a public creator directory.
              </p>
              <ul className="mt-4 space-y-2 text-[13px] text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-signal">·</span> Publish clear campaign briefs
                </li>
                <li className="flex gap-2">
                  <span className="text-signal">·</span> Review & select applicants
                </li>
                <li className="flex gap-2">
                  <span className="text-signal">·</span> Collaborate in-thread
                </li>
              </ul>
              <Link
                to={isBrand ? "/brand/campaigns/new" : "/auth"}
                className="tap mt-5 inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-background px-5 text-sm font-semibold hover:bg-secondary"
              >
                {isBrand ? "Create a campaign" : "Sign in as brand"}
                <ArrowRight className="size-4 opacity-80" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-background">
        <Container className="py-14 text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Ready when you are</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Free to join. Sign in with Google or email—no password required. After sign-in, choose
            creator or brand and finish a short setup.
          </p>
          <Link
            to={signedIn ? homeHref : "/auth"}
            className="tap mt-7 inline-flex h-12 items-center justify-center rounded-full bg-signal px-8 text-[15px] font-semibold text-signal-foreground hover:bg-signal/90"
          >
            {signedIn ? "Continue" : "Join NepCollab"}
          </Link>
          <p className="mt-9 text-xs text-muted-foreground">
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
