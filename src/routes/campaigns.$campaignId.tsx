import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Flag,
  Gift,
  MapPin,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { daysLeft, formatDate, formatFollowers, getBrand } from "@/lib/lookup";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campaigns/$campaignId")({
  head: () => ({
    meta: [
      { title: "Campaign details — NepCollab" },
      {
        name: "description",
        content:
          "See campaign requirements, deliverables, perks and deadlines, then apply as a creator.",
      },
      { property: "og:title", content: "Campaign details — NepCollab" },
      {
        property: "og:description",
        content: "Requirements, deliverables and perks for this collaboration opportunity.",
      },
    ],
  }),
  component: CampaignDetail,
  notFoundComponent: () => (
    <Container>
      <EmptyState
        title="Campaign not found"
        body="This opportunity may have been closed or removed."
        actionLabel="Browse campaigns"
        actionTo="/campaigns"
      />
    </Container>
  ),
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function CampaignDetail() {
  const { campaignId } = Route.useParams();
  const {
    campaigns,
    applications,
    saved,
    toggleSaved,
    currentCreatorId,
    role,
    signedIn,

  } = useStore();
  const campaign = campaigns.find((c) => c.id === campaignId);
  if (!campaign) throw notFound();
  const brand = getBrand(campaign.brandId);
  const application = applications.find(
    (a) => a.campaignId === campaign.id && a.creatorId === currentCreatorId,
  );
  const left = daysLeft(campaign.deadline);
  const isSaved = saved.includes(campaign.id);

  return (
    <div>
      <div className="relative h-56 w-full overflow-hidden md:h-80">
        <img
          src={campaign.cover}
          alt={`${campaign.title} cover`}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-6">
          <div className="flex items-center gap-3 text-ink-foreground">
            <img
              src={brand?.logo}
              alt={`${brand?.name} logo`}
              className="size-12 rounded-full border-2 border-card object-cover"
            />
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                {brand?.name}
                {brand?.verified ? (
                  <BadgeCheck className="size-4 text-signal" />
                ) : null}
              </p>
              <p className="text-xs opacity-80">{brand?.category}</p>
            </div>
          </div>
          <h1 className="mt-3 max-w-3xl text-xl font-bold text-ink-foreground md:text-3xl">
            {campaign.title}
          </h1>
        </Container>
      </div>

      <Container className="grid gap-8 pb-24 lg:grid-cols-[1fr_340px] lg:pb-5">
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={campaign.status} />
            {campaign.types.map((t) => (
              <span
                key={t}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
              >
                {t}
              </span>
            ))}
          </div>

          <section>
            <h2 className="text-xl font-bold">About this campaign</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {campaign.description}
            </p>
          </section>

          <section className="rounded-2xl border border-signal/40 bg-accent/50 p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Gift className="size-5" /> What you get
            </h2>
            <ul className="mt-3 space-y-2">
              {campaign.perks.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="size-4 text-success" /> {p}
                </li>
              ))}
            </ul>
            {campaign.giftValue ? (
              <p className="mt-3 rounded-2xl bg-card p-3 text-sm">
                {campaign.giftValue}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              NepCollab does not process payments. Any compensation is arranged
              directly with the brand.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Deliverables</h2>
            <ul className="mt-3 space-y-3">
              {campaign.deliverables.map((d) => (
                <li
                  key={d.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{d.title}</p>
                    <span className="text-xs text-muted-foreground">
                      Due {formatDate(d.dueDate)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {d.instructions}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">Who they're looking for</h2>
            <div className="mt-3 rounded-2xl border border-border bg-card px-4">
              <Row
                label="Minimum followers"
                value={
                  campaign.requirements.minFollowers
                    ? `${formatFollowers(campaign.requirements.minFollowers)}+`
                    : "No minimum"
                }
              />
              <Row
                label="Minimum engagement"
                value={
                  campaign.requirements.minEngagement
                    ? `${campaign.requirements.minEngagement}%`
                    : "No minimum"
                }
              />
              <Row label="Niches" value={campaign.requirements.niches.join(", ")} />
              <Row
                label="Languages"
                value={campaign.requirements.languages.join(", ")}
              />
              <Row label="Platforms" value={campaign.platforms.join(", ")} />
              <Row label="Experience" value={campaign.requirements.experience} />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold">Selection process</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The brand reviews every application, shortlists creators, then
              selects {campaign.creatorsNeeded}. You'll be notified at each
              stage and can track your status from your applications.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                {campaign.remote ? "Remote" : campaign.location}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
              </p>
              <p className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                {campaign.creatorsNeeded} creators needed
              </p>
            </div>

            <div
              className={cn(
                "rounded-2xl p-3 text-sm font-semibold",
                left <= 7
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {left > 0
                ? `Applications close in ${left} days — ${formatDate(campaign.deadline)}`
                : "Applications closed"}
            </div>

            {application ? (
              <div className="space-y-2 text-center">
                <StatusBadge status={application.status} />
                <p className="text-xs text-muted-foreground">
                  You applied on {formatDate(application.appliedAt)}
                </p>
                <Button asChild variant="outline" className="w-full rounded-full">
                  <Link to="/applications">Track application</Link>
                </Button>
              </div>
            ) : role === "brand" ? (
              <Button asChild className="w-full rounded-full">
                <Link to="/brand/applicants">View applicants</Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="w-full rounded-full bg-signal text-signal-foreground hover:bg-signal/90"
              >
                <Link
                  to="/campaigns/$campaignId/apply"
                  params={{ campaignId: campaign.id }}
                >
                  Apply now
                </Link>
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => toggleSaved(campaign.id)}
              >
                <Bookmark className={cn("size-4", isSaved && "fill-current")} />
                {isSaved ? "Saved" : "Save"}
              </Button>
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => toast.success("Report sent to moderation")}
              >
                <Flag className="size-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold">{brand?.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {brand?.description}
            </p>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span>{brand?.completedCampaigns} campaigns</span>
              <span>{brand?.rating} rating</span>
              <span>{brand?.responseRate}% response</span>
            </div>
          </div>
        </aside>
      </Container>

      {/* Mobile sticky apply bar */}
      {role !== "brand" && !application ? (
        <div
          className={cn(
            "fixed inset-x-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden",
            signedIn
              ? "bottom-[calc(3.75rem+env(safe-area-inset-bottom))]"
              : "bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
          )}
        >
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <button
              type="button"
              aria-label={isSaved ? "Remove from saved" : "Save campaign"}
              aria-pressed={isSaved}
              onClick={() => toggleSaved(campaign.id)}
              className="tap flex size-12 shrink-0 items-center justify-center rounded-full border border-border"
            >
              <Bookmark className={cn("size-5", isSaved && "fill-signal text-signal")} />
            </button>
            <Link
              to="/campaigns/$campaignId/apply"
              params={{ campaignId: campaign.id }}
              className="tap flex h-12 flex-1 items-center justify-center rounded-full bg-signal text-[15px] font-semibold text-signal-foreground hover:bg-signal/90"
            >
              Apply now
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

