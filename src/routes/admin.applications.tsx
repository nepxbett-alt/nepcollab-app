import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  fetchAdminApplications,
  fetchAdminCollaborations,
  setApplicationStatusAdmin,
  setCollabStatus,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({ meta: [{ title: "Admin applications — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <AdminApplications />
    </AdminGuard>
  ),
});

function AdminApplications() {
  const [apps, setApps] = useState<any[]>([]);
  const [collabs, setCollabs] = useState<any[]>([]);

  const reload = async () => {
    try {
      const [a, c] = await Promise.all([
        fetchAdminApplications(150),
        fetchAdminCollaborations(100),
      ]);
      setApps(a);
      setCollabs(c);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load");
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return (
    <Container className="space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Applications & collaborations</h1>
        <p className="text-sm text-muted-foreground">
          Cross-platform view for support and dispute handling.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Applications ({apps.length})</h2>
        {apps.map((a) => (
          <div
            key={a.id}
            className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="text-sm">
              <div className="font-medium capitalize">{a.status}</div>
              <div className="text-xs text-muted-foreground">
                app {a.id.slice(0, 8)} · campaign {String(a.campaign_id).slice(0, 8)} · creator{" "}
                {String(a.creator_id).slice(0, 8)}
              </div>
              {a.pitch && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.pitch}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {["pending", "shortlisted", "accepted", "rejected", "withdrawn"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await setApplicationStatusAdmin(a.id, s);
                      toast.success("Updated");
                      await reload();
                    } catch (e: any) {
                      toast.error(e?.message || "Failed");
                    }
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Collaborations ({collabs.length})</h2>
        {collabs.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="text-sm">
              <div className="font-medium capitalize">{c.status}</div>
              <div className="text-xs text-muted-foreground">
                collab {c.id.slice(0, 8)} · campaign {String(c.campaign_id).slice(0, 8)}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {["active", "submitted", "revision_requested", "completed", "cancelled"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await setCollabStatus(c.id, s);
                      toast.success("Updated");
                      await reload();
                    } catch (e: any) {
                      toast.error(e?.message || "Failed");
                    }
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </Container>
  );
}
