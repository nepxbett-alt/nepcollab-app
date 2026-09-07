import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Building2 } from "lucide-react";
import { Container, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import {
  claimCreatorByEmail,
  CREATOR_STATUS,
  fetchCreatorAlerts,
  fetchMyCreatorRegistration,
  type CreatorAlert,
  type CreatorRegistration,
} from "@/lib/creators-registry";
import { fetchHomepageListings, type BusinessListing } from "@/lib/listings";

export const Route = createFileRoute("/creator/")({
  component: CreatorHome,
});

function CreatorHome() {
  const { signedIn, loading, role } = useStore();
  const [reg, setReg] = useState<CreatorRegistration | null>(null);
  const [alerts, setAlerts] = useState<CreatorAlert[]>([]);
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!signedIn) return;
    void (async () => {
      setBusy(true);
      try {
        await claimCreatorByEmail();
        const [r, a, L] = await Promise.all([
          fetchMyCreatorRegistration(),
          fetchCreatorAlerts(40),
          fetchHomepageListings(),
        ]);
        setReg(r);
        setAlerts(a);
        setListings(L);
      } catch (e: any) {
        toast.error(e?.message || "Could not load");
      } finally {
        setBusy(false);
      }
    })();
  }, [signedIn, loading]);

  if (loading || (signedIn && busy)) {
    return (
      <Container className="py-16 text-center text-sm text-muted-foreground">Loading…</Container>
    );
  }

  if (!signedIn) {
    return <Navigate to="/auth" search={{ next: "/creator" } as any} />;
  }

  if (role === "admin") {
    return <Navigate to="/admin" />;
  }

  return (
    <Container className="max-w-lg space-y-6 py-6">
      <PageHeader
        title="Creator space"
        subtitle="Alerts when businesses list. Login required — you’re signed in."
      />

      {!reg ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="font-display text-lg font-bold">No registration linked</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Register with the same email as this account so we can notify you.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/join-creator">Register as creator</Link>
          </Button>
        </div>
      ) : (
        <section className="rounded-3xl border border-border bg-card p-5 space-y-2">
          <div className="flex justify-between gap-2">
            <h2 className="font-display text-xl font-bold tracking-tight">{reg.full_name}</h2>
            <span className="text-[11px] font-semibold rounded-full bg-secondary px-2.5 py-1">
              {CREATOR_STATUS[reg.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {[reg.niche, reg.platforms, reg.followers_text, reg.location].filter(Boolean).join(" · ")}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {reg.notify_new_businesses
              ? "You’ll get alerts when businesses list on the homepage."
              : "Business alerts are off for your profile."}
          </p>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-signal" />
          <h2 className="font-display text-lg font-bold tracking-tight">Notifications</h2>
        </div>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border p-5">
            No alerts yet. When admin lists a business and notifies creators, it shows up here.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-semibold text-sm">{a.title}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{a.message}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-signal" />
          <h2 className="font-display text-lg font-bold tracking-tight">Businesses on homepage</h2>
        </div>
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public listings yet.</p>
        ) : (
          <ul className="space-y-2">
            {listings.slice(0, 12).map((b) => (
              <li key={b.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-semibold">{b.business_name}</p>
                <p className="text-[13px] text-muted-foreground">
                  {[b.category, b.location].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
