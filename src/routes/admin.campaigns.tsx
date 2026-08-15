import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  deleteCampaign,
  fetchAdminCampaigns,
  setCampaignFeatured,
  setCampaignStatus,
  type AdminCampaign,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/campaigns")({
  head: () => ({ meta: [{ title: "Admin campaigns — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <AdminCampaigns />
    </AdminGuard>
  ),
});

const STATUSES = ["active", "paused", "closed", "completed", "draft", "cancelled"] as const;

function AdminCampaigns() {
  const [rows, setRows] = useState<AdminCampaign[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = async () => {
    try {
      setRows(await fetchAdminCampaigns(200));
    } catch (e: any) {
      toast.error(e?.message || "Failed to load campaigns");
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    try {
      await fn();
      toast.success("Updated");
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <p className="text-sm text-muted-foreground">
          Pause, close, or remove listings that violate policy.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <Link
                to="/campaigns/$campaignId"
                params={{ campaignId: c.id }}
                className="font-medium hover:underline"
              >
                {c.title}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {c.status} · {c.category || "—"} · {c.location || "—"} ·{" "}
                {c.budget != null ? `NPR ${c.budget}` : "—"} · {c.views ?? 0} views
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={c.status === s ? "default" : "outline"}
                  disabled={busy === c.id || c.status === s}
                  onClick={() => run(c.id, () => setCampaignStatus(c.id, s))}
                >
                  {s}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                disabled={busy === c.id}
                onClick={() => run(c.id, () => setCampaignFeatured(c.id, !c.featured))}
              >
                {c.featured ? "Unfeature" : "Feature"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy === c.id}
                onClick={() => {
                  if (confirm(`Delete campaign “${c.title}”?`)) {
                    void run(c.id, () => deleteCampaign(c.id));
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No campaigns found.</p>
        )}
      </div>
    </Container>
  );
}
