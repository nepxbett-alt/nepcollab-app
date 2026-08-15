import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { fetchUsers, setUserVerified, type AdminProfile } from "@/lib/admin";

export const Route = createFileRoute("/admin/verification")({
  head: () => ({ meta: [{ title: "Admin verification — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  const [pending, setPending] = useState<AdminProfile[]>([]);
  const reload = async () => {
    try {
      const all = await fetchUsers(300);
      setPending(all.filter((u) => !u.verified && (u.role === "creator" || u.role === "brand") && u.onboarded));
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
        <h1 className="text-2xl font-semibold">Verification center</h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject creator and brand verification. Decisions are audit-logged.
        </p>
      </div>
      <div className="space-y-3">
        {pending.map((u) => (
          <div key={u.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{u.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground">
                {u.role} · @{u.username || "—"} · {u.location || "—"} · joined{" "}
                {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await setUserVerified(u.id, true);
                    toast.success("Verified");
                    await reload();
                  } catch (e: any) {
                    toast.error(e?.message);
                  }
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await setUserVerified(u.id, false);
                    toast.message("Left unverified");
                    await reload();
                  } catch (e: any) {
                    toast.error(e?.message);
                  }
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground">No pending onboarded unverified accounts.</p>
        )}
      </div>
    </Container>
  );
}
