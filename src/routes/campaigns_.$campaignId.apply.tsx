import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Gift, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { getBrand, getCreator } from "@/lib/lookup";
import { supabase } from "@/integrations/supabase/client";
import { toUserError } from "@/lib/user-error";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/campaigns_/$campaignId/apply")({
  head: () => ({
    meta: [
      { title: "Claim deal — NepCollab" },
      { name: "description", content: "Claim this free product deal in one tap." },
    ],
  }),
  component: ClaimPage,
});

function ClaimPage() {
  const { campaignId } = Route.useParams();
  const navigate = useNavigate();
  const { campaigns, applyToCampaign, currentCreatorId, loading, signedIn, role } = useStore();
  const fromStore = campaigns.find((c) => c.id === campaignId);
  const [fetched, setFetched] = useState<(typeof campaigns)[number] | null>(null);
  const [fetching, setFetching] = useState(false);
  const campaign = fromStore ?? fetched ?? undefined;
  const creator = getCreator(currentCreatorId);
  const brand = campaign ? getBrand(campaign.brandId) : undefined;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (fromStore || !campaignId) return;
    let cancelled = false;
    setFetching(true);
    void (async () => {
      const { data } = await (supabase as any)
        .from("campaigns")
        .select(
          "id, brand_id, title, description, status, platforms, deliverables, perks, location, remote, creator_reward, gift_value",
        )
        .eq("id", campaignId)
        .maybeSingle();
      if (!cancelled && data) {
        setFetched({
          id: data.id,
          brandId: data.brand_id,
          title: data.title,
          description: data.description || "",
          status: data.status,
          platforms: data.platforms || [],
          deliverables: data.deliverables || [],
          perks: data.perks || [],
          location: data.location,
          remote: data.remote,
          giftValue: data.creator_reward || data.gift_value,
        } as any);
      }
      if (!cancelled) setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId, fromStore]);

  if ((loading || fetching) && !campaign) {
    return (
      <Container className="py-16 text-center text-sm text-muted-foreground">Loading…</Container>
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
          title="Deal closed"
          body="This deal is not accepting claims right now."
          actionLabel="Browse deals"
          actionTo="/campaigns"
        />
      </Container>
    );
  }

  if (!campaign) {
    return (
      <Container>
        <EmptyState
          title="Deal not found"
          body="This deal is no longer available."
          actionLabel="Browse deals"
          actionTo="/campaigns"
        />
      </Container>
    );
  }

  const product =
    (campaign as any).benefit_title ||
    campaign.giftValue?.trim() ||
    (campaign.perks?.length ? campaign.perks[0] : null) ||
    "Free product";

  const contentHint =
    campaign.deliverables?.length
      ? campaign.deliverables
          .slice(0, 3)
          .map((d: any) => (typeof d === "string" ? d : d.title || d.contentType))
          .filter(Boolean)
          .join(" · ")
      : campaign.types?.join(" · ") || campaign.platforms?.join(" · ") || "Social content";

  if (!signedIn) {
    const next = `/campaigns/${campaignId}/apply`;
    return (
      <Container className="max-w-lg py-10">
        <button
          type="button"
          onClick={() => navigate({ to: "/campaigns/$campaignId", params: { campaignId } })}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="rounded-3xl border border-border bg-card p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-signal/12">
            <Lock className="size-5 text-signal" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">Sign in to claim</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a free creator account to claim <strong className="text-foreground">{campaign.title}</strong>.
          </p>
          <Button asChild size="lg" className="mt-6 h-12 w-full rounded-full">
            <Link to="/auth" search={{ next, intent: "creator" } as never}>
              Sign in
            </Link>
          </Button>
        </div>
      </Container>
    );
  }

  if (role === "brand") {
    return (
      <Container>
        <EmptyState
          title="Brands can't claim deals"
          body="Open your brand workspace to review claims."
          actionLabel="Brand deals"
          actionTo="/brand"
        />
      </Container>
    );
  }

  if (role === "admin") {
    return (
      <Container>
        <EmptyState title="Use a creator account" body="Admin accounts don't claim deals." actionLabel="Admin" actionTo="/admin" />
      </Container>
    );
  }

  const claim = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Minimal message from profile — no pitch form
      const autoNote = [
        creator?.name ? `Creator: ${creator.name}` : null,
        creator?.location ? `Location: ${creator.location}` : null,
        "Claimed via NepCollab deals.",
      ]
        .filter(Boolean)
        .join(" · ");
      await applyToCampaign({
        campaignId,
        message: autoNote || "I'd like to claim this deal.",
        contentIdea: "",
        availability: "",
      });
      toast.success("Deal claimed — track it under My Deals");
      navigate({ to: "/applications" });
    } catch (err: unknown) {
      toast.error(toUserError(err, "Could not claim this deal. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-md py-8">
      <button
        type="button"
        onClick={() => navigate({ to: "/campaigns/$campaignId", params: { campaignId } })}
        className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-signal/12">
          <Gift className="size-5 text-signal" />
        </div>
        <h1 className="mt-4 text-center font-display text-xl font-bold tracking-tight">
          Claim this deal?
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">{brand?.name || "Brand"}</p>

        <div className="mt-5 space-y-3 rounded-2xl bg-secondary/60 p-4 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Product
            </p>
            <p className="mt-0.5 font-semibold">{product}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              You&apos;ll create
            </p>
            <p className="mt-0.5 font-medium">{contentHint}</p>
          </div>
          {creator?.name ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Claiming as
              </p>
              <p className="mt-0.5 font-medium">
                {creator.name}
                {creator.location ? ` · ${creator.location}` : ""}
              </p>
            </div>
          ) : null}
        </div>

        <Button
          size="lg"
          className="mt-6 h-12 w-full rounded-full text-base font-bold"
          disabled={busy}
          onClick={() => void claim()}
        >
          {busy ? "Claiming…" : "CLAIM DEAL"}
        </Button>
        <p className="mt-3 text-center text-[12px] text-muted-foreground">
          The brand will review and approve. No long application.
        </p>
      </div>
    </Container>
  );
}
