import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Sparkles } from "lucide-react";
import { Container } from "@/components/AppShell";
import { fetchHomepageListings, type BusinessListing } from "@/lib/listings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NepCollab — Connect businesses with the right creators" },
      {
        name: "description",
        content:
          "List your business on NepCollab. We match you with the right creators for campaigns and content in Nepal.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setListings(await fetchHomepageListings());
      setLoading(false);
    })();
  }, []);

  return (
    <div className="pb-12">
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-signal/25 blur-3xl" />
        <Container className="relative py-14 sm:py-18">
          <p className="type-kicker text-ink-foreground/55">NepCollab · Nepal</p>
          <h1 className="mt-3 max-w-xl font-display text-[2.35rem] font-bold leading-[1.05] tracking-tight sm:text-5xl">
            List your business.{" "}
            <span className="text-signal">Get matched</span> with the right creators.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-foreground/75">
            When you list with NepCollab, your business can appear on this homepage.
            Our admin team assigns the best-fit influencers — you review and close the deal.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/list-business"
              className="tap inline-flex h-12 items-center justify-center rounded-full bg-signal px-7 text-[15px] font-bold text-signal-foreground"
            >
              List my business
            </Link>
            <Link
              to="/for-brands"
              className="tap inline-flex h-12 items-center justify-center rounded-full border border-ink-foreground/25 px-7 text-[15px] font-semibold"
            >
              Why list with us
            </Link>
          </div>
        </Container>
        <div className="valley-ridge-light mx-auto max-w-[6rem] pb-4" aria-hidden />
      </section>

      <Container className="py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="type-kicker text-signal">On NepCollab</p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Listed businesses</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Approved listings appear here for creators and partners to discover.
            </p>
          </div>
          <Link to="/list-business" className="hidden text-sm font-semibold text-signal sm:inline">
            List yours →
          </Link>
        </div>

        {loading ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">Loading businesses…</p>
        ) : listings.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <Building2 className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-3 font-display text-lg font-bold">Be the first on the homepage</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              List your business now. After a quick admin review, you’ll be shown here.
            </p>
            <Link
              to="/list-business"
              className="tap mt-5 inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold text-ink-foreground"
            >
              List my business
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {listings.map((b) => (
              <li
                key={b.id}
                className="rounded-3xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold tracking-tight">
                      {b.business_name}
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {[b.category, b.location].filter(Boolean).join(" · ") || "Nepal"}
                    </p>
                  </div>
                  {b.featured ? (
                    <span className="shrink-0 rounded-full bg-signal/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-signal">
                      Featured
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {b.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Container>

      <Container className="pb-4">
        <div className="rounded-3xl border border-border bg-secondary/40 p-6 sm:p-8">
          <Sparkles className="size-6 text-signal" />
          <h2 className="mt-3 font-display text-xl font-bold tracking-tight">How it works</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              <span>
                <strong className="text-foreground">You list</strong> — submit your business. We review and
                put you on the homepage.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              <span>
                <strong className="text-foreground">Admin matches</strong> — we assign best-fit influencers
                to your deal.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              <span>
                <strong className="text-foreground">You select & close</strong> — pick a match, close with
                admin; we notify the creator.
              </span>
            </li>
          </ol>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              to="/list-business"
              className="tap inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-ink-foreground"
            >
              List my business <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/auth"
              search={{ next: "/brand" } as any}
              className="tap inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold"
            >
              Business login
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
