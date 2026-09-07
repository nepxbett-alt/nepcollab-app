import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import {
  fetchBusinessRequests,
  STATUS_LABELS,
  type BusinessRequest,
  type RequestStatus,
} from "@/lib/business-requests";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <AdminGuard>
      <AdminHome />
    </AdminGuard>
  ),
});

function AdminHome() {
  const [rows, setRows] = useState<BusinessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | RequestStatus | "active">("new");

  const reload = async () => {
    setLoading(true);
    try {
      setRows(await fetchBusinessRequests(150));
    } catch (e: any) {
      toast.error(e?.message || "Could not load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const counts = useMemo(() => {
    const c = { new: 0, active: 0, completed: 0, all: rows.length };
    for (const r of rows) {
      if (r.status === "new") c.new++;
      if (["contacted", "in_progress", "matched"].includes(r.status)) c.active++;
      if (r.status === "completed" || r.status === "closed") c.completed++;
    }
    return c;
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "active") return ["contacted", "in_progress", "matched"].includes(r.status);
    return r.status === filter;
  });

  return (
    <Container className="space-y-5 py-6">
      <div>
        <p className="type-kicker text-signal">Admin</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Business briefs submitted from the public site.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ["new", "New", counts.new],
            ["active", "Active", counts.active],
            ["completed", "Done", counts.completed],
            ["all", "All", counts.all],
          ] as const
        ).map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-2xl border p-3 text-left transition-colors",
              filter === id ? "border-ink bg-ink text-ink-foreground" : "border-border bg-card",
            )}
          >
            <p className="font-display text-xl font-bold">{n}</p>
            <p className={cn("text-[11px]", filter === id ? "text-ink-foreground/70" : "text-muted-foreground")}>
              {label}
            </p>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading requests…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No requests in this view yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.id}>
              <Link
                to="/admin/requests/$id"
                params={{ id: r.id }}
                className="tap block rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.business_name}</p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {r.contact_name}
                      {r.category ? ` · ${r.category}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold">
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">{r.request_details}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                  {r.next_action ? ` · Next: ${r.next_action}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
