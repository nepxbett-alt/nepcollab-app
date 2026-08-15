import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Container, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  CAMPAIGN_TYPES,
  LOCATIONS,
  NICHES,
  PERK_OPTIONS,
  PLATFORMS,
  type Campaign,
  type Platform,
} from "@/data/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/brand/campaigns/new")({
  head: () => ({
    meta: [
      { title: "Create a campaign — NepCollab" },
      { name: "description", content: "Publish a collaboration opportunity in a guided eight-step wizard." },
      { property: "og:title", content: "Create a campaign — NepCollab" },
      { property: "og:description", content: "Describe the work, the perks and who you're looking for." },
    ],
  }),
  component: NewCampaign,
});

const STEPS = [
  "Basics",
  "What you need",
  "Who you want",
  "Perks & gifts",
  "Location & timeline",
  "Deliverables",
  "Review",
];

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
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    types: [] as string[],
    platforms: [] as Platform[],
    niches: [] as string[],
    minFollowers: "2000",
    perks: [] as string[],
    giftValue: "",
    location: "Kathmandu",
    remote: false,
    startDate: "",
    endDate: "",
    deadline: "",
    creatorsNeeded: "3",
    deliverables: "1 Instagram Reel\n2 Instagram Stories",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggle = (key: "types" | "platforms" | "niches" | "perks", value: string) =>
    setForm((f) => {
      const list = f[key] as string[];
      return {
        ...f,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });

  const publish = () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Add a title and description first.");
      setStep(0);
      return;
    }
    const campaign: Campaign = {
      id: `cm_${Math.random().toString(36).slice(2, 8)}`,
      title: form.title.trim(),
      brandId: currentBrandId,
      description: form.description.trim(),
      category: form.category || "General",
      types: form.types.length ? form.types : ["Instagram Reel"],
      platforms: form.platforms.length ? form.platforms : ["Instagram"],
      perks: form.perks.length ? form.perks : ["Free product"],
      giftValue: form.giftValue,
      location: form.location,
      remote: form.remote,
      startDate: form.startDate || "2026-09-01",
      endDate: form.endDate || "2026-09-30",
      deadline: form.deadline || "2026-08-30",
      creatorsNeeded: Number(form.creatorsNeeded) || 1,
      status: "APPLICATIONS_OPEN",
      cover: `https://picsum.photos/seed/${Math.random().toString(36).slice(2, 8)}/900/560`,
      requirements: {
        minFollowers: Number(form.minFollowers) || 0,
        niches: form.niches.length ? form.niches : ["Lifestyle"],
        languages: ["Nepali"],
        experience: "No minimum",
      },
      deliverables: form.deliverables
        .split("\n")
        .filter(Boolean)
        .map((line, i) => ({
          id: `nd${i}`,
          title: line.trim(),
          platform: (form.platforms[0] ?? "Instagram") as Platform,
          contentType: line.trim(),
          dueDate: form.endDate || "2026-09-30",
          instructions: "Follow the campaign brief and tag the brand.",
          status: "PENDING" as const,
        })),
      createdAt: new Date().toISOString().slice(0, 10),
      views: 0,
    };
    addCampaign(campaign);
    toast.success("Campaign published");
    navigate({ to: "/brand/campaigns" });
  };

  return (
    <Container className="max-w-2xl">
      <PageHeader title="Create campaign" subtitle={`Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`} />
      <Progress value={((step + 1) / STEPS.length) * 100} className="mb-8" />

      <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
        {step === 0 ? (
          <>
            <div>
              <Label htmlFor="title">Campaign title</Label>
              <Input id="title" className="mt-2" maxLength={120} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Food Creator Collaboration — Pokhara" />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" className="mt-2" rows={5} maxLength={1500} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="We're launching our new menu and looking for local food creators." />
            </div>
            <div>
              <Label htmlFor="cat">Category</Label>
              <Input id="cat" className="mt-2" maxLength={60} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Food & Beverage" />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div>
              <p className="mb-2 text-sm font-medium">Content types</p>
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_TYPES.map((t) => (
                  <Toggle key={t} label={t} active={form.types.includes(t)} onClick={() => toggle("types", t)} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Platforms</p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <Toggle key={p} label={p} active={form.platforms.includes(p)} onClick={() => toggle("platforms", p)} />
                ))}
              </div>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div>
              <p className="mb-2 text-sm font-medium">Niches</p>
              <div className="flex flex-wrap gap-2">
                {NICHES.map((n) => (
                  <Toggle key={n} label={n} active={form.niches.includes(n)} onClick={() => toggle("niches", n)} />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="followers">Minimum followers (0 for no minimum)</Label>
              <Input id="followers" className="mt-2" type="number" min={0} value={form.minFollowers} onChange={(e) => set("minFollowers", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="needed">Creators needed</Label>
              <Input id="needed" className="mt-2" type="number" min={1} value={form.creatorsNeeded} onChange={(e) => set("creatorsNeeded", e.target.value)} />
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div>
              <p className="mb-2 text-sm font-medium">Perks offered</p>
              <div className="flex flex-wrap gap-2">
                {PERK_OPTIONS.map((p) => (
                  <Toggle key={p} label={p} active={form.perks.includes(p)} onClick={() => toggle("perks", p)} />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="gift">Gift / reward details</Label>
              <Input id="gift" className="mt-2" maxLength={200} value={form.giftValue} onChange={(e) => set("giftValue", e.target.value)} placeholder="Free dinner for two + Rs. 2,000 voucher" />
            </div>
            <p className="text-xs text-muted-foreground">
              NepCollab never processes payments — these terms are arranged directly with the creator.
            </p>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <div>
              <p className="mb-2 text-sm font-medium">Location</p>
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.map((l) => (
                  <Toggle key={l} label={l} active={form.location === l} onClick={() => set("location", l)} />
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.remote} onChange={(e) => set("remote", e.target.checked)} />
              This campaign can be done remotely
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="start">Start</Label>
                <Input id="start" className="mt-2" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="end">End</Label>
                <Input id="end" className="mt-2" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="deadline">Apply by</Label>
                <Input id="deadline" className="mt-2" type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
              </div>
            </div>
          </>
        ) : null}

        {step === 5 ? (
          <div>
            <Label htmlFor="deliverables">Deliverables (one per line)</Label>
            <Textarea id="deliverables" className="mt-2" rows={6} maxLength={800} value={form.deliverables} onChange={(e) => set("deliverables", e.target.value)} />
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-2 text-sm">
            <h3 className="text-lg font-bold">{form.title || "Untitled campaign"}</h3>
            <p className="text-muted-foreground">{form.description || "No description yet."}</p>
            <p><span className="text-muted-foreground">Types:</span> {form.types.join(", ") || "—"}</p>
            <p><span className="text-muted-foreground">Perks:</span> {form.perks.join(", ") || "—"}</p>
            <p><span className="text-muted-foreground">Location:</span> {form.remote ? "Remote" : form.location}</p>
            <p><span className="text-muted-foreground">Creators:</span> {form.creatorsNeeded}</p>
            <p><span className="text-muted-foreground">Apply by:</span> {form.deadline || "—"}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <Button variant="outline" className="rounded-full" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="rounded-full" onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button className="rounded-full bg-signal text-signal-foreground hover:bg-signal/90" onClick={publish}>
            Publish campaign
          </Button>
        )}
      </div>
    </Container>
  );
}
