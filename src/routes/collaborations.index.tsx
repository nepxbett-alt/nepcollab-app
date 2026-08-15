import { createFileRoute, Link } from "@tanstack/react-router";
import { Container, PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, getBrand, getCreator } from "@/lib/lookup";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/collaborations/")({
  head: () => ({
    meta: [
      { title: "Collaborations — NepCollab" },
      { name: "description", content: "Your active collaboration workspaces: deliverables, deadlines and submissions." },
      { property: "og:title", content: "Collaborations — NepCollab" },
      { property: "og:description", content: "Track deliverables and submissions for every active collaboration." },
    ],
  }),
  component: Collaborations,
});

function Collaborations() {
  const { collaborations, campaigns, role } = useStore();

  return (
    <Container>
      <PageHeader title="Collaborations" subtitle="Selected work, in progress." />
      {collaborations.length === 0 ? (
        <EmptyState
          title="No active collaborations"
          body={
            role === "brand"
              ? "Select a creator from your applicants to start a collaboration."
              : "Once a brand selects you, your workspace appears here."
          }
          actionLabel={role === "brand" ? "View applicants" : "Find opportunities"}
          actionTo={role === "brand" ? "/brand/applicants" : "/campaigns"}
        />
      ) : (
        <ul className="space-y-4">
          {collaborations.map((co) => {
            const campaign = campaigns.find((c) => c.id === co.campaignId);
            const brand = campaign ? getBrand(campaign.brandId) : undefined;
            const creator = getCreator(co.creatorId);
            const done = co.deliverables.filter((d) => d.status === "APPROVED").length;
            return (
              <li key={co.id}>
                <Link
                  to="/collaborations/$collabId"
                  params={{ collabId: co.id }}
                  className="block rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {role === "brand" ? creator?.name : brand?.name}
                      </p>
                      <p className="truncate font-semibold">{campaign?.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Started {formatDate(co.startedAt)} · {done}/
                        {co.deliverables.length} deliverables approved
                      </p>
                    </div>
                    <StatusBadge status={co.status} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
