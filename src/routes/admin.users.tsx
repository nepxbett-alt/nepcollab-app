import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchUsers,
  setUserRole,
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
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const reload = async () => {
    try {
      setUsers(await fetchUsers(200));
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
      if (!q) return true;
      const hay = `${u.full_name ?? ""} ${u.username ?? ""} ${u.location ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [users, q, roleFilter]);

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
          Verify creators/brands, change roles, and promote admins.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="Search name or username…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {["all", "creator", "brand", "admin"].map((r) => (
          <Button
            key={r}
            size="sm"
            variant={roleFilter === r ? "default" : "outline"}
            onClick={() => setRoleFilter(r)}
          >
            {r}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-3 py-3">
                  <div className="font-medium">{u.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    @{u.username || "—"} · {u.id.slice(0, 8)}
                  </div>
                </td>
                <td className="px-3 py-3 capitalize">{u.role || "—"}</td>
                <td className="px-3 py-3">{u.location || "—"}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span>{u.verified ? "Verified" : "Unverified"}</span>
                    <span>{u.onboarded ? "Onboarded" : "Not onboarded"}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === u.id}
                      onClick={() =>
                        act(u.id, () => setUserVerified(u.id, !u.verified))
                      }
                    >
                      {u.verified ? "Unverify" : "Verify"}
                    </Button>
                    {u.role !== "creator" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === u.id}
                        onClick={() => act(u.id, () => setUserRole(u.id, "creator"))}
                      >
                        Make creator
                      </Button>
                    )}
                    {u.role !== "brand" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === u.id}
                        onClick={() => act(u.id, () => setUserRole(u.id, "brand"))}
                      >
                        Make brand
                      </Button>
                    )}
                    {u.role !== "admin" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === u.id}
                        onClick={() => act(u.id, () => setUserRole(u.id, "admin"))}
                      >
                        Make admin
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No users match.</p>
        )}
      </div>
    </Container>
  );
}
