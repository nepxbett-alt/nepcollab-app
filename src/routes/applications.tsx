import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline, type TimelineStep } from "@/components/StatusTimeline";
import { Button } from "@/components/ui/button";
import type { Application, Collaboration } from "@/data/types";
import { formatDate, getBrand } from "@/lib/lookup";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Your applications — NepCollab" },
      {
        name: "description",
        content:
          "Track every collaboration you applied to with a clear status timeline, from applied to completed.",
      },
      { property: "og:title", content: "Your applications — NepCollab" },
      {
        property: "og:description",
        content: "Always know where you stand with each brand.",
      },
    ],
  }),
  component: Applications,
});

const ORDER = [
  "Applied",
  "Under review",
  "Selected",
  "Content in progress",
  "Submitted",
  "Brand review",
  "Approved",
  "Completed",
] as const;

const DESCRIPTIONS: Record<string, string> = {
  Applied: "Your application reached the brand.",
  "Under review": "The brand is comparing creator profiles.",
  Selected: "You were picked for this collaboration.",
  "Content in progress": "Create and prepare your deliverables.",
  Submitted: "Your work has been sent to the brand.",
  "Brand review": "The brand is reviewing your submission.",
  Approved: "Your content was approved.",
  Completed: "Collaboration wrapped up. Nice work.",
};

function currentStage(app: Application, collab?: Collaboration) {
  if (app.status === "REJECTED" || app.status === "WITHDRAWN") return 1;
  if (!collab) {
    if (app.status === "SELECTED") return 2;
    if (app.status === "SHORTLISTED" || app.status === "UNDER_REVIEW") return 1;
    return 0;
  }
  switch (collab.status) {
    case "SELECTED":
    case "ACCEPTED":
      return 2;
    case "ACTIVE":
      return 3;
    case "WORK_SUBMITTED":
      return 4;
    case "REVIEWING":
    case "REVISION_REQUESTED":
      return 5;
    case "COMPLETED":
      return 7;
    default:
      return 2;
  }
}

function buildSteps(app: Application, collab?: Collaboration): TimelineStep[] {
  const stage = currentStage(app, collab);
  return ORDER.map((label, i) => ({
    label,
    description: DESCRIPTIONS[label] ?? "",
    ...(i === 0 ? { at: formatDate(app.appliedAt) } : {}),
    state: i < stage ? "done" : i === stage ? "current" : "todo",
  }));
}

function Applications() {
  const {
    applications,
    campaigns,
    collaborations,
    currentCreatorId,
    withdrawApplication,
  } = useStore();
  const mine = applications.filter((a) => a.creatorId === currentCreatorId);
  const [openId, setOpenId] = useState<string | null>(mine[0]?.id ?? null);

  return (
    <Container className="pt-4">
      <h1 className="pb-4 text-[22px] font-bold tracking-tight">Applications</h1>

      {mine.length === 0 ? (
        <EmptyState
          title="No applications yet"
          body="Your next collaboration could start here."
          actionLabel="Explore campaigns"
          actionTo="/campaigns"
        />
      ) : (
        <ul className="space-y-3">
          {mine.map((a) => {
            const campaign = campaigns.find((c) => c.id === a.campaignId);
            const brand = campaign ? getBrand(campaign.brandId) : undefined;
            const collab = collaborations.find(
              (c) => c.campaignId === a.campaignId && c.creatorId === a.creatorId,
            );
            const open = openId === a.id;
            return (
              <li
                key={a.id}
                className="overflow-hidden rounded-3xl border border-border bg-card"
              >
                <div className="flex items-start gap-3 p-4">
                  <img
                    src={brand?.logo}
                    alt=""
                    loading="lazy"
                    className="size-11 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] text-muted-foreground">
                      {brand?.name}
                    </p>
                    <Link
                      to="/campaigns/$campaignId"
                      params={{ campaignId: a.campaignId }}
                      className="block truncate text-[15px] font-semibold hover:underline"
                    >
                      {campaign?.title}
                    </Link>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      Applied {formatDate(a.appliedAt)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : a.id)}
                  className="tap flex w-full items-center justify-between border-t border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground hover:bg-secondary/50"
                >
                  {open ? "Hide progress" : "View progress"}
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>

                {open ? (
                  <div className="border-t border-border bg-secondary/25 p-4">
                    <StatusTimeline steps={buildSteps(a, collab)} />
                    {["APPLIED", "UNDER_REVIEW", "SHORTLISTED"].includes(
                      a.status,
                    ) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 rounded-full"
                        onClick={() => {
                          withdrawApplication(a.id);
                          toast.success("Application withdrawn");
                        }}
                      >
                        Withdraw application
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
