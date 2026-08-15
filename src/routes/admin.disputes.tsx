import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchDisputes, resolveDispute } from "@/lib/admin";

export const Route = createFileRoute("/admin/disputes")({
  head: () => ({ meta: [{ title: "Admin disputes — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const reload = async () => {
    try {
      setRows(await fetchDisputes(200));
    } catch (e: any) {
      toast.error(e?.message || "Failed to load disputes");
    }
  };
  useEffect(() => {
    void reload();
  }, []);
  const list = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "open") return rows.filter((r) => !r.status || ["open", "pending", "investigating"].includes(r.status));
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Disputes</h1>
        <p className="text-sm text-muted-foreground">
          Collaboration disputes — investigate and resolve via secure admin RPC.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["all", "open", "investigating", "resolved", "dismissed"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {list.map((d) => (
          <div key={d.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-medium capitalize">{d.status || "open"}</p>
            <p className="text-sm">{d.reason || "No reason"}</p>
            {d.resolution && <p className="text-xs text-muted-foreground">Resolution: {d.resolution}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              collab {d.collaboration_id?.slice?.(0, 8) || "—"} ·{" "}
              {d.created_at ? new Date(d.created_at).toLocaleString() : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    await resolveDispute(d.id, "investigating");
                    toast.success("Marked investigating");
                    await reload();
                  } catch (e: any) {
                    toast.error(e?.message);
                  }
                }}
              >
                Investigate
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  const resolution = prompt("Resolution note") || "Resolved by admin";
                  try {
                    await resolveDispute(d.id, "resolved", resolution);
                    toast.success("Resolved");
                    await reload();
                  } catch (e: any) {
                    toast.error(e?.message);
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
                    await resolveDispute(d.id, "dismissed", "Dismissed by admin");
                    toast.success("Dismissed");
                    await reload();
                  } catch (e: any) {
                    toast.error(e?.message);
                  }
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">No disputes in this filter.</p>}
      </div>
    </Container>
  );
}
