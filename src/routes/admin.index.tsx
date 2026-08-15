import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import {
  fetchAdminStats,
  fetchAuditLogs,
  globalAdminSearch,
  type AuditLog,
} from "@/lib/admin";

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
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-foreground/20">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
  return to ? <Link to={to as any}>{inner}</Link> : inner;
}

function AdminOverview() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchAdminStats>> | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState<{ users: any[]; campaigns: any[] } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, l] = await Promise.all([fetchAdminStats(), fetchAuditLogs(15)]);
        setStats(s);
        setLogs(l);
      } catch (e: any) {
        setErr(e?.message || "Failed to load admin stats");
      }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) {
        setSearchResults(null);
        return;
      }
      try {
        setSearchResults(await globalAdminSearch(q));
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Container className="space-y-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Control Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real operational control over NepCollab — users, campaigns, moderation, settings.
          </p>
        </div>
        <Input
          className="max-w-sm"
          placeholder="Search users, campaigns…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {searchResults && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="font-medium">Search results</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Users</p>
              <ul className="mt-1 space-y-1">
                {searchResults.users.map((u) => (
                  <li key={u.id}>
                    <Link className="text-primary underline" to="/admin/users" search={{ q: u.full_name || "" } as any}>
                      {u.full_name || u.username || u.id.slice(0, 8)} ({u.role})
                    </Link>
                  </li>
                ))}
                {searchResults.users.length === 0 && <li className="text-muted-foreground">None</li>}
              </ul>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Campaigns</p>
              <ul className="mt-1 space-y-1">
                {searchResults.campaigns.map((c) => (
                  <li key={c.id}>
                    <Link className="text-primary underline" to="/campaigns/$campaignId" params={{ campaignId: c.id }}>
                      {c.title} ({c.status})
                    </Link>
                  </li>
                ))}
                {searchResults.campaigns.length === 0 && <li className="text-muted-foreground">None</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {err && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {err}
          <p className="mt-1 text-xs opacity-80">
            Ensure you are signed in as admin and the admin SQL migration has been applied.
          </p>
        </div>
      )}

      {stats && (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Users</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Total users" value={stats.users} to="/admin/users" />
              <Stat label="Creators" value={stats.creators} to="/admin/creators" />
              <Stat label="Brands" value={stats.brands} to="/admin/brands" />
              <Stat label="Admins" value={stats.admins} />
              <Stat label="Verified" value={stats.verified} to="/admin/verification" />
              <Stat label="Pending verification" value={stats.unverified} to="/admin/verification" />
              <Stat label="Suspended" value={stats.suspended} to="/admin/users" />
              <Stat label="New today / week" value={`${stats.newToday} / ${stats.newWeek}`} />
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Platform</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Campaigns" value={stats.campaigns} to="/admin/campaigns" />
              <Stat label="Active" value={stats.activeCampaigns} to="/admin/campaigns" />
              <Stat label="Draft / completed" value={`${stats.draftCampaigns} / ${stats.completedCampaigns}`} />
              <Stat label="Featured campaigns" value={stats.featuredCampaigns} to="/admin/content" />
              <Stat label="Applications" value={stats.applications} to="/admin/applications" />
              <Stat label="Pending apps" value={stats.pendingApplications} to="/admin/applications" />
              <Stat label="Accepted apps" value={stats.acceptedApplications} />
              <Stat label="Collaborations" value={stats.collaborations} to="/admin/collaborations" />
              <Stat label="Active collabs" value={stats.activeCollabs} to="/admin/collaborations" />
              <Stat label="Completed collabs" value={stats.completedCollabs} />
              <Stat label="Open reports" value={stats.openReports} to="/admin/reports" />
              <Stat label="Campaign budget (NPR)" value={stats.totalBudgetNpr.toLocaleString()} />
            </div>
          </section>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Operations</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-primary underline" to="/admin/verification">Verification queue</Link></li>
            <li><Link className="text-primary underline" to="/admin/reports">Reports & moderation</Link></li>
            <li><Link className="text-primary underline" to="/admin/content">Featured content</Link></li>
            <li><Link className="text-primary underline" to="/admin/settings">Platform settings</Link></li>
            <li><Link className="text-primary underline" to="/admin/audit">Audit log</Link></li>
          </ul>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent audit activity</h2>
            <Link to="/admin/audit" className="text-xs text-primary underline">View all</Link>
          </div>
          {logs.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No audit entries yet.</p>
          ) : (
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
              {logs.map((l) => (
                <li key={l.id} className="flex justify-between gap-3 border-b border-border py-2 last:border-0">
                  <span>
                    <span className="font-medium">{l.action}</span>
                    {l.target_type ? <span className="text-muted-foreground"> · {l.target_type}</span> : null}
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
