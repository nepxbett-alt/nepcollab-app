import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { fetchAdminCollaborations, setCollabStatus } from "@/lib/admin";

export const Route = createFileRoute("/admin/collaborations")({
  head: () => ({ meta: [{ title: "Admin collaborations — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  const [rows, setRows] = useState<any[]>([]);
  const reload = async () => {
    try {
      setRows(await fetchAdminCollaborations(200));
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
        <p className="text-sm text-muted-foreground">Inspect and moderate active work between brands and creators.</p>
      </div>
      <div className="space-y-3">
        {rows.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border p-4">
            <p className="font-medium capitalize">{c.status}</p>
            <p className="text-xs text-muted-foreground">
              {c.id.slice(0, 8)} · campaign {String(c.campaign_id).slice(0, 8)} · creator{" "}
              {String(c.creator_id).slice(0, 8)} · brand {String(c.brand_id).slice(0, 8)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {["active", "submitted", "revision_requested", "completed", "cancelled"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={c.status === s ? "default" : "outline"}
                  onClick={async () => {
                    try {
                      await setCollabStatus(c.id, s);
                      toast.success("Logged & updated");
                      await reload();
                    } catch (e: any) {
                      toast.error(e?.message);
                    }
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No collaborations.</p>}
      </div>
    </Container>
  );
}
