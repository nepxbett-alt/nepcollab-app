import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Clock,
  FileText,
  Handshake,
  Plus,
  Users,
} from "lucide-react";
import { Container, SectionHeader } from "@/components/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import { EmptyState } from "@/components/EmptyState";
import { ProfileProgress } from "@/components/ProfileProgress";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, getBrand, getCreator, matchScore } from "@/lib/lookup";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Home — NepCollab" },
      {
        name: "description",
        content:
          "Your NepCollab home: recommended collaborations, applications and activity in one calm view.",
      },
      { property: "og:title", content: "Home — NepCollab" },
      {
        property: "og:description",
        content: "Recommended collaborations and your activity at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Greeting({ name, sub }: { name?: string | undefined; sub: string }) {
  return (
    <div className="pb-5">
      <p className="text-[13px] text-muted-foreground">
        {greeting()} {name ? name.split(" ")[0] : ""} 👋
      </p>
      <h1 className="mt-0.5 text-[22px] font-bold tracking-tight">{sub}</h1>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <Icon className="size-4 text-signal" />
      <p className="mt-2 text-xl font-bold leading-none tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-[11.5px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Dashboard() {
  const {
    role,
    campaigns,
    applications,
    collaborations,
    saved,
    toggleSaved,
    currentCreatorId,
    currentBrandId,
  } = useStore();

  if (role === "brand") {
    const brand = getBrand(currentBrandId);
    const mine = campaigns.filter((c) => c.brandId === currentBrandId);
    const received = applications.filter((a) =>
      mine.some((c) => c.id === a.campaignId),
    );
    const fresh = received.filter(
      (a) => a.status === "APPLIED" || a.status === "UNDER_REVIEW",
    );
    const submissions = collaborations.flatMap((c) =>
      c.deliverables.filter((d) => d.status === "SUBMITTED"),
    );

    return (
      <Container>
        <Greeting name={brand?.name} sub="Your collaboration overview" />

        <Link
          to="/brand/campaigns/new"
          className="tap mb-5 flex h-12 items-center justify-center gap-2 rounded-full bg-signal text-[15px] font-semibold text-signal-foreground hover:bg-signal/90"
        >
          <Plus className="size-4" /> Create campaign
        </Link>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Active campaigns" value={mine.length} icon={FileText} />
          <StatTile label="Applications" value={received.length} icon={Users} />
          <StatTile label="Needs review" value={fresh.length} icon={Clock} />
          <StatTile
            label="Collaborations"
            value={collaborations.length}
            icon={Handshake}
          />
        </div>

        <div className="mt-8">
          <SectionHeader
            title="New applications"
            actionLabel="Review"
            actionTo="/brand/applicants"
          />
          {fresh.length === 0 ? (
            <EmptyState
              title="No new applications"
              body="Creators who apply to your campaigns will land here."
              actionLabel="View campaigns"
              actionTo="/brand/campaigns"
            />
          ) : (
            <ul className="space-y-2.5">
              {fresh.slice(0, 4).map((a) => {
                const creator = getCreator(a.creatorId);
                const campaign = campaigns.find((c) => c.id === a.campaignId);
                return (
                  <li key={a.id}>
                    <Link
                      to="/brand/applicants"
                      className="tap flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
                    >
                      <img
                        src={creator?.avatar}
                        alt=""
                        loading="lazy"
                        className="size-10 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold">
                          {creator?.name}
                        </p>
                        <p className="truncate text-[12px] text-muted-foreground">
                          {campaign?.title}
                        </p>
                      </div>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-8">
          <SectionHeader
            title="Pending actions"
            hint={`${submissions.length} submission${submissions.length === 1 ? "" : "s"} waiting on you`}
            actionLabel="Open"
            actionTo="/collaborations"
          />
          {submissions.length === 0 ? (
            <EmptyState
              title="Nothing waiting on you"
              body="Submissions from your creators will show up here for review."
            />
          ) : (
            <ul className="space-y-2.5">
              {submissions.slice(0, 4).map((d) => (
                <li
                  key={d.id}
                  className="rounded-2xl border border-border bg-card p-3.5"
                >
                  <p className="text-[14px] font-semibold">{d.title}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {d.platform} · submitted for review
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8">
          <SectionHeader
            title="Your campaigns"
            actionLabel="Manage"
            actionTo="/brand/campaigns"
          />
          {mine.length === 0 ? (
            <EmptyState
              title="Your first collaboration starts here"
              body="Publish a campaign and let creators come to you."
              actionLabel="Create campaign"
              actionTo="/brand/campaigns/new"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mine.slice(0, 3).map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </div>
      </Container>
    );
  }

  const creator = getCreator(currentCreatorId);
  const mine = applications.filter((a) => a.creatorId === currentCreatorId);
  const scored = [...campaigns].sort(
    (a, b) => matchScore(b, currentCreatorId) - matchScore(a, currentCreatorId),
  );
  const recommended = scored.slice(0, 3);
  const nearby = campaigns
    .filter((c) => c.location === creator?.location || c.remote)
    .slice(0, 3);
  const newest = [...campaigns]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);
  const myCollabs = collaborations.filter(
    (c) => c.creatorId === currentCreatorId,
  );

  const filled = [
    Boolean(creator?.bio),
    (creator?.socials.length ?? 0) > 0,
    (creator?.portfolio.length ?? 0) > 1,
    (creator?.niches.length ?? 0) > 0,
    Boolean(creator?.verified),
  ].filter(Boolean).length;
  const percent = Math.round((filled / 5) * 100);

  return (
    <Container>
      <Greeting name={creator?.name} sub="Find your next collaboration" />

      <SectionHeader
        title="Recommended for you"
        hint="Matched to your niche, city and platforms"
        actionLabel="See all"
        actionTo="/campaigns"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommended.map((c) => (
          <CampaignCard
            key={c.id}
            campaign={c}
            saved={saved.includes(c.id)}
            onToggleSave={toggleSaved}
            match={matchScore(c, currentCreatorId)}
          />
        ))}
      </div>

      {nearby.length > 0 ? (
        <div className="mt-8">
          <SectionHeader
            title="Trending near you"
            hint={creator?.location}
            actionLabel="See all"
            actionTo="/campaigns"
          />
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0">
            {nearby.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                saved={saved.includes(c.id)}
                onToggleSave={toggleSaved}
                className="w-[78vw] shrink-0 snap-start sm:w-[320px] lg:w-auto"
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <SectionHeader title="New opportunities" actionLabel="See all" actionTo="/campaigns" />
        <ul className="space-y-2.5">
          {newest.map((c) => {
            const brand = getBrand(c.brandId);
            return (
              <li key={c.id}>
                <Link
                  to="/campaigns/$campaignId"
                  params={{ campaignId: c.id }}
                  className="tap flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
                >
                  <img
                    src={brand?.logo}
                    alt=""
                    loading="lazy"
                    className="size-10 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold">{c.title}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {brand?.name} · {c.remote ? "Remote" : c.location}
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {percent < 100 ? (
        <div className="mt-8">
          <ProfileProgress
            percent={percent}
            hint="Add portfolio work and verify your socials to improve your chances of getting selected."
          />
        </div>
      ) : null}

      <div className="mt-8">
        <SectionHeader
          title="Your collaboration activity"
          actionLabel="All applications"
          actionTo="/applications"
        />
        {mine.length === 0 && myCollabs.length === 0 ? (
          <EmptyState
            title="No applications yet"
            body="Your next collaboration could start here."
            actionLabel="Explore campaigns"
            actionTo="/campaigns"
          />
        ) : (
          <ul className="space-y-2.5">
            {mine.slice(0, 4).map((a) => {
              const campaign = campaigns.find((c) => c.id === a.campaignId);
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">
                      {campaign?.title}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">
                      Applied {formatDate(a.appliedAt)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Container>
  );
}
