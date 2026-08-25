import { createFileRoute, Link } from "@tanstack/react-router";
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
import { brandCreateVoucher } from "@/lib/vouchers";
import {
  brandCommitBenefit,
  confirmCollaborationAgreement,
  creatorRedeemBenefit,
  ensureCollaborationAgreement,
  openCollabDispute,
} from "@/lib/collab-protection";

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
  const [voucherBusy, setVoucherBusy] = useState(false);
  const [rewardLabel, setRewardLabel] = useState("Collaboration reward");
  const [protectionBusy, setProtectionBusy] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");


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

        {/* Non-cash protection timeline */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-bold">Collaboration protection</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Non-cash only — benefit first, deliverable next. No wallets or payouts.
              </p>
            </div>
          </div>

          <ol className="space-y-2 text-[13px]">
            <li className="flex gap-2">
              <span className="text-signal">1.</span>
              <span>Both sides confirm agreement terms</span>
            </li>
            <li className="flex gap-2">
              <span className="text-signal">2.</span>
              <span>Brand commits the benefit (product / meal / stay / etc.)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-signal">3.</span>
              <span>Creator redeems / receives benefit</span>
            </li>
            <li className="flex gap-2">
              <span className="text-signal">4.</span>
              <span>Creator submits deliverable → brand reviews (7 days)</span>
            </li>
          </ol>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={protectionBusy}
              onClick={async () => {
                setProtectionBusy(true);
                try {
                  await ensureCollaborationAgreement({ data: { collaborationId: collab.id } });
                  const res = await confirmCollaborationAgreement({
                    data: { collaborationId: collab.id },
                  });
                  if (!res.success) toast.error(res.message);
                  else toast.success(res.message);
                } catch (e: any) {
                  toast.error(e?.message || "Could not confirm");
                } finally {
                  setProtectionBusy(false);
                }
              }}
            >
              Confirm agreement
            </Button>

            {role === "brand" ? (
              <Button
                type="button"
                size="sm"
                className="bg-signal text-signal-foreground hover:bg-signal/90"
                disabled={protectionBusy}
                onClick={async () => {
                  setProtectionBusy(true);
                  try {
                    const res = await brandCommitBenefit({
                      data: { collaborationId: collab.id, makeAvailable: true },
                    });
                    if (!res.success) toast.error(res.message);
                    else toast.success(res.message + (res.redemptionCode ? ` Code: ${res.redemptionCode}` : ""));
                  } catch (e: any) {
                    toast.error(e?.message || "Could not commit benefit");
                  } finally {
                    setProtectionBusy(false);
                  }
                }}
              >
                Commit benefit
              </Button>
            ) : null}

            {role === "creator" ? (
              <Button
                type="button"
                size="sm"
                className="bg-signal text-signal-foreground hover:bg-signal/90"
                disabled={protectionBusy}
                onClick={async () => {
                  setProtectionBusy(true);
                  try {
                    const res = await creatorRedeemBenefit({
                      data: { collaborationId: collab.id },
                    });
                    if (!res.success) toast.error(res.message);
                    else toast.success(res.message);
                  } catch (e: any) {
                    toast.error(e?.message || "Could not redeem");
                  } finally {
                    setProtectionBusy(false);
                  }
                }}
              >
                I received the benefit
              </Button>
            ) : null}

            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={protectionBusy}
              onClick={() => setDisputeOpen((v) => !v)}
            >
              Open dispute
            </Button>
          </div>

          {disputeOpen ? (
            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <Input
                placeholder="Reason (required)"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              />
              <Button
                size="sm"
                disabled={protectionBusy || !disputeReason.trim()}
                onClick={async () => {
                  setProtectionBusy(true);
                  try {
                    const res = await openCollabDispute({
                      data: {
                        collaborationId: collab.id,
                        reason: disputeReason.trim(),
                      },
                    });
                    if (!res.success) toast.error(res.message);
                    else {
                      toast.success(res.message);
                      setDisputeOpen(false);
                      setDisputeReason("");
                    }
                  } catch (e: any) {
                    toast.error(e?.message);
                  } finally {
                    setProtectionBusy(false);
                  }
                }}
              >
                Submit dispute
              </Button>
            </div>
          ) : null}
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
                      onClick={async () => {
                        try {
                          await reviewDeliverable(collab.id, d.id, "APPROVED");
                          toast.success("Deliverable approved");
                        } catch (err: any) {
                          toast.error(err?.message || "Could not approve");
                        }
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await reviewDeliverable(collab.id, d.id, "REVISION_REQUESTED");
                          toast("Revision requested");
                        } catch (err: any) {
                          toast.error(err?.message || "Could not request changes");
                        }
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
                          onClick={async () => {
                            try {
                              await submitDeliverable(collab.id, d.id, { note, link });
                              setOpen(null);
                              setNote("");
                              setLink("");
                              toast.success("Work submitted for review");
                            } catch (err: any) {
                              toast.error(err?.message || "Could not submit work");
                            }
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

        {role === "brand" ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-lg font-bold">Completion voucher</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              After deliverables are approved, generate a branded NepCollab voucher. Admin releases it
              to the creator — they can download, share to story, and redeem.
            </p>
            <div className="mt-3">
              <label className="text-[12px] font-medium" htmlFor="reward-label">
                Reward label
              </label>
              <Input
                id="reward-label"
                className="mt-1.5 h-11"
                value={rewardLabel}
                onChange={(e) => setRewardLabel(e.target.value)}
                placeholder="e.g. NPR 5,000 store credit"
              />
            </div>
            <Button
              type="button"
              className="mt-3 h-11 w-full rounded-full bg-signal text-signal-foreground hover:bg-signal/90"
              disabled={voucherBusy}
              onClick={async () => {
                setVoucherBusy(true);
                try {
                  const res = await brandCreateVoucher({
                    data: {
                      collaborationId: collab.id,
                      rewardLabel: rewardLabel.trim() || "Collaboration reward",
                    },
                  });
                  if (!res.success) toast.error(res.message);
                  else toast.success(res.message);
                } catch (err: any) {
                  toast.error(err?.message || "Could not create voucher");
                } finally {
                  setVoucherBusy(false);
                }
              }}
            >
              {voucherBusy ? "Creating…" : "Generate NepCollab voucher"}
            </Button>
            <Link
              to="/vouchers"
              className="mt-2 block text-center text-[13px] font-medium text-signal underline"
            >
              View vouchers
            </Link>
          </div>
        ) : null}

        {role === "creator" ? (
          <div className="mt-6">
            <Link to="/vouchers" className="text-[13px] font-medium text-signal underline">
              My vouchers & gift cards →
            </Link>
          </div>
        ) : null}
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
