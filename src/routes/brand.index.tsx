import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Container, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import {
  ASSIGNMENT_STATUS,
  brandSelectAssignment,
  claimListingByEmail,
  closeDeal,
  fetchAssignments,
  fetchDealsForListing,
  fetchMyListings,
  LISTING_STATUS,
  type BusinessDeal,
  type BusinessListing,
  type DealAssignment,
} from "@/lib/listings";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/brand/")({
  component: BrandHome,
});

function BrandHome() {
  const { signedIn, loading, role } = useStore();
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!signedIn) return;
    void (async () => {
      setBusy(true);
      try {
        await claimListingByEmail();
        setListings(await fetchMyListings());
      } catch (e: any) {
        toast.error(e?.message || "Could not load");
      } finally {
        setBusy(false);
      }
    })();
  }, [signedIn, loading]);

  if (loading || busy) {
    return (
      <Container className="py-16 text-center text-sm text-muted-foreground">Loading…</Container>
    );
  }

  if (!signedIn) {
    return <Navigate to="/auth" search={{ next: "/brand" } as any} />;
  }

  if (role === "admin") {
    return <Navigate to="/admin" />;
  }

  return (
    <Container className="max-w-lg space-y-6 py-6">
      <PageHeader
        title="Business workspace"
        subtitle="Your listings, matches, and deals. Admin assigns influencers; you select and close."
      />

      {listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="font-display text-lg font-bold">No listing linked yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit a listing with the same email as this Google account, or wait for admin to link you.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/list-business">List my business</Link>
          </Button>
        </div>
      ) : (
        listings.map((L) => <ListingBlock key={L.id} listing={L} />)
      )}
    </Container>
  );
}

function ListingBlock({ listing }: { listing: BusinessListing }) {
  const [deals, setDeals] = useState<BusinessDeal[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        setDeals(await fetchDealsForListing(listing.id));
      } catch {
        setDeals([]);
      }
    })();
  }, [listing.id]);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">{listing.business_name}</h2>
          <p className="text-sm text-muted-foreground">
            {[listing.category, listing.location].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            listing.show_on_homepage && listing.status === "listed"
              ? "bg-success/15 text-success"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {LISTING_STATUS[listing.status]}
          {listing.show_on_homepage && listing.status === "listed" ? " · Homepage" : ""}
        </span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">{listing.description}</p>

      {deals.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          No deals yet. Admin will create a deal and assign influencer matches here.
        </p>
      ) : (
        deals.map((d) => <DealBlock key={d.id} deal={d} />)
      )}
    </section>
  );
}

function DealBlock({ deal }: { deal: BusinessDeal }) {
  const [items, setItems] = useState<DealAssignment[]>([]);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    try {
      setItems(await fetchAssignments(deal.id));
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    void reload();
  }, [deal.id]);

  const onSelect = async (id: string, selected: boolean) => {
    setBusy(true);
    try {
      await brandSelectAssignment(id, selected);
      toast.success(selected ? "Selected — admin will notify the influencer" : "Declined");
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Could not update");
    } finally {
      setBusy(false);
    }
  };

  const onClose = async () => {
    setBusy(true);
    try {
      await closeDeal(deal.id);
      toast.success("Deal closed with admin");
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message || "Could not close");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
      <div className="flex justify-between gap-2">
        <p className="font-semibold">{deal.title}</p>
        <span className="text-[11px] font-semibold uppercase text-muted-foreground">{deal.status}</span>
      </div>
      {deal.brief ? <p className="text-sm text-muted-foreground">{deal.brief}</p> : null}

      <p className="text-[11px] font-bold uppercase tracking-wide text-signal">Influencer matches</p>
      {items.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Waiting for admin to assign matches.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.id} className="rounded-xl border border-border p-3">
              <p className="font-medium">
                {a.influencer_name}
                {a.influencer_handle ? ` · ${a.influencer_handle}` : ""}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {[a.platform, a.followers_text, a.niche].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1 text-[11px] font-semibold">{ASSIGNMENT_STATUS[a.status]}</p>
              {a.status === "proposed" && deal.status !== "closed" ? (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" disabled={busy} className="rounded-full" onClick={() => void onSelect(a.id, true)}>
                    Select
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    className="rounded-full"
                    onClick={() => void onSelect(a.id, false)}
                  >
                    Decline
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {deal.status !== "closed" ? (
        <Button variant="outline" disabled={busy} className="h-10 w-full rounded-full" onClick={() => void onClose()}>
          Close deal with admin
        </Button>
      ) : (
        <p className="text-[12px] text-success font-semibold">Deal closed</p>
      )}
    </div>
  );
}
