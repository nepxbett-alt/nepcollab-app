import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BrandGuard } from "@/components/BrandGuard";
import { Container, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Campaign, Platform } from "@/data/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toUserError } from "@/lib/user-error";

export const Route = createFileRoute("/brand/campaigns/new")({
  head: () => ({
    meta: [
      { title: "Create campaign — NepCollab" },
      { name: "description", content: "Publish a campaign in under a minute." },
    ],
  }),
  component: () => (
    <BrandGuard>
      <NewCampaign />
    </BrandGuard>
  ),
});

function Toggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-ink bg-ink text-ink-foreground" : "border-border bg-card text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}

function NewCampaign() {
  const navigate = useNavigate();
  const { addCampaign, currentBrandId } = useStore();
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [contentType, setContentType] = useState("Instagram Reel");
  const [paymentModel, setPaymentModel] = useState<"fixed" | "performance">("fixed");
  const [fixedAmount, setFixedAmount] = useState("5000");
  const [ratePer1000, setRatePer1000] = useState("100");
  const [maximumPayout, setMaximumPayout] = useState("20000");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("Kathmandu");
  const [remote, setRemote] = useState(true);

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!title.trim()) {
      toast.error("Add a campaign title.");
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      toast.error("Add a short brief (at least a couple of sentences).");
      return;
    }
    if (paymentModel === "fixed") {
      const amt = Number(fixedAmount);
      if (!Number.isFinite(amt) || amt <= 0) {
        toast.error("Enter a fixed payout greater than zero.");
        return;
      }
    } else {
      const rate = Number(ratePer1000);
      if (!Number.isFinite(rate) || rate <= 0) {
        toast.error("Enter Rs. per 1,000 views greater than zero.");
        return;
      }
    }

    setBusy(true);
    try {
      const campaign = {
        id: crypto.randomUUID(),
        title: title.trim(),
        brandId: currentBrandId || "",
        description: description.trim(),
        category: "General",
        types: [contentType],
        platforms: [platform],
        perks: [],
        paymentModel,
        fixedAmount: paymentModel === "fixed" ? Number(fixedAmount) || 0 : null,
        ratePer1000Views: paymentModel === "performance" ? Number(ratePer1000) || 0 : null,
        maximumPayout: paymentModel === "performance" ? Number(maximumPayout) || null : null,
        milestones: [],
        location: location.trim() || "Kathmandu",
        remote,
        startDate: "",
        endDate: "",
        deadline: deadline || "",
        creatorsNeeded: 3,
        status: "APPLICATIONS_OPEN",
        cover: "/app-icon.png",
        requirements: {
          minFollowers: 0,
          niches: [],
          languages: [],
          experience: "",
        },
        deliverables: [
          {
            id: crypto.randomUUID(),
            title: contentType,
            platform,
            contentType,
            dueDate: deadline || "",
            instructions: description.trim().slice(0, 200),
            status: "PENDING",
          },
        ],
        createdAt: new Date().toISOString(),
        views: 0,
        giftValue:
          paymentModel === "fixed"
            ? `Rs. ${Number(fixedAmount).toLocaleString("en-NP")} fixed`
            : `Rs. ${Number(ratePer1000).toLocaleString("en-NP")} / 1K views`,
      } as Campaign;

      await addCampaign(campaign);
      toast.success("Campaign published");
      navigate({ to: "/brand/campaigns" });
    } catch (err: unknown) {
      toast.error(toUserError(err, "Could not publish campaign."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-lg py-6">
      <PageHeader title="Create campaign" subtitle="One short form. Publish when ready." />
      <form onSubmit={(e) => void publish(e)} className="mt-6 space-y-5">
        <div>
          <Label htmlFor="c-title">Title</Label>
          <Input
            id="c-title"
            className="mt-1.5 h-11"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summer reel collab"
            maxLength={120}
            required
          />
        </div>
        <div>
          <Label htmlFor="c-desc">What creators should do</Label>
          <Textarea
            id="c-desc"
            className="mt-1.5 min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Create a short reel showing the product in daily life. Keep it natural — not a hard sell."
            maxLength={1500}
            required
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Platform</p>
          <div className="flex flex-wrap gap-2">
            {(["Instagram", "TikTok", "YouTube", "Facebook"] as Platform[]).map((p) => (
              <Toggle key={p} label={p} active={platform === p} onClick={() => setPlatform(p)} />
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="c-type">Content type</Label>
          <Input
            id="c-type"
            className="mt-1.5 h-11"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            placeholder="Instagram Reel"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Payout</p>
          <div className="flex flex-wrap gap-2">
            <Toggle
              label="Fixed amount"
              active={paymentModel === "fixed"}
              onClick={() => setPaymentModel("fixed")}
            />
            <Toggle
              label="Per views"
              active={paymentModel === "performance"}
              onClick={() => setPaymentModel("performance")}
            />
          </div>
          {paymentModel === "fixed" ? (
            <div className="mt-3">
              <Label htmlFor="c-fixed">Amount (Rs.)</Label>
              <Input
                id="c-fixed"
                className="mt-1.5 h-11"
                inputMode="numeric"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
              />
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="c-rate">Rs. per 1,000 views</Label>
                <Input
                  id="c-rate"
                  className="mt-1.5 h-11"
                  inputMode="numeric"
                  value={ratePer1000}
                  onChange={(e) => setRatePer1000(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="c-max">Max payout (Rs.)</Label>
                <Input
                  id="c-max"
                  className="mt-1.5 h-11"
                  inputMode="numeric"
                  value={maximumPayout}
                  onChange={(e) => setMaximumPayout(e.target.value)}
                />
              </div>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            NepCollab records the payout. You pay the creator after verification (eSewa, bank, etc.).
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="c-loc">Location</Label>
            <Input
              id="c-loc"
              className="mt-1.5 h-11"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="c-deadline">Apply by (optional)</Label>
            <Input
              id="c-deadline"
              className="mt-1.5 h-11"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} />
          Remote OK
        </label>
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base">
          {busy ? "Publishing…" : "Publish campaign"}
        </Button>
      </form>
    </Container>
  );
}
