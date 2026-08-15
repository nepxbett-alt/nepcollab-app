import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatFollowers, getCreator } from "@/lib/lookup";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/campaigns/$campaignId/apply")({
  head: () => ({
    meta: [
      { title: "Apply to campaign — NepCollab" },
      {
        name: "description",
        content:
          "Send your application to this campaign. Your creator profile is attached automatically.",
      },
      { property: "og:title", content: "Apply to campaign — NepCollab" },
      {
        property: "og:description",
        content: "Add your idea and availability — the rest comes from your profile.",
      },
    ],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  const { campaignId } = Route.useParams();
  const navigate = useNavigate();
  const { campaigns, applyToCampaign, currentCreatorId } = useStore();
  const campaign = campaigns.find((c) => c.id === campaignId);
  const creator = getCreator(currentCreatorId);
  const [message, setMessage] = useState("");
  const [contentIdea, setContentIdea] = useState("");
  const [availability, setAvailability] = useState("");

  if (!campaign) {
    return (
      <Container>
        <EmptyState
          title="Campaign not found"
          body="This opportunity is no longer available."
          actionLabel="Browse campaigns"
          actionTo="/campaigns"
        />
      </Container>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 20) {
      toast.error("Tell the brand a little more — at least 20 characters.");
      return;
    }
    applyToCampaign({ campaignId, message, contentIdea, availability });
    toast.success("Application submitted");
    navigate({ to: "/applications" });
  };

  return (
    <Container className="max-w-2xl">
      <button
        type="button"
        onClick={() => navigate({ to: "/campaigns/$campaignId", params: { campaignId } })}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to campaign
      </button>

      <h1 className="text-xl font-bold">Apply to this campaign</h1>
      <p className="mt-1 text-sm text-muted-foreground">{campaign.title}</p>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <img
          src={creator?.avatar}
          alt={creator?.name}
          className="size-12 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold">
            {creator?.name}
            {creator?.verified ? (
              <BadgeCheck className="size-4 text-signal" />
            ) : null}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {creator?.location} ·{" "}
            {creator?.socials
              .map((s) => `${s.platform} ${formatFollowers(s.followers)}`)
              .join(" · ")}
          </p>
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
          Auto-attached
        </span>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div>
          <Label htmlFor="message">Why are you a good fit?</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="I'm a Pokhara-based food creator with an audience interested in local restaurants..."
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="idea">Your content idea (optional)</Label>
          <Textarea
            id="idea"
            value={contentIdea}
            onChange={(e) => setContentIdea(e.target.value)}
            rows={3}
            maxLength={600}
            placeholder="Slow-motion plating cuts intercut with first-bite reactions."
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="availability">Availability (optional)</Label>
          <Input
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            maxLength={120}
            placeholder="Any evening after Aug 28"
            className="mt-2"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full rounded-full bg-signal text-signal-foreground hover:bg-signal/90"
        >
          Submit application
        </Button>
      </form>
    </Container>
  );
}
