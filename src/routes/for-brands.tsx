import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Container, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/for-brands")({
  head: () => ({
    meta: [
      { title: "For businesses — NepCollab" },
      {
        name: "description",
        content: "List on NepCollab and get shown on the homepage. Admin-matched creators.",
      },
    ],
  }),
  component: ForBrands,
});

function ForBrands() {
  return (
    <Container className="max-w-lg py-8">
      <PageHeader
        title="For businesses"
        subtitle="List once. Get matched. Close with confidence."
      />
      <div className="mt-6 space-y-4">
        {[
          {
            t: "You’ll be shown on the homepage",
            b: "After a short admin review, approved businesses appear on the NepCollab homepage — visible to partners and creators browsing the platform.",
          },
          {
            t: "Admin finds the right influencers",
            b: "You don’t dig through a directory. Our team proposes best-fit creators for your category and brief.",
          },
          {
            t: "You choose — we notify",
            b: "Review proposed matches, select who you want, close the deal with admin. We notify the influencer to move forward.",
          },
          {
            t: "Google login for your workspace",
            b: "Sign in with Google to see your listing status, proposed matches, and close deals from your phone.",
          },
        ].map((x) => (
          <div key={x.t} className="rounded-3xl border border-border bg-card p-5">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <h2 className="font-display text-base font-bold tracking-tight">{x.t}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{x.b}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link
        to="/list-business"
        className="tap mt-8 flex h-12 items-center justify-center rounded-full bg-ink text-[15px] font-bold text-ink-foreground"
      >
        List my business
      </Link>
      <Link
        to="/auth"
        search={{ next: "/brand" } as any}
        className="tap mt-3 flex h-11 items-center justify-center text-sm font-semibold text-signal"
      >
        Already listed? Sign in
      </Link>
    </Container>
  );
}
