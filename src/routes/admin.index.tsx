import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { adminFetchListings, LISTING_STATUS, type BusinessListing } from "@/lib/listings";
import {
  adminFetchCreators,
  adminUpdateCreator,
  CREATOR_STATUS,
  type CreatorRegistration,
} from "@/lib/creators-registry";
import { fetchBusinessRequests, STATUS_LABELS, type BusinessRequest } from "@/lib/business-requests";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <AdminGuard>
      <AdminHome />
    </AdminGuard>
  ),
});

function AdminHome() {
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [creators, setCreators] = useState<CreatorRegistration[]>([]);
  const [requests, setRequests] = useState<BusinessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"listings" | "creators" | "requests">("listings");
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [L, C, R] = await Promise.all([
        adminFetchListings(100).catch(() => [] as BusinessListing[]),
        adminFetchCreators(150).catch(() => [] as CreatorRegistration[]),
        fetchBusinessRequests(50).catch(() => [] as BusinessRequest[]),
      ]);
      setListings(L);
      setCreators(C);
      setRequests(R);
    } catch (e: any) {
      toast.error(e?.message || "Could not load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const stats = useMemo(
    () => ({
      pendingListings: listings.filter((l) => l.status === "pending").length,
      onHome: listings.filter((l) => l.show_on_homepage && l.status === "listed").length,
      pendingCreators: creators.filter((c) => c.status === "pending").length,
      activeCreators: creators.filter((c) => c.status === "active").length,
    }),
    [listings, creators],
  );

  const activate = async (id: string) => {
    setBusyId(id);
    try {
      await adminUpdateCreator(id, { status: "active" });
      toast.success("Creator activated — will receive business alerts");
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Container className="space-y-5 py-6">
      <div>
        <p className="type-kicker text-signal">Admin</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Control center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Listings · Creators · Matches · Notify
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Pending listings", stats.pendingListings],
          ["On homepage", stats.onHome],
          ["Pending creators", stats.pendingCreators],
          ["Active creators", stats.activeCreators],
        ].map(([label, n]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-3">
            <p className="font-display text-xl font-bold">{n}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["listings", "Businesses"],
            ["creators", "Creators"],
            ["requests", "Briefs"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              tab === id ? "bg-ink text-ink-foreground" : "border border-border",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : tab === "listings" ? (
        listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No business listings yet.</p>
        ) : (
          <ul className="space-y-2">
            {listings.map((l) => (
              <li key={l.id}>
                <Link
                  to="/admin/listings/$id"
                  params={{ id: l.id }}
                  className="tap block rounded-2xl border border-border bg-card p-4 hover:shadow-md"
                >
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold">{l.business_name}</p>
                    <span className="text-[11px] font-semibold">{LISTING_STATUS[l.status]}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {l.contact_name} · {l.email}
                    {l.show_on_homepage ? " · Homepage" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : tab === "creators" ? (
        creators.length === 0 ? (
          <p className="text-sm text-muted-foreground">No creator registrations yet.</p>
        ) : (
          <ul className="space-y-2">
            {creators.map((c) => (
              <li key={c.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{c.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {c.email}
                      {c.niche ? ` · ${c.niche}` : ""}
                      {c.platforms ? ` · ${c.platforms}` : ""}
                    </p>
                    <p className="text-[11px] mt-1 font-semibold">{CREATOR_STATUS[c.status]}</p>
                  </div>
                  {c.status === "pending" ? (
                    <Button
                      size="sm"
                      className="rounded-full shrink-0"
                      disabled={busyId === c.id}
                      onClick={() => void activate(c.id)}
                    >
                      Activate
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contact briefs.</p>
      ) : (
        <ul className="space-y-2">
          {requests.map((r) => (
            <li key={r.id}>
              <Link
                to="/admin/requests/$id"
                params={{ id: r.id }}
                className="tap block rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex justify-between gap-2">
                  <p className="font-semibold">{r.business_name}</p>
                  <span className="text-[11px] font-semibold">{STATUS_LABELS[r.status]}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.request_details}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
