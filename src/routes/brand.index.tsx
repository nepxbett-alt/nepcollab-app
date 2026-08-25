import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Clock,
  FileText,
  Handshake,
  Plus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container, SectionHeader } from "@/components/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import { EmptyState } from "@/components/EmptyState";
import { getBrand, getCreator } from "@/lib/lookup";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/brand/")({
  head: () => ({
    meta: [
      { title: "Brand home — NepCollab" },
      { name: "description", content: "Manage campaigns, applicants, and collaborations." },
    ],
  }),
  component: BrandDashboard,
});

function BrandDashboard() {
  const {
    role,
    campaigns,
    applications,
    collaborations,
    currentBrandId,
    signedIn,
    loading,
  } = useStore();

  if (loading) {
    return (
      <Container className="py-16 text-center text-sm text-muted-foreground">Loading…</Container>
    );
  }

  if (!signedIn) {
    return (
      <Container>
        <EmptyState
          title="Sign in as a brand"
          body="Publish campaigns and review creators after you create a brand account."
          actionLabel="Sign in as brand"
          actionTo="/auth"
        />
        <p className="mt-3 text-center text-sm">
          <Link to="/auth" search={{ as: "brand" }} className="font-semibold text-signal hover:underline">
            Continue as brand →
          </Link>
        </p>
      </Container>
    );
  }

  if (role !== "brand") {
    return (
      <Container>
        <EmptyState
          title="Brand workspace"
          body="This area is for brand accounts. Switch to a brand profile or open the creator home."
          actionLabel="Go to home"
          actionTo="/dashboard"
        />
      </Container>
    );
  }

  const brand = getBrand(currentBrandId);
  const mine = campaigns.filter((c) => c.brandId === currentBrandId);
  const activeMine = mine.filter((c) => {
    const s = String(c.status || "");
    return s === "APPLICATIONS_OPEN" || s === "ACTIVE" || s === "PUBLISHED" || s.toLowerCase() === "active";
  });
  const received = applications.filter((a) => mine.some((c) => c.id === a.campaignId));
  const fresh = received.filter((a) => a.status === "APPLIED" || a.status === "UNDER_REVIEW");
  const brandCollabs = collaborations.filter(
    (c) => c.brandId === currentBrandId || mine.some((camp) => camp.id === c.campaignId),
  );
  const submissions = brandCollabs.flatMap((c) =>
    (c.deliverables || []).filter((d) => d.status === "SUBMITTED"),
  );

  return (
    <Container>
      <div className="mb-5">
        <p className="text-[13px] font-medium text-signal">Brand workspace</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
          {brand?.name ? `Hi, ${brand.name}` : "Brand home"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Campaigns, applicants, and deliverables in one place.
        </p>
      </div>

      <Link
        to="/brand/campaigns/new"
        className="tap mb-5 flex h-12 items-center justify-center gap-2 rounded-full bg-signal text-[15px] font-semibold text-signal-foreground hover:bg-signal/90"
      >
        <Plus className="size-4" /> Create campaign
      </Link>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Active campaigns" value={activeMine.length || mine.length} icon={FileText} />
        <StatTile label="Applications" value={received.length} icon={Users} />
        <StatTile label="Needs review" value={fresh.length} icon={Clock} />
        <StatTile label="Collaborations" value={brandCollabs.length} icon={Handshake} />
      </div>

      <div className="mt-8">
        <SectionHeader title="New applications" actionLabel="Review" actionTo="/brand/applicants" />
        {fresh.length === 0 ? (
          <EmptyState
            title="No new applications"
            body="Creators who apply to your campaigns will land here."
            actionLabel="View campaigns"
            actionTo="/brand/campaigns"
          />
        ) : (
          <ul className="space-y-2.5">
            {fresh.slice(0, 5).map((a) => {
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
                      className="size-10 shrink-0 rounded-full object-cover bg-muted"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{creator?.name || "Creator"}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{campaign?.title}</p>
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
          hint={`${submissions.length} submission${submissions.length === 1 ? "" : "s"} waiting`}
          actionLabel="Collaborations"
          actionTo="/collaborations"
        />
        {submissions.length === 0 ? (
          <EmptyState
            title="Nothing waiting on you"
            body="When creators submit work, review it from collaborations."
          />
        ) : (
          <ul className="space-y-2.5">
            {submissions.slice(0, 4).map((d) => (
              <li key={d.id} className="rounded-2xl border border-border bg-card p-3.5">
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
        <SectionHeader title="Your campaigns" actionLabel="Manage" actionTo="/brand/campaigns" />
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

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          to="/brand/applicants"
          className="tap inline-flex h-11 items-center rounded-full border border-border px-4 text-sm font-semibold"
        >
          Review applicants
        </Link>
        <Link
          to="/messages"
          className="tap inline-flex h-11 items-center rounded-full border border-border px-4 text-sm font-semibold"
        >
          Messages
        </Link>
      </div>
    </Container>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <Icon className="size-4 text-signal" aria-hidden />
      <p className="mt-2 text-xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
