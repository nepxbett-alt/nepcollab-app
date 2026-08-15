import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { fetchAdminStats, fetchAuditLogs, type AuditLog } from "@/lib/admin";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <AdminOverview />
    </AdminGuard>
  ),
});

function Stat({ label, value, to }: { label: string; value: number | string; to?: string }) {
  const inner = (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function AdminOverview() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchAdminStats>> | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, l] = await Promise.all([fetchAdminStats(), fetchAuditLogs(12)]);
        setStats(s);
        setLogs(l);
      } catch (e: any) {
        setErr(e?.message || "Failed to load admin stats");
      }
    })();
  }, []);

  return (
    <Container className="space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform health, moderation, and marketplace controls.
        </p>
      </div>

      {err && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {err}
          <p className="mt-1 text-xs opacity-80">
            If this is a permissions error, run the admin SQL migration in Supabase, then bootstrap your account.
          </p>
        </div>
      )}

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Users" value={stats.users} to="/admin/users" />
          <Stat label="Creators" value={stats.creators} to="/admin/users" />
          <Stat label="Brands" value={stats.brands} to="/admin/users" />
          <Stat label="Verified" value={stats.verified} />
          <Stat label="Campaigns" value={stats.campaigns} to="/admin/campaigns" />
          <Stat label="Active campaigns" value={stats.activeCampaigns} to="/admin/campaigns" />
          <Stat label="Applications" value={stats.applications} to="/admin/applications" />
          <Stat label="Pending apps" value={stats.pendingApplications} to="/admin/applications" />
          <Stat label="Collaborations" value={stats.collaborations} />
          <Stat label="Open reports" value={stats.openReports} to="/admin/reports" />
          <Stat label="Admins" value={stats.admins} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Quick actions</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="text-primary underline" to="/admin/users">
                Review users & verification
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" to="/admin/campaigns">
                Moderate campaigns (pause / close / delete)
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" to="/admin/reports">
                Resolve abuse reports
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" to="/admin/settings">
                Platform settings
              </Link>
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Recent admin activity</h2>
          {logs.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No audit entries yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {logs.map((l) => (
                <li key={l.id} className="flex justify-between gap-3 border-b border-border py-2 last:border-0">
                  <span>
                    <span className="font-medium">{l.action}</span>
                    {l.target_type ? (
                      <span className="text-muted-foreground"> · {l.target_type}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {l.created_at ? new Date(l.created_at).toLocaleString() : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Container>
  );
}
