import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatFollowers, getCreator } from "@/lib/lookup";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/campaigns_/$campaignId/apply")({
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
  const { campaigns, applyToCampaign, currentCreatorId, loading, signedIn, role } = useStore();
  const fromStore = campaigns.find((c) => c.id === campaignId);
  const [fetched, setFetched] = useState<{ id: string; title: string; status?: string } | null>(null);
  const [fetching, setFetching] = useState(false);
  const campaign = fromStore ?? (fetched ? ({ id: fetched.id, title: fetched.title, status: fetched.status } as (typeof campaigns)[number]) : undefined);
  const creator = getCreator(currentCreatorId);
  const [message, setMessage] = useState("");
  const [contentIdea, setContentIdea] = useState("");
  const [availability, setAvailability] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (fromStore || !campaignId) return;
    let cancelled = false;
    setFetching(true);
    void (async () => {
      const { data } = await (supabase as any)
        .from("campaigns")
        .select("id, title, status")
        .eq("id", campaignId)
        .maybeSingle();
      if (!cancelled && data) {
        setFetched({ id: data.id, title: data.title, status: data.status });
      }
      if (!cancelled) setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId, fromStore]);

  if ((loading || fetching) && !campaign) {
    return (
      <Container className="py-16 text-center text-sm text-muted-foreground">
        Loading…
      </Container>
    );
  }

  const statusKey = String(campaign?.status ?? "").toUpperCase().replace(/\s+/g, "_");
  const isOpen =
    !campaign?.status ||
    ["APPLICATIONS_OPEN", "ACTIVE", "PUBLISHED", "OPEN"].includes(statusKey);
  if (campaign && campaign.status && !isOpen) {
    return (
      <Container>
        <EmptyState
          title="Applications closed"
          body="This campaign is not accepting applications right now."
          actionLabel="Browse campaigns"
          actionTo="/campaigns"
        />
      </Container>
    );
  }

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

  // Guests can browse campaigns freely; applying requires a verified account.
  if (!signedIn) {
    const next = `/campaigns/${campaignId}/apply`;
    return (
      <Container className="max-w-lg py-10">
        <button
          type="button"
          onClick={() => navigate({ to: "/campaigns/$campaignId", params: { campaignId } })}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to campaign
        </button>
        <div className="rounded-3xl border border-border bg-card p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-signal/12">
            <Lock className="size-5 text-signal" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">Create an account to apply</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You can browse every open campaign without signing in. To apply to{" "}
            <strong className="text-foreground">{campaign.title}</strong>, create a creator account and
            verify your email.
          </p>
          <Button asChild size="lg" className="mt-6 h-11 w-full rounded-full">
            <Link to="/auth" search={{ next } as never}>
              Sign in / create account
            </Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
            <Link to="/campaigns">Keep browsing campaigns</Link>
          </Button>
        </div>
      </Container>
    );
  }

  if (role === "brand") {
    return (
      <Container>
        <EmptyState
          title="Brands can't apply"
          body="Switch to a creator account to apply to campaigns."
          actionLabel="Browse campaigns"
          actionTo="/campaigns"
        />
      </Container>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (message.trim().length < 20) {
      toast.error("Tell the brand a little more — at least 20 characters.");
      return;
    }
    setBusy(true);
    try {
      await applyToCampaign({ campaignId, message, contentIdea, availability });
      toast.success("Application submitted — track status under Applications");
      navigate({ to: "/applications" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not submit application";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
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
            {creator?.verified ? <BadgeCheck className="size-4 text-signal" /> : null}
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

      <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-5">
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
          disabled={busy}
          className="w-full rounded-full bg-signal text-signal-foreground hover:bg-signal/90"
        >
          {busy ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </Container>
  );
}
