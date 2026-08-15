import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, getBrand, getCreator } from "@/lib/lookup";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/collaborations/$collabId")({
  head: () => ({
    meta: [
      { title: "Collaboration workspace — NepCollab" },
      { name: "description", content: "Deliverables, submissions, approvals and activity for this collaboration." },
      { property: "og:title", content: "Collaboration workspace — NepCollab" },
      { property: "og:description", content: "Submit work, request revisions and complete the collaboration." },
    ],
  }),
  component: Workspace,
});

function Workspace() {
  const { collabId } = Route.useParams();
  const {
    collaborations,
    campaigns,
    role,
    submitDeliverable,
    reviewDeliverable,
  } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");

  const collab = collaborations.find((c) => c.id === collabId);
  if (!collab) {
    return (
      <Container>
        <EmptyState
          title="Collaboration not found"
          body="It may have been completed or removed."
          actionLabel="Back to collaborations"
          actionTo="/collaborations"
        />
      </Container>
    );
  }
  const campaign = campaigns.find((c) => c.id === collab.campaignId);
  const brand = campaign ? getBrand(campaign.brandId) : undefined;
  const creator = getCreator(collab.creatorId);

  return (
    <Container className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{brand?.name}</p>
            <h1 className="text-xl font-bold">{campaign?.title}</h1>
          </div>
          <StatusBadge status={collab.status} />
        </div>

        <h2 className="mb-3 mt-8 text-xl font-bold">Deliverables</h2>
        <ul className="space-y-3">
          {collab.deliverables.map((d) => (
            <li key={d.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.platform} · due {formatDate(d.dueDate)}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{d.instructions}</p>

              {d.submission ? (
                <div className="mt-3 rounded-2xl bg-secondary p-3 text-sm">
                  <p className="font-medium">Submitted {formatDate(d.submission.submittedAt)}</p>
                  <p className="text-muted-foreground">{d.submission.note}</p>
                  {d.submission.link ? (
                    <p className="mt-1 break-all text-xs text-signal">{d.submission.link}</p>
                  ) : null}
                </div>
              ) : null}

              {role === "brand" ? (
                d.status === "SUBMITTED" ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        reviewDeliverable(collab.id, d.id, "APPROVED");
                        toast.success("Deliverable approved");
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        reviewDeliverable(collab.id, d.id, "REVISION_REQUESTED");
                        toast("Revision requested");
                      }}
                    >
                      Request changes
                    </Button>
                  </div>
                ) : null
              ) : d.status === "APPROVED" ? null : (
                <div className="mt-3">
                  {open === d.id ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={3}
                        value={note}
                        maxLength={600}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Anything the brand should know about this submission"
                      />
                      <Input
                        value={link}
                        maxLength={300}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="Link to the post or file"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            submitDeliverable(collab.id, d.id, { note, link });
                            setOpen(null);
                            setNote("");
                            setLink("");
                            toast.success("Work submitted for review");
                          }}
                        >
                          Submit work
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setOpen(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setOpen(d.id)}>
                      Submit work
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">Participants</p>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <img src={brand?.logo} alt={brand?.name} className="size-9 rounded-full object-cover" />
              <span>{brand?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={creator?.avatar} alt={creator?.name} className="size-9 rounded-full object-cover" />
              <span>{creator?.name}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">Activity</p>
          <ol className="mt-3 space-y-3">
            {collab.timeline.map((t) => (
              <li key={t.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-signal" />
                <span>
                  {t.label}
                  <span className="block text-xs text-muted-foreground">
                    {formatDate(t.date)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </Container>
  );
}
