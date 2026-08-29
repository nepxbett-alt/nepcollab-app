import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, CheckCircle2, Compass, Handshake, Sparkles, User } from "lucide-react";
import { Container } from "@/components/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help — NepCollab" },
      {
        name: "description",
        content:
          "First-time guide for NepCollab. How creators apply to campaigns and how brands publish opportunities in Nepal.",
      },
    ],
  }),
  component: HelpPage,
});

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-ink-foreground">
        {n}
      </span>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

function HelpPage() {
  const { signedIn, role } = useStore();
  const nextHref =
    !signedIn
      ? "/auth"
      : role === "brand"
        ? "/brand"
        : role === "admin"
          ? "/admin"
          : "/dashboard";

  return (
    <Container className="max-w-2xl py-8 sm:py-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-signal">
        First-time guide
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">How NepCollab works</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Brands post collaboration opportunities. Creators apply. Brands select. Both work together
        in one place—without NepCollab holding money.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          to="/auth"
          search={{ as: "creator", next: undefined }}
          className="tap flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-signal/30"
        >
          <User className="mt-0.5 size-5 shrink-0 text-signal" />
          <div>
            <p className="font-semibold">I am a creator</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Find campaigns and apply with your profile
            </p>
          </div>
        </Link>
        <Link
          to="/auth"
          search={{ as: "brand", next: undefined }}
          className="tap flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-signal/30"
        >
          <Briefcase className="mt-0.5 size-5 shrink-0 text-signal" />
          <div>
            <p className="font-semibold">I am a brand</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Publish a campaign and review applicants
            </p>
          </div>
        </Link>
      </div>

      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-signal" />
          <h2 className="text-lg font-bold tracking-tight">Creator path</h2>
        </div>
        <ol className="mt-4 space-y-4">
          <Step
            n="1"
            title="Sign in as creator"
            body="Choose Creator on the sign-in page, then continue with Google or an email magic link."
          />
          <Step
            n="2"
            title="Finish your profile"
            body="Add your name, location, and a short bio. Later you can connect Instagram, TikTok, YouTube, or Facebook."
          />
          <Step
            n="3"
            title="Discover campaigns"
            body="Open Discover to browse open opportunities by niche, city, and platform."
          />
          <Step
            n="4"
            title="Apply once with a clear pitch"
            body="Tell the brand your idea and availability. Your profile is attached automatically—no need to retype everything."
          />
          <Step
            n="5"
            title="Track status, then collaborate"
            body="Watch Applications for updates. If selected, use Collaborations and Messages to deliver the work."
          />
        </ol>
        <Link
          to="/campaigns"
          className="tap mt-5 inline-flex h-11 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-semibold text-ink-foreground"
        >
          Browse campaigns
          <ArrowRight className="size-4" />
        </Link>
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-2">
          <Handshake className="size-4 text-signal" />
          <h2 className="text-lg font-bold tracking-tight">Brand path</h2>
        </div>
        <ol className="mt-4 space-y-4">
          <Step
            n="1"
            title="Sign in as brand"
            body="Choose Brand on the sign-in page so your workspace is set up correctly from the start."
          />
          <Step
            n="2"
            title="Publish a campaign"
            body="Describe the collaboration, deliverables, location, and non-cash perks or benefits. Creators apply to this brief—not a public talent marketplace."
          />
          <Step
            n="3"
            title="Review applicants"
            body="Open Applicants to see pitches and profile details for people who applied to your campaigns only."
          />
          <Step
            n="4"
            title="Select and collaborate"
            body="Shortlist, select, then message and track deliverables until the work is done."
          />
        </ol>
        <Link
          to={signedIn && role === "brand" ? "/brand/campaigns/new" : "/auth"}
          {...(signedIn && role === "brand"
            ? {}
            : { search: { as: "brand" as const, next: undefined } })}
          className="tap mt-5 inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-5 text-sm font-semibold hover:bg-secondary"
        >
          {signedIn && role === "brand" ? "Create a campaign" : "Sign in as brand"}
          <ArrowRight className="size-4" />
        </Link>
      </section>

      <section className="mt-12 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-signal" />
          <h2 className="font-bold">What NepCollab is not</h2>
        </div>
        <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-signal" />
            We never hold your money or run a wallet.
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-signal" />
            Creators are not listed in a public directory for cold outreach.
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-signal" />
            Fee or barter is agreed directly between brand and creator.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-5 text-sm">
        <div>
          <h2 className="font-semibold">Sign in</h2>
          <p className="mt-1 text-muted-foreground">
            Use{" "}
            <Link to="/auth" className="text-signal underline underline-offset-2">
              Google or email magic link
            </Link>
            . Check spam for the email. You can also enter the 6-digit code from the message.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Payments</h2>
          <p className="mt-1 text-muted-foreground">
            Agree fee or barter in messages (bank transfer, eSewa, Khalti, etc.). NepCollab does not
            process payments.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Safety & account help</h2>
          <p className="mt-1 text-muted-foreground">
            Email{" "}
            <a className="text-signal underline underline-offset-2" href="mailto:nepcoollab@gmail.com">
              nepcoollab@gmail.com
            </a>{" "}
            for account or safety issues.
          </p>
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-2 sm:flex-row">
        <Link
          to={nextHref as "/"}
          className="tap inline-flex h-11 items-center justify-center rounded-full bg-signal px-5 text-sm font-semibold text-signal-foreground"
        >
          {signedIn ? "Back to my home" : "Get started"}
        </Link>
        <Link
          to="/campaigns"
          className="tap inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
        >
          View open campaigns
        </Link>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        <Link to="/terms" className="underline underline-offset-2">
          Terms
        </Link>
        {" · "}
        <Link to="/privacy" className="underline underline-offset-2">
          Privacy
        </Link>
      </p>
    </Container>
  );
}
