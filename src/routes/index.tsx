import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Gift, Sparkles, Users } from "lucide-react";
import { Container } from "@/components/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import { daysLeft, getBrand } from "@/lib/lookup";
import type { Campaign } from "@/data/types";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NepCollab — Free products. Real content." },
      {
        name: "description",
        content:
          "Creators get free products. Brands get promotion. Claim deals across Nepal.",
      },
      { property: "og:title", content: "NepCollab — Free products. Real content." },
      {
        property: "og:description",
        content: "Creators get free products. Brands get promotion.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nepcollab.vercel.app" },
    ],
  }),
  component: Home,
});

function isOpenStatus(status: string) {
  const s = String(status || "").toLowerCase().replace(/\s+/g, "_");
  return s === "applications_open" || s === "published" || s === "active" || s === "open";
}

function isHomeFeedCampaign(c: Campaign) {
  if (!isOpenStatus(c.status)) return false;
  const left = daysLeft(c.deadline);
  if (!Number.isFinite(left) || left < 0) return false;
  const title = String(c.title || "").trim();
  const desc = String(c.description || "").trim();
  if (title.length < 6) return false;
  if (desc.length < 12) return false;
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

function Home() {
  const { campaigns, saved, toggleSaved, loading, signedIn, role, applications } = useStore();

  const openCampaigns = campaigns.filter(isHomeFeedCampaign);
  const featured = openCampaigns.filter((c) => c.featured);
  const feed = (featured.length ? featured : openCampaigns).slice(0, 8);

  // Real social proof only
  const claimCount = applications?.length ?? 0;
  const socialProof =
    claimCount >= 5
      ? `🔥 ${claimCount} claims on the platform`
      : "🔥 Creators are discovering new deals every week.";

  const creatorHref = signedIn
    ? role === "brand"
      ? "/brand"
      : role === "admin"
        ? "/admin"
        : "/campaigns"
    : "/auth?intent=creator";
  const brandHref = signedIn
    ? role === "brand"
      ? "/brand"
      : role === "creator"
        ? "/campaigns"
        : "/auth?intent=brand"
    : "/auth?intent=brand";

  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="pointer-events-none absolute -right-20 -top-16 size-56 rounded-full bg-signal/20 blur-3xl" />
        <Container className="relative py-12 sm:py-16">
          <p className="type-kicker text-ink-foreground/55">NepCollab · Nepal</p>
          <h1 className="mt-3 font-display text-[2.35rem] font-bold leading-[1.05] tracking-tight sm:text-5xl">
            FREE PRODUCTS.
            <br />
            <span className="text-signal">REAL CONTENT.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-foreground/75">
            Brands give creators free products in exchange for simple social content.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to={creatorHref.startsWith("/auth") ? "/auth" : creatorHref}
              search={creatorHref.includes("intent=creator") ? { intent: "creator" } : undefined}
              className="tap inline-flex h-12 items-center justify-center rounded-full bg-signal px-7 text-[15px] font-bold text-signal-foreground shadow-lg"
            >
              I&apos;M A CREATOR
            </Link>
            <Link
              to={brandHref.startsWith("/auth") ? "/auth" : brandHref}
              search={brandHref.includes("intent=brand") ? { intent: "brand" } : undefined}
              className="tap inline-flex h-12 items-center justify-center rounded-full border border-ink-foreground/25 bg-ink-foreground/5 px-7 text-[15px] font-semibold text-ink-foreground"
            >
              I&apos;M A BRAND
            </Link>
          </div>
          <p className="mt-5 text-[13px] text-ink-foreground/50">{socialProof}</p>
        </Container>
        <div className="valley-ridge-light mx-auto max-w-[6rem] pb-4" aria-hidden />
      </section>

      {/* How it works */}
      <Container className="py-10">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="type-kicker text-signal">For creators</p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight">Three steps</h2>
            <ol className="mt-4 space-y-3 text-[14px] text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-display font-bold text-foreground">1</span>
                <span><strong className="text-foreground">Find a deal</strong> — free products from brands.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-display font-bold text-foreground">2</span>
                <span><strong className="text-foreground">Claim it</strong> — one tap to request the product.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-display font-bold text-foreground">3</span>
                <span><strong className="text-foreground">Get it &amp; post</strong> — receive the product, create content.</span>
              </li>
            </ol>
          </div>
          <div>
            <p className="type-kicker text-signal">For brands</p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight">Three steps</h2>
            <ol className="mt-4 space-y-3 text-[14px] text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-display font-bold text-foreground">1</span>
                <span><strong className="text-foreground">Post a deal</strong> — what you&apos;re offering.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-display font-bold text-foreground">2</span>
                <span><strong className="text-foreground">Approve creators</strong> — choose who gets the product.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-display font-bold text-foreground">3</span>
                <span><strong className="text-foreground">Get content</strong> — creators post about your product.</span>
              </li>
            </ol>
          </div>
        </div>
      </Container>

      {/* Live deals */}
      <Container className="pb-12">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="type-kicker text-muted-foreground">Live on the platform</p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight">Open deals</h2>
          </div>
          <Link
            to="/campaigns"
            className="tap inline-flex items-center gap-1 text-sm font-semibold text-signal"
          >
            View all <ArrowRight className="size-4" />
          </Link>
        </div>

        {loading && feed.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading deals…</p>
        ) : feed.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <Gift className="mx-auto size-8 text-signal" />
            <p className="mt-3 text-sm font-medium">New products are coming soon.</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Check back for free product deals.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {feed.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                saved={saved.includes(c.id)}
                onToggleSave={() => void toggleSaved(c.id)}
              />
            ))}
          </div>
        )}
      </Container>

      {/* CTA */}
      <section className="border-t border-border bg-secondary/40">
        <Container className="py-10 text-center">
          <Sparkles className="mx-auto size-6 text-signal" />
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Ready when you are</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Free to join. Sign in with Google or email — then choose creator or brand.
          </p>
          <Link
            to="/auth"
            className="tap mt-6 inline-flex h-12 items-center justify-center rounded-full bg-ink px-8 text-[15px] font-bold text-ink-foreground"
          >
            Join NepCollab
          </Link>
          <p className="mt-6 text-[12px] text-muted-foreground">
            <Link to="/help" className="underline-offset-2 hover:underline">Help</Link>
            {" · "}
            <Link to="/terms" className="underline-offset-2 hover:underline">Terms</Link>
            {" · "}
            <Link to="/privacy" className="underline-offset-2 hover:underline">Privacy</Link>
          </p>
        </Container>
      </section>
    </div>
  );
}
