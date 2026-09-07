import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminAssignInfluencer,
  adminCreateDeal,
  adminFetchListing,
  adminNotifyInfluencer,
  adminUpdateListing,
  ASSIGNMENT_STATUS,
  fetchAssignments,
  fetchDealsForListing,
  LISTING_STATUS,
  type BusinessDeal,
  type BusinessListing,
  type DealAssignment,
} from "@/lib/listings";
import { adminNotifyCreatorsAboutListing } from "@/lib/creators-registry";

export const Route = createFileRoute("/admin/listings/$id")({
  component: () => (
    <AdminGuard>
      <ListingAdmin />
    </AdminGuard>
  ),
});

function ListingAdmin() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<BusinessListing | null>(null);
  const [deals, setDeals] = useState<BusinessDeal[]>([]);
  const [busy, setBusy] = useState(false);
  const [dealTitle, setDealTitle] = useState("Creator collaboration");
  const [dealBrief, setDealBrief] = useState("");
  const [inf, setInf] = useState({
    name: "",
    handle: "",
    platform: "Instagram",
    followers: "",
    niche: "",
    phone: "",
    email: "",
    note: "",
  });
  const [activeDeal, setActiveDeal] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<DealAssignment[]>([]);

  const reload = async () => {
    const L = await adminFetchListing(id);
    setRow(L);
    const D = await fetchDealsForListing(id);
    setDeals(D);
    if (D[0]) {
      setActiveDeal(D[0].id);
      setAssignments(await fetchAssignments(D[0].id));
    }
  };

  useEffect(() => {
    void reload().catch((e) => toast.error(e?.message || "Load failed"));
  }, [id]);

  useEffect(() => {
    if (!activeDeal) return;
    void fetchAssignments(activeDeal).then(setAssignments).catch(() => setAssignments([]));
  }, [activeDeal]);

  if (!row) {
    return <Container className="py-16 text-center text-sm text-muted-foreground">Loading…</Container>;
  }

  const publish = async () => {
    setBusy(true);
    try {
      await adminUpdateListing(id, { status: "listed", show_on_homepage: true });
      toast.success("Listed on homepage");
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const feature = async () => {
    setBusy(true);
    try {
      await adminUpdateListing(id, { featured: !row.featured, status: "listed", show_on_homepage: true });
      toast.success(row.featured ? "Unfeatured" : "Featured");
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const pause = async () => {
    setBusy(true);
    try {
      await adminUpdateListing(id, { status: "paused", show_on_homepage: false });
      toast.success("Removed from homepage");
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const createDeal = async () => {
    setBusy(true);
    try {
      const dealId = await adminCreateDeal({
        listing_id: id,
        brand_user_id: row.owner_id,
        title: dealTitle || "Creator collaboration",
        brief: dealBrief,
      });
      toast.success("Deal created");
      setActiveDeal(dealId);
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const assign = async () => {
    if (!activeDeal) {
      toast.error("Create a deal first");
      return;
    }
    if (!inf.name.trim()) {
      toast.error("Influencer name required");
      return;
    }
    setBusy(true);
    try {
      await adminAssignInfluencer({
        deal_id: activeDeal,
        influencer_name: inf.name,
        influencer_handle: inf.handle,
        platform: inf.platform,
        followers_text: inf.followers,
        niche: inf.niche,
        contact_phone: inf.phone,
        contact_email: inf.email,
        admin_note: inf.note,
      });
      toast.success("Influencer assigned — brand can select in their workspace");
      setInf({ name: "", handle: "", platform: "Instagram", followers: "", niche: "", phone: "", email: "", note: "" });
      setAssignments(await fetchAssignments(activeDeal));
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const notify = async (assignmentId: string) => {
    setBusy(true);
    try {
      await adminNotifyInfluencer(assignmentId);
      toast.success("Marked as influencer notified");
      if (activeDeal) setAssignments(await fetchAssignments(activeDeal));
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-lg space-y-5 py-6">
      <button
        type="button"
        onClick={() => navigate({ to: "/admin" })}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Admin
      </button>

      <div>
        <p className="text-[11px] font-bold uppercase text-signal">{LISTING_STATUS[row.status]}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{row.business_name}</h1>
        <p className="text-sm text-muted-foreground">
          {[row.category, row.location].filter(Boolean).join(" · ")}
        </p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-4 space-y-2">
        <p className="text-sm font-medium">{row.contact_name}</p>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${row.phone.replace(/\s/g, "")}`} className="tap inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold">
            <Phone className="size-4 text-signal" /> Call
          </a>
          <a href={`mailto:${row.email}`} className="tap inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold">
            <Mail className="size-4 text-signal" /> Email
          </a>
        </div>
        <p className="text-[12px] text-muted-foreground break-all">{row.phone} · {row.email}</p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{row.description}</p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 space-y-2">
        <h2 className="text-sm font-bold">Homepage</h2>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} className="rounded-full" onClick={() => void publish()}>
            Show on homepage
          </Button>
          <Button disabled={busy} variant="outline" className="rounded-full" onClick={() => void feature()}>
            {row.featured ? "Unfeature" : "Feature"}
          </Button>
          <Button disabled={busy} variant="outline" className="rounded-full" onClick={() => void pause()}>
            Remove from homepage
          </Button>
          <Button
            disabled={busy}
            variant="outline"
            className="rounded-full"
            onClick={() =>
              void (async () => {
                setBusy(true);
                try {
                  await adminUpdateListing(id, { status: "listed", show_on_homepage: true });
                  await adminNotifyCreatorsAboutListing({
                    listing_id: id,
                    business_name: row.business_name,
                    category: row.category,
                    location: row.location,
                  });
                  toast.success("On homepage + creators notified");
                  await reload();
                } catch (e: any) {
                  toast.error(e?.message || "Failed");
                } finally {
                  setBusy(false);
                }
              })()
            }
          >
            Publish & notify creators
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-bold">Deal</h2>
        {deals.length > 0 ? (
          <select
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={activeDeal || ""}
            onChange={(e) => setActiveDeal(e.target.value)}
          >
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} ({d.status})
              </option>
            ))}
          </select>
        ) : null}
        <Label>New deal title</Label>
        <Input className="h-11" value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} />
        <Textarea className="min-h-[70px]" placeholder="Brief (optional)" value={dealBrief} onChange={(e) => setDealBrief(e.target.value)} />
        <Button disabled={busy} className="h-11 w-full rounded-full" onClick={() => void createDeal()}>
          Create deal
        </Button>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-bold">Assign influencer</h2>
        <Input className="h-11" placeholder="Name *" value={inf.name} onChange={(e) => setInf({ ...inf, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Input className="h-11" placeholder="Handle" value={inf.handle} onChange={(e) => setInf({ ...inf, handle: e.target.value })} />
          <Input className="h-11" placeholder="Platform" value={inf.platform} onChange={(e) => setInf({ ...inf, platform: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input className="h-11" placeholder="Followers" value={inf.followers} onChange={(e) => setInf({ ...inf, followers: e.target.value })} />
          <Input className="h-11" placeholder="Niche" value={inf.niche} onChange={(e) => setInf({ ...inf, niche: e.target.value })} />
        </div>
        <Input className="h-11" placeholder="Phone" value={inf.phone} onChange={(e) => setInf({ ...inf, phone: e.target.value })} />
        <Input className="h-11" placeholder="Email" value={inf.email} onChange={(e) => setInf({ ...inf, email: e.target.value })} />
        <Textarea placeholder="Internal note" value={inf.note} onChange={(e) => setInf({ ...inf, note: e.target.value })} />
        <Button disabled={busy} className="h-11 w-full rounded-full" onClick={() => void assign()}>
          Assign to brand
        </Button>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 space-y-2">
        <h2 className="text-sm font-bold">Assignments</h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet.</p>
        ) : (
          assignments.map((a) => (
            <div key={a.id} className="rounded-xl border border-border p-3">
              <p className="font-medium">
                {a.influencer_name} {a.influencer_handle ? `· ${a.influencer_handle}` : ""}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {[a.platform, a.followers_text, a.niche].filter(Boolean).join(" · ")}
              </p>
              <p className="text-[11px] font-semibold mt-1">{ASSIGNMENT_STATUS[a.status]}</p>
              {(a.status === "brand_selected" || a.status === "proposed") && (
                <Button
                  size="sm"
                  disabled={busy}
                  className="mt-2 rounded-full"
                  onClick={() => void notify(a.id)}
                >
                  Mark influencer notified
                </Button>
              )}
            </div>
          ))
        )}
      </section>
    </Container>
  );
}
