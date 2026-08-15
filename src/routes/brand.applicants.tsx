import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Container, PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDate, formatFollowers, getCreator, matchScore } from "@/lib/lookup";
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
  const { campaigns, applications, currentBrandId, setApplicationStatus } = useStore();
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
                  <img src={creator?.avatar} alt={creator?.name} className="size-12 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{creator?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {creator?.location} · {creator?.niches.join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {creator?.socials
                        .map((s) => `${s.platform} ${formatFollowers(s.followers)}`)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={a.status} />
                    {campaign ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {matchScore(campaign, a.creatorId)}% match
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">{a.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Applied {formatDate(a.appliedAt)}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setApplicationStatus(a.id, "SHORTLISTED");
                      toast.success("Creator shortlisted");
                    }}
                  >
                    Shortlist
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setApplicationStatus(a.id, "SELECTED");
                      toast.success("Creator selected — collaboration created");
                    }}
                  >
                    Select
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setApplicationStatus(a.id, "REJECTED");
                      toast("Application rejected");
                    }}
                  >
                    Reject
                  </Button>
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
