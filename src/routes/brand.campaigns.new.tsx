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
      { title: "Post a deal — NepCollab" },
      {
        name: "description",
        content: "Offer a voucher or PR package. No cash on the platform.",
      },
    ],
  }),
  component: () => (
    <BrandGuard>
      <NewCampaign />
    </BrandGuard>
  ),
});

const OFFER_TYPES = [
  { id: "voucher", label: "Voucher / store credit", example: "NPR 3,000 store voucher" },
  { id: "product", label: "Product / PR package", example: "Full product kit + unboxing" },
  { id: "experience", label: "Experience / stay / meal", example: "Dinner for two" },
  { id: "other", label: "Other non-cash", example: "Event pass + merch" },
] as const;

function Chip({
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
  const [offerType, setOfferType] = useState<(typeof OFFER_TYPES)[number]["id"]>("voucher");
  const [offerTitle, setOfferTitle] = useState("");
  const [offerValue, setOfferValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("Kathmandu");
  const [remote, setRemote] = useState(true);

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!title.trim()) {
      toast.error("Add a short campaign title.");
      return;
    }
    if (!description.trim() || description.trim().length < 16) {
      toast.error("Add a brief: what should the creator post?");
      return;
    }
    if (!offerTitle.trim()) {
      toast.error("Describe the voucher or PR package you are offering.");
      return;
    }

    setBusy(true);
    try {
      const offerMeta = OFFER_TYPES.find((o) => o.id === offerType);
      const campaign = {
        id: crypto.randomUUID(),
        title: title.trim(),
        brandId: currentBrandId || "",
        description: description.trim(),
        category: "General",
        types: [contentType],
        platforms: [platform],
        perks: [offerTitle.trim()],
        benefit_type: offerType === "voucher" ? "other" : offerType,
        benefit_title: offerTitle.trim(),
        benefit_value_display: offerValue.trim() || null,
        redemption_method: "manual",
        paymentModel: "fixed" as const,
        fixedAmount: null,
        ratePer1000Views: null,
        maximumPayout: null,
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
            instructions: description.trim().slice(0, 240),
            status: "PENDING",
          },
        ],
        createdAt: new Date().toISOString(),
        views: 0,
        giftValue: offerValue.trim()
          ? `${offerTitle.trim()} · ${offerValue.trim()}`
          : offerTitle.trim(),
      } as Campaign & Record<string, unknown>;

      await addCampaign(campaign as Campaign);
      toast.success("Deal posted — creators can apply");
      navigate({ to: "/brand/campaigns" });
    } catch (err: unknown) {
      toast.error(toUserError(err, "Could not publish. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-lg py-6">
      <PageHeader
        title="Post a deal"
        subtitle="Voucher or PR package only — NepCollab does not process cash."
      />
      <form onSubmit={(e) => void publish(e)} className="mt-6 space-y-5">
        <div>
          <Label htmlFor="c-title">Title</Label>
          <Input
            id="c-title"
            className="mt-1.5 h-11"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Monsoon menu reel"
            maxLength={100}
            required
          />
        </div>
        <div>
          <Label htmlFor="c-desc">What should creators post?</Label>
          <Textarea
            id="c-desc"
            className="mt-1.5 min-h-[96px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One natural Reel tasting our new set menu. Keep it real — not a hard sell."
            maxLength={1200}
            required
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Platform</p>
          <div className="flex flex-wrap gap-2">
            {(["Instagram", "TikTok", "YouTube", "Facebook"] as Platform[]).map((p) => (
              <Chip key={p} label={p} active={platform === p} onClick={() => setPlatform(p)} />
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="c-type">Content</Label>
          <Input
            id="c-type"
            className="mt-1.5 h-11"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            placeholder="Instagram Reel"
          />
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">What you offer (non-cash)</p>
          <p className="text-[12px] text-muted-foreground">
            No cash payouts on NepCollab. Offer a voucher, product kit, meal, stay, or PR package.
          </p>
          <div className="flex flex-wrap gap-2">
            {OFFER_TYPES.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                active={offerType === o.id}
                onClick={() => {
                  setOfferType(o.id);
                  if (!offerTitle) setOfferTitle(o.example);
                }}
              />
            ))}
          </div>
          <div>
            <Label htmlFor="c-offer">Offer title</Label>
            <Input
              id="c-offer"
              className="mt-1.5 h-11"
              value={offerTitle}
              onChange={(e) => setOfferTitle(e.target.value)}
              placeholder={OFFER_TYPES.find((o) => o.id === offerType)?.example}
              required
            />
          </div>
          <div>
            <Label htmlFor="c-value">Display value (optional)</Label>
            <Input
              id="c-value"
              className="mt-1.5 h-11"
              value={offerValue}
              onChange={(e) => setOfferValue(e.target.value)}
              placeholder="e.g. Worth NPR 3,000 — not transferable cash"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="c-loc">City</Label>
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
          Remote creators OK
        </label>

        <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base">
          {busy ? "Publishing…" : "Post deal"}
        </Button>
      </form>
    </Container>
  );
}
