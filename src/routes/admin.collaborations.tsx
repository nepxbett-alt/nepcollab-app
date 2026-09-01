import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  fetchAdminCollaborations,
  setCampaignFeatured,
  setCollabStatus,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/collaborations")({
  component: AdminCollaborations,
});

type Row = {
  id: string;
  status: string;
  campaign_id: string;
  brand_id: string;
  creator_id: string;
  brand_name?: string;
  creator_name?: string;
  campaign_title?: string;
  campaign_featured?: boolean;
  created_at?: string;
};

function AdminCollaborations() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = async () => {
    try {
      setRows((await fetchAdminCollaborations(200)) as Row[]);
    } catch (e: any) {
      toast.error(e?.message);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Collaborations</h1>
        <p className="text-sm text-muted-foreground">
          Who is working with whom — brand × creator × campaign. Change status or feature the campaign.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-signal">
                  {String(c.status || "").replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-base font-bold tracking-tight">
                  {c.brand_name || "Brand"}
                  <span className="mx-1.5 font-normal text-muted-foreground">×</span>
                  {c.creator_name || "Creator"}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  Campaign: {c.campaign_title || "—"}
                  {c.campaign_featured ? " · Featured" : ""}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {c.created_at ? new Date(c.created_at).toLocaleString() : ""} · id {c.id.slice(0, 8)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant={c.campaign_featured ? "default" : "outline"}
                  disabled={busy === c.id}
                  onClick={async () => {
                    setBusy(c.id);
                    try {
                      await setCampaignFeatured(c.campaign_id, !c.campaign_featured);
                      toast.success(c.campaign_featured ? "Unfeatured" : "Campaign featured");
                      await reload();
                    } catch (e: any) {
                      toast.error(e?.message);
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  {c.campaign_featured ? "Unfeature" : "Feature campaign"}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/admin/campaigns">All campaigns</Link>
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {["active", "submitted", "revision_requested", "completed", "cancelled"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={c.status === s ? "default" : "outline"}
                  disabled={busy === c.id}
                  onClick={async () => {
                    setBusy(c.id);
                    try {
                      await setCollabStatus(c.id, s);
                      toast.success("Status updated");
                      await reload();
                    } catch (e: any) {
                      toast.error(e?.message);
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  {s.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No collaborations yet. They appear when a brand selects a creator.
          </p>
        )}
      </div>
    </Container>
  );
}
