import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container, SectionHeader } from "@/components/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NepCollab — Create. Connect. Grow." },
      {
        name: "description",
        content:
          "Discover collaborations, work with brands and build your creator journey. NepCollab is Nepal's creator × brand marketplace.",
      },
      { property: "og:title", content: "NepCollab — Create. Connect. Grow." },
      {
        property: "og:description",
        content:
          "Discover collaborations. Work with brands. Build your creator journey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { campaigns, saved, toggleSaved } = useStore();
  const openCampaigns = campaigns.filter(
    (c) => c.status === "APPLICATIONS_OPEN" || c.status === "PUBLISHED",
  );
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
          <h1 className="text-[34px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            CREATE.
            <br />
            CONNECT.
            <br />
            <span className="text-signal">GROW.</span>
          </h1>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink-foreground/75">
            Nepal&apos;s marketplace for creators and brands. Find real campaigns,
            apply in minutes, and collaborate without middlemen.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/campaigns"
              className="tap inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-signal px-6 text-[15px] font-semibold text-signal-foreground hover:bg-signal/90"
            >
              Explore collaborations <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/auth"
              className="tap inline-flex h-12 items-center justify-center rounded-full border border-ink-foreground/25 px-6 text-[15px] font-semibold text-ink-foreground hover:bg-ink-foreground/10"
            >
              I'm a brand
            </Link>
          </div>

          <p className="mt-7 text-[12px] text-ink-foreground/55">
            {openCount > 0
              ? `${openCount} open campaign${openCount === 1 ? "" : "s"}`
              : "New collaborations weekly"}{" "}
            · Connect directly · 0% platform fee
          </p>
        </Container>
      </section>

      <Container className="pt-7">
        <SectionHeader
          title="Open opportunities"
          actionLabel="See all"
          actionTo="/campaigns"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              saved={saved.includes(c.id)}
              onToggleSave={toggleSaved}
            />
          ))}
        </div>
      </Container>

      <Container className="pt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["1. Discover", "Browse open campaigns from real brands in Nepal."],
            ["2. Apply", "Send your pitch in a few minutes — no long forms."],
            ["3. Collaborate", "Get selected, deliver work, and build your reputation."],
          ].map(([title, body]) => (
            <div
              key={title}
              className="rounded-3xl border border-border bg-card p-4"
            >
              <p className="text-[14px] font-bold tracking-tight">{title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </Container>

      <section className="mt-10 border-t border-border bg-secondary/40">
        <Container className="py-8 text-center text-[12.5px] text-muted-foreground">
          <Logo withWordmark={false} size={30} className="justify-center" />
          <p className="mt-2 font-semibold text-foreground">
            NepCollab does not process payments.
          </p>
          <p className="mt-1">
            Perks, gifts and compensation are arranged directly between brand
            and creator.
          </p>
          <Link
            to="/auth"
            className="tap mt-5 inline-flex h-11 items-center rounded-full bg-ink px-6 text-[14px] font-semibold text-ink-foreground hover:opacity-90"
          >
            Join NepCollab
          </Link>
        </Container>
      </section>
    </div>
  );
}
