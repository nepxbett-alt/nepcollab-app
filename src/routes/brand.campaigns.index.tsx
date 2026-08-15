import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Container, PageHeader } from "@/components/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/brand/campaigns/")({
  head: () => ({
    meta: [
      { title: "Your campaigns — NepCollab" },
      { name: "description", content: "Manage published campaigns, applicants and lifecycle status." },
      { property: "og:title", content: "Your campaigns — NepCollab" },
      { property: "og:description", content: "Every opportunity your brand has published." },
    ],
  }),
  component: BrandCampaigns,
});

function BrandCampaigns() {
  const { campaigns, currentBrandId } = useStore();
  const mine = campaigns.filter((c) => c.brandId === currentBrandId);

  return (
    <Container>
      <PageHeader
        title="Campaigns"
        subtitle="Opportunities you've published."
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
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {mine.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </Container>
  );
}
