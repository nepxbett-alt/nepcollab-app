import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { adminFetchListings, LISTING_STATUS, type BusinessListing } from "@/lib/listings";
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
  const [requests, setRequests] = useState<BusinessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"listings" | "requests">("listings");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [L, R] = await Promise.all([
          adminFetchListings(100).catch(() => [] as BusinessListing[]),
          fetchBusinessRequests(50).catch(() => [] as BusinessRequest[]),
        ]);
        setListings(L);
        setRequests(R);
      } catch (e: any) {
        toast.error(e?.message || "Could not load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pending = useMemo(
    () => listings.filter((l) => l.status === "pending").length,
    [listings],
  );
  const onHome = useMemo(
    () => listings.filter((l) => l.show_on_homepage && l.status === "listed").length,
    [listings],
  );

  return (
    <Container className="space-y-5 py-6">
      <div>
        <p className="type-kicker text-signal">Admin</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Control center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          List businesses on the homepage · assign influencers · close deals
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["Pending", pending],
          ["On homepage", onHome],
          ["Briefs", requests.filter((r) => r.status === "new").length],
        ].map(([label, n]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-3">
            <p className="font-display text-xl font-bold">{n}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("listings")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold",
            tab === "listings" ? "bg-ink text-ink-foreground" : "border border-border",
          )}
        >
          Business listings
        </button>
        <button
          type="button"
          onClick={() => setTab("requests")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold",
            tab === "requests" ? "bg-ink text-ink-foreground" : "border border-border",
          )}
        >
          Contact briefs
        </button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : tab === "listings" ? (
        listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listings yet.</p>
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
