import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  fetchBusinessRequest,
  updateBusinessRequest,
  STATUS_LABELS,
  type BusinessRequest,
  type RequestStatus,
} from "@/lib/business-requests";

export const Route = createFileRoute("/admin/requests/$id")({
  component: () => (
    <AdminGuard>
      <RequestDetail />
    </AdminGuard>
  ),
});

const STATUSES: RequestStatus[] = [
  "new",
  "contacted",
  "in_progress",
  "matched",
  "completed",
  "closed",
];

function RequestDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<BusinessRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchBusinessRequest(id);
        if (!cancelled) {
          setRow(data);
          setNotes(data?.admin_notes || "");
          setNextAction(data?.next_action || "");
        }
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || "Could not load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const save = async (patch: { status?: RequestStatus; admin_notes?: string; next_action?: string }) => {
    if (busy) return;
    setBusy(true);
    try {
      await updateBusinessRequest(id, patch);
      toast.success("Saved");
      const data = await fetchBusinessRequest(id);
      setRow(data);
      if (data) {
        setNotes(data.admin_notes || "");
        setNextAction(data.next_action || "");
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not save");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Container className="py-16 text-center text-sm text-muted-foreground">Loading…</Container>;
  }
  if (!row) {
    return (
      <Container className="py-10 text-center">
        <p className="text-sm text-muted-foreground">Request not found.</p>
        <Button asChild className="mt-4 rounded-full">
          <Link to="/admin">Back</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container className="max-w-lg space-y-5 py-6">
      <button
        type="button"
        onClick={() => navigate({ to: "/admin" })}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All requests
      </button>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-signal">
          {STATUS_LABELS[row.status]}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{row.business_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {row.category || "General"}
          {row.location ? ` · ${row.location}` : ""}
        </p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-bold">Contact</h2>
        <p className="text-sm font-medium">{row.contact_name}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`tel:${row.phone.replace(/\s/g, "")}`}
            className="tap inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold"
          >
            <Phone className="size-4 text-signal" /> Call
          </a>
          <a
            href={`mailto:${row.email}`}
            className="tap inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold"
          >
            <Mail className="size-4 text-signal" /> Email
          </a>
        </div>
        <p className="text-[12px] text-muted-foreground break-all">{row.phone} · {row.email}</p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 space-y-2">
        <h2 className="text-sm font-bold">Request</h2>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{row.request_details}</p>
        {(row.budget || row.timeline || row.preferred_niche) && (
          <ul className="mt-2 space-y-1 text-[13px] text-muted-foreground">
            {row.budget ? <li>Budget: {row.budget}</li> : null}
            {row.timeline ? <li>Timeline: {row.timeline}</li> : null}
            {row.preferred_niche ? <li>Preferred: {row.preferred_niche}</li> : null}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-bold">Status</h2>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={row.status === s ? "default" : "outline"}
              disabled={busy}
              className="rounded-full"
              onClick={() => void save({ status: s })}
            >
              {STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 space-y-3">
        <div>
          <Label htmlFor="next">Next action</Label>
          <Input
            id="next"
            className="mt-1.5 h-11"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="e.g. Call tomorrow morning"
          />
        </div>
        <div>
          <Label htmlFor="notes">Internal notes</Label>
          <Textarea
            id="notes"
            className="mt-1.5 min-h-[100px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes for the team"
          />
        </div>
        <Button
          className="h-11 w-full rounded-full"
          disabled={busy}
          onClick={() => void save({ admin_notes: notes, next_action: nextAction })}
        >
          Save notes
        </Button>
      </section>

      <p className="text-[11px] text-muted-foreground">
        Submitted {new Date(row.created_at).toLocaleString()}
      </p>
    </Container>
  );
}
