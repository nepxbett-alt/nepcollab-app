import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Container, PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toUserError } from "@/lib/user-error";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/brand/campaigns/")({
  head: () => ({
    meta: [
      { title: "Your campaigns — NepCollab" },
      { name: "description", content: "Manage published campaigns, applicants and lifecycle status." },
      { property: "og:title", content: "Your campaigns — NepCollab" },
    ],
  }),
  component: BrandCampaigns,
});

function BrandCampaigns() {
  const { campaigns, applications, currentBrandId, signedIn, updateCampaignStatus } = useStore();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <Container>
        <EmptyState
          title="Sign in as a brand"
          body="Publish and manage campaigns after you create a brand account."
          actionLabel="Sign in"
          actionTo="/auth"
        />
      </Container>
    );
  }

  const mine = campaigns.filter((c) => c.brandId === currentBrandId);

  const setStatus = async (id: string, status: string, label: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await updateCampaignStatus(id, status);
      toast.success(`Campaign ${label}`);
    } catch (e) {
      toast.error(toUserError(e, "Could not update campaign."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Container>
      <PageHeader
        title="Campaigns"
        subtitle="Publish, pause, or close opportunities."
        action={
          <Button asChild className="rounded-full bg-signal text-signal-foreground hover:bg-signal/90">
            <Link to="/brand/campaigns/new">
              <Plus className="size-4" /> Create campaign
            </Link>
          </Button>
        }
      />
      {mine.length === 0 ? (
        <EmptyState
          title="Your first collaboration starts here."
          body="Publish a campaign and creators will start applying."
          actionLabel="Create campaign"
          actionTo="/brand/campaigns/new"
        />
      ) : (
        <div className="space-y-4">
          {mine.map((c) => {
            const apps = applications.filter((a) => a.campaignId === c.id);
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      to="/campaigns/$campaignId"
                      params={{ campaignId: c.id }}
                      className="font-semibold hover:underline"
                    >
                      {c.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge status={c.status} />
                      <span>{apps.length} applications</span>
                      <span>{c.location || "—"}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/brand/applicants">Applicants</Link>
                    </Button>
                    {c.status !== "PAUSED" && c.status !== "CLOSED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === c.id}
                        onClick={() => void setStatus(c.id, "paused", "paused")}
                      >
                        Pause
                      </Button>
                    )}
                    {(c.status === "PAUSED" || String(c.status).toLowerCase() === "paused") && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === c.id}
                        onClick={() => void setStatus(c.id, "active", "reopened")}
                      >
                        Resume
                      </Button>
                    )}
                    {c.status !== "CLOSED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === c.id}
                        onClick={() => {
                          if (confirm("Close this campaign? Creators can no longer apply.")) {
                            void setStatus(c.id, "closed", "closed");
                          }
                        }}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
