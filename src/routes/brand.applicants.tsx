import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Container, PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { displayMatch, formatDate, formatFollowers, getCreator, matchScore } from "@/lib/lookup";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/brand/applicants")({
  head: () => ({
    meta: [
      { title: "Applicants — NepCollab" },
      { name: "description", content: "Review creators who applied to your campaigns, shortlist and select them." },
      { property: "og:title", content: "Applicants — NepCollab" },
      { property: "og:description", content: "Shortlist, compare and select creators for your campaign." },
    ],
  }),
  component: Applicants,
});

function Applicants() {
  const { campaigns, applications, currentBrandId, setApplicationStatus, signedIn } = useStore();
  if (!signedIn) {
    return (
      <Container>
        <EmptyState
          title="Sign in as a brand"
          body="Review applicants after you publish a campaign. Anyone can browse open campaigns without an account."
          actionLabel="Sign in"
          actionTo="/auth"
        />
      </Container>
    );
  }
  const mine = campaigns.filter((c) => c.brandId === currentBrandId);
  const [campaignId, setCampaignId] = useState(mine[0]?.id ?? "");
  const list = applications.filter((a) => a.campaignId === campaignId);

  if (mine.length === 0) {
    return (
      <Container>
        <PageHeader title="Applicants" />
        <EmptyState
          title="No campaigns yet"
          body="Publish a campaign to start receiving applications."
          actionLabel="Create campaign"
          actionTo="/brand/campaigns/new"
        />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader title="Applicants" subtitle="Review, shortlist and select creators." />

      <div className="mb-6 flex flex-wrap gap-2">
        {mine.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCampaignId(c.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              campaignId === c.id
                ? "border-ink bg-ink text-ink-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {c.title}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No applications yet"
          body="Creators will appear here as soon as they apply to this campaign."
          actionLabel="View campaign"
          actionTo="/brand/campaigns"
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((a) => {
            const creator = getCreator(a.creatorId);
            const campaign = campaigns.find((c) => c.id === a.campaignId);
            return (
              <li key={a.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <img
                    src={creator?.avatar}
                    alt=""
                    className="size-14 shrink-0 rounded-full object-cover bg-muted"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{creator?.name || "Creator"}</p>
                    <p className="text-xs text-muted-foreground">
                      {[creator?.location, creator?.niches?.length ? creator.niches.join(", ") : null]
                        .filter(Boolean)
                        .join(" · ") || "Nepal"}
                    </p>
                    {creator?.bio ? (
                      <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                        {creator.bio}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <StatusBadge status={a.status} />
                    {campaign && displayMatch(matchScore(campaign, a.creatorId)) != null ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {displayMatch(matchScore(campaign, a.creatorId))}% match
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Applicant public metrics — brands see full details for people who applied */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-secondary/50 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Followers
                    </p>
                    <p className="text-sm font-semibold">
                      {formatFollowers(
                        (creator?.socials ?? []).reduce((n, s) => n + (s.followers || 0), 0),
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Engagement
                    </p>
                    <p className="text-sm font-semibold">
                      {creator?.engagementRate != null
                        ? `${Number(undefined).toFixed(1)}%`
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Languages
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {(creator?.languages ?? []).join(", ") || "—"}
                    </p>
                  </div>
                </div>

                {(creator?.socials ?? []).length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {creator!.socials.map((s) => {
                      const handle = s.username;
                      const href =
                        s.profileUrl ||
                        (s.platform === "Instagram"
                          ? `https://www.instagram.com/${handle}/`
                          : s.platform === "TikTok"
                            ? `https://www.tiktok.com/@${handle}`
                            : s.platform === "YouTube"
                              ? `https://www.youtube.com/@${handle}`
                              : s.platform === "Facebook"
                                ? `https://www.facebook.com/${handle}`
                                : undefined);
                      return (
                      <li
                        key={`${s.platform}-${handle}`}
                        className="flex items-center justify-between gap-2 rounded-xl border border-border/80 px-3 py-2 text-[13px]"
                      >
                        <span className="min-w-0 font-medium">
                          {s.platform}
                          {handle ? (
                            <span className="font-normal text-muted-foreground"> @{handle}</span>
                          ) : null}
                          {s.followers > 0 ? (
                            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                              {formatFollowers(s.followers)} · Self-reported
                            </span>
                          ) : null}
                        </span>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-[12px] font-semibold text-signal"
                          >
                            View ↗
                          </a>
                        ) : null}
                      </li>
                    );})}
                  </ul>
                ) : null}

                {a.message ? (
                  <div className="mt-3 rounded-xl border border-border/80 bg-secondary/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Pitch
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{a.message}</p>
                    {a.contentIdea ? (
                      <p className="mt-2 text-[13px] text-muted-foreground">
                        <span className="font-medium text-foreground">Idea: </span>
                        {a.contentIdea}
                      </p>
                    ) : null}
                    {a.availability ? (
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        <span className="font-medium text-foreground">Availability: </span>
                        {a.availability}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <p className="mt-2 text-xs text-muted-foreground">Applied {formatDate(a.appliedAt)}</p>

                {a.status === "SELECTED" ? (
                  <p className="mt-2 rounded-xl bg-success/10 px-3 py-2 text-[12.5px] font-medium text-success">
                    Accepted — full applicant details above stay available in Collaborations and Messages.
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {a.status === "APPLIED" || a.status === "UNDER_REVIEW" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await setApplicationStatus(a.id, "SHORTLISTED");
                          toast.success("Creator shortlisted");
                        } catch (err: any) {
                          toast.error(err?.message || "Could not shortlist");
                        }
                      }}
                    >
                      Shortlist
                    </Button>
                  ) : null}
                  {a.status === "APPLIED" || a.status === "UNDER_REVIEW" || a.status === "SHORTLISTED" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await setApplicationStatus(a.id, "SELECTED");
                            toast.success("Creator selected — collaboration started");
                          } catch (err: any) {
                            toast.error(err?.message || "Could not select creator");
                          }
                        }}
                      >
                        Select & start collab
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await setApplicationStatus(a.id, "REJECTED");
                            toast("Application rejected");
                          } catch (err: any) {
                            toast.error(err?.message || "Could not reject");
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {a.status === "SELECTED" ? (
                    <p className="w-full text-[12.5px] font-medium text-success">
                      Selected — open Collaborations to manage deliverables.
                    </p>
                  ) : null}
                  {a.status === "REJECTED" ? (
                    <p className="w-full text-[12.5px] text-muted-foreground">Rejected</p>
                  ) : null}
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/messages">Message</Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
