import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchUsers,
  setUserAdminNotes,
  setUserFeatured,
  setUserRole,
  setUserSuspended,
  setUserVerified,
  type AdminProfile,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Admin users — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <AdminUsers />
    </AdminGuard>
  ),
});

function AdminUsers() {
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const reload = async () => {
    try {
      setUsers(await fetchUsers(300));
    } catch (e: any) {
      toast.error(e?.message || "Failed to load users");
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "verified" && !u.verified) return false;
      if (statusFilter === "unverified" && u.verified) return false;
      if (statusFilter === "suspended" && !u.suspended) return false;
      if (statusFilter === "active" && u.suspended) return false;
      if (!q) return true;
      const hay = `${u.full_name ?? ""} ${u.username ?? ""} ${u.location ?? ""} ${u.id}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [users, q, roleFilter, statusFilter]);

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    try {
      await fn();
      toast.success("Updated");
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Search, verify, suspend, change roles, feature, and add internal notes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        {["all", "creator", "brand", "admin"].map((r) => (
          <Button key={r} size="sm" variant={roleFilter === r ? "default" : "outline"} onClick={() => setRoleFilter(r)}>
            {r}
          </Button>
        ))}
        {["all", "verified", "unverified", "suspended", "active"].map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
            {s}
          </Button>
        ))}
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((u) => (
          <UserCard key={u.id} u={u} busy={busy} act={act} notesDraft={notesDraft} setNotesDraft={setNotesDraft} />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Joined</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-border align-top">
                <td className="px-3 py-3">
                  <div className="font-medium">{u.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">@{u.username || "—"} · {u.location || "—"}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{u.id}</div>
                </td>
                <td className="px-3 py-3 capitalize">{u.role || "—"}</td>
                <td className="px-3 py-3 text-xs">
                  <div>{u.verified ? "Verified" : "Unverified"}</div>
                  <div>{u.suspended ? "Suspended" : "Active"}</div>
                  <div>{u.featured ? "Featured" : ""}</div>
                  <div>{u.onboarded ? "Onboarded" : "Not onboarded"}</div>
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => act(u.id, () => setUserVerified(u.id, !u.verified))}>
                      {u.verified ? "Unverify" : "Verify"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === u.id}
                      onClick={() => {
                        if (u.suspended) act(u.id, () => setUserSuspended(u.id, false));
                        else {
                          const reason = prompt("Suspension reason (optional)") || undefined;
                          if (confirm(`Suspend ${u.full_name || u.id}?`)) act(u.id, () => setUserSuspended(u.id, true, reason));
                        }
                      }}
                    >
                      {u.suspended ? "Unsuspend" : "Suspend"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => act(u.id, () => setUserFeatured(u.id, !u.featured))}>
                      {u.featured ? "Unfeature" : "Feature"}
                    </Button>
                    {u.role !== "creator" && (
                      <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => act(u.id, () => setUserRole(u.id, "creator"))}>Creator</Button>
                    )}
                    {u.role !== "brand" && (
                      <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => act(u.id, () => setUserRole(u.id, "brand"))}>Brand</Button>
                    )}
                    {u.role !== "admin" && (
                      <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => {
                        if (confirm("Promote to admin?")) act(u.id, () => setUserRole(u.id, "admin"));
                      }}>Admin</Button>
                    )}
                  </div>
                  <div className="mt-2 flex gap-1">
                    <Input
                      className="h-8 text-xs"
                      placeholder="Internal notes"
                      value={notesDraft[u.id] ?? u.admin_notes ?? ""}
                      onChange={(e) => setNotesDraft((d) => ({ ...d, [u.id]: e.target.value }))}
                    />
                    <Button size="sm" variant="secondary" disabled={busy === u.id} onClick={() => act(u.id, () => setUserAdminNotes(u.id, notesDraft[u.id] ?? ""))}>
                      Save note
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground">No users match.</p>}
    </Container>
  );
}

function UserCard({
  u, busy, act, notesDraft, setNotesDraft,
}: {
  u: AdminProfile;
  busy: string | null;
  act: (id: string, fn: () => Promise<void>) => void;
  notesDraft: Record<string, string>;
  setNotesDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="font-medium">{u.full_name || "—"}</div>
      <p className="text-xs text-muted-foreground">
        {u.role} · {u.verified ? "verified" : "unverified"} · {u.suspended ? "suspended" : "active"}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => act(u.id, () => setUserVerified(u.id, !u.verified))}>
          {u.verified ? "Unverify" : "Verify"}
        </Button>
        <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => {
          if (u.suspended) act(u.id, () => setUserSuspended(u.id, false));
          else if (confirm("Suspend user?")) act(u.id, () => setUserSuspended(u.id, true));
        }}>
          {u.suspended ? "Unsuspend" : "Suspend"}
        </Button>
      </div>
    </div>
  );
}
