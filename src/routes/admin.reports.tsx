import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { fetchReports, resolveReport, type AdminReport } from "@/lib/admin";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Admin reports — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <AdminReports />
    </AdminGuard>
  ),
});

function AdminReports() {
  const [rows, setRows] = useState<AdminReport[]>([]);

  const reload = async () => {
    try {
      setRows(await fetchReports(100));
    } catch (e: any) {
      toast.error(e?.message || "Failed to load reports");
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Abuse and policy reports from the community.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports yet — good.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium capitalize">{r.status || "open"}</p>
                  <p className="text-sm">{r.reason || "No reason given"}</p>
                  {r.details && (
                    <p className="mt-1 text-xs text-muted-foreground">{r.details}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Reporter {r.reporter_id?.slice(0, 8) || "—"} → user{" "}
                    {r.reported_user_id?.slice(0, 8) || "—"} ·{" "}
                    {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                  </p>
                </div>
                {(r.status === "open" || r.status === "pending" || !r.status) && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await resolveReport(r.id, "resolved");
                          toast.success("Resolved");
                          await reload();
                        } catch (e: any) {
                          toast.error(e?.message || "Failed");
                        }
                      }}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await resolveReport(r.id, "dismissed");
                          toast.success("Dismissed");
                          await reload();
                        } catch (e: any) {
                          toast.error(e?.message || "Failed");
                        }
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
