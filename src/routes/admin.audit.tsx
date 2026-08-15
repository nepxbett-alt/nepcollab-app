import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { fetchAuditLogs, type AuditLog } from "@/lib/admin";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Admin audit — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    (async () => {
      try {
        setLogs(await fetchAuditLogs(200));
      } catch (e: any) {
        toast.error(e?.message);
      }
    })();
  }, []);
  const filtered = useMemo(() => {
    if (!q) return logs;
    const t = q.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(t) ||
        (l.target_type || "").toLowerCase().includes(t) ||
        (l.target_id || "").toLowerCase().includes(t),
    );
  }, [logs, q]);

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Append-only history of sensitive admin actions (from admin_audit_logs).
        </p>
      </div>
      <Input className="max-w-sm" placeholder="Filter action or target…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Admin</th>
              <th className="px-3 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2 font-medium">{l.action}</td>
                <td className="px-3 py-2 text-xs">
                  {l.target_type} {l.target_id ? l.target_id.slice(0, 8) : ""}
                </td>
                <td className="px-3 py-2 text-xs">{l.admin_id?.slice(0, 8) || "—"}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {l.details ? JSON.stringify(l.details).slice(0, 80) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No entries.</p>}
      </div>
    </Container>
  );
}
