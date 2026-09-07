import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Sparkles, Users } from "lucide-react";
import { Container } from "@/components/AppShell";
import { fetchHomepageListings, type BusinessListing } from "@/lib/listings";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NepCollab — Businesses & creators, matched in Nepal" },
      {
        name: "description",
        content:
          "Businesses list on NepCollab. Creators register to get notified. Admin matches the right fit.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { signedIn, role } = useStore();
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setListings(await fetchHomepageListings());
      setLoading(false);
    })();
  }, []);

  const workspace =
    role === "admin" ? "/admin" : role === "brand" ? "/brand" : role === "creator" ? "/creator" : null;

  return (
    <div className="pb-14">
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-signal/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 size-56 rounded-full bg-signal/10 blur-3xl" />
        <Container className="relative py-14 sm:py-20">
          <p className="type-kicker text-ink-foreground/55">NepCollab · Nepal</p>
          <h1 className="mt-3 max-w-2xl font-display text-[2.4rem] font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Businesses list.
            <br />
            Creators get matched.
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-foreground/75">
            One platform for brands and creators. Businesses appear on this homepage after approval.
            Creators register once — when new businesses list, we notify you. Admin handles the match.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:max-w-md">
            <Link
              to="/list-business"
              className="tap inline-flex h-12 items-center justify-center gap-2 rounded-full bg-signal px-6 text-[15px] font-bold text-signal-foreground"
            >
              <Building2 className="size-4" /> I’m a business
            </Link>
            <Link
              to="/join-creator"
              className="tap inline-flex h-12 items-center justify-center gap-2 rounded-full border border-ink-foreground/30 bg-ink-foreground/5 px-6 text-[15px] font-bold"
            >
              <Users className="size-4" /> I’m a creator
            </Link>
          </div>
          {signedIn && workspace ? (
            <Link
              to={workspace}
              className="mt-4 inline-flex text-sm font-semibold text-signal underline-offset-4 hover:underline"
            >
              Go to your workspace →
            </Link>
          ) : (
            <Link
              to="/auth"
              className="mt-4 inline-flex text-sm font-semibold text-ink-foreground/70 underline-offset-4 hover:underline"
            >
              Already registered? Sign in
            </Link>
          )}
        </Container>
        <div className="valley-ridge-light mx-auto max-w-[6rem] pb-4" aria-hidden />
      </section>

      {/* Two paths */}
      <Container className="py-10">
        <p className="type-kicker text-signal">Choose your path</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Built for both sides</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-ink text-ink-foreground">
              <Building2 className="size-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold tracking-tight">For businesses</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                List your business — shown on the homepage after approval
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                Admin proposes best-fit creators
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                You select, close the deal, we notify the creator
              </li>
            </ul>
            <Link
              to="/for-brands"
              className="tap mt-5 inline-flex h-11 items-center gap-1 text-sm font-bold text-signal"
            >
              Learn more <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/list-business"
              className="tap mt-2 flex h-11 items-center justify-center rounded-full bg-ink text-sm font-bold text-ink-foreground"
            >
              List my business
            </Link>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-signal text-signal-foreground">
              <Users className="size-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold tracking-tight">For creators</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                Register once with your niche & platforms
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                When businesses list, we notify active creators
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                Admin matches you — no cold DMs required
              </li>
            </ul>
            <Link
              to="/for-creators"
              className="tap mt-5 inline-flex h-11 items-center gap-1 text-sm font-bold text-signal"
            >
              Learn more <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/join-creator"
              className="tap mt-2 flex h-11 items-center justify-center rounded-full border border-border text-sm font-bold"
            >
              Register as creator
            </Link>
          </div>
        </div>
      </Container>

      {/* Listed businesses */}
      <Container className="pb-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="type-kicker text-signal">On the platform</p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Listed businesses</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Approved brands appear here. Creators: new listings trigger notifications.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : listings.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <Sparkles className="mx-auto size-7 text-muted-foreground/50" />
            <p className="mt-3 font-display text-lg font-bold">First listings coming soon</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Be among the first businesses on the homepage — or register as a creator to get notified.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to="/list-business"
                className="tap inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold text-ink-foreground"
              >
                List a business
              </Link>
              <Link
                to="/join-creator"
                className="tap inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-bold"
              >
                Join as creator
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {listings.map((b) => (
              <li key={b.id} className="rounded-3xl border border-border bg-card p-5">
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

      {/* How it works */}
      <Container className="py-10">
        <p className="type-kicker text-signal">How it works</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Simple for everyone</h2>
        <ol className="mt-6 space-y-3">
          {[
            {
              n: "1",
              t: "Business lists",
              b: "Submit a short profile. After admin approval, you’re on the homepage.",
            },
            {
              n: "2",
              t: "Creators are notified",
              b: "Active creators get an alert about the new business on their workspace.",
            },
            {
              n: "3",
              t: "Admin matches",
              b: "We propose best-fit creators. Brand selects. We notify the creator and close the loop.",
            },
          ].map((s) => (
            <li key={s.n} className="flex gap-4 rounded-3xl border border-border bg-card p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-ink-foreground">
                {s.n}
              </span>
              <div>
                <p className="font-display text-base font-bold tracking-tight">{s.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.b}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>

      <Container className="pb-6">
        <div className="rounded-3xl border border-border bg-secondary/40 p-6 text-center sm:p-8">
          <h2 className="font-display text-xl font-bold tracking-tight">Ready when you are</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Free to join. Sign in with Google after you register — workspaces require login.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/list-business"
              className="tap inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold text-ink-foreground"
            >
              List business
            </Link>
            <Link
              to="/join-creator"
              className="tap inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-bold"
            >
              Join as creator
            </Link>
            <Link
              to="/auth"
              className="tap inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-signal"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-[12px] text-muted-foreground">
            <Link to="/how-it-works" className="hover:underline">
              How it works
            </Link>
            {" · "}
            <Link to="/privacy" className="hover:underline">
              Privacy
            </Link>
            {" · "}
            <Link to="/terms" className="hover:underline">
              Terms
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
