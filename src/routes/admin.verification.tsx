import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  fetchUsers,
  fetchVerificationRequests,
  reviewVerification,
  setUserVerified,
  type AdminProfile,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/verification")({
  head: () => ({ meta: [{ title: "Admin verification — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [tab, setTab] = useState<"requests" | "creators" | "brands">("requests");

  const reload = async () => {
    try {
      const [r, u] = await Promise.all([fetchVerificationRequests(100), fetchUsers(300)]);
      setRequests(r);
      setUsers(u);
    } catch (e: any) {
      toast.error(e?.message);
    }
  };
  useEffect(() => {
    void reload();
  }, []);

  const pendingReqs = useMemo(
    () => requests.filter((r) => !r.status || r.status === "pending" || r.status === "open"),
    [requests],
  );
  const pendingCreators = users.filter((u) => u.role === "creator" && !u.verified && u.onboarded);
  const pendingBrands = users.filter((u) => u.role === "brand" && !u.verified && u.onboarded);

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Verification center</h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject via <code className="text-xs">admin_review_verification</code> when requests exist.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["requests", `Requests (${pendingReqs.length})`],
            ["creators", `Creators (${pendingCreators.length})`],
            ["brands", `Brands (${pendingBrands.length})`],
          ] as const
        ).map(([k, label]) => (
          <Button key={k} size="sm" variant={tab === k ? "default" : "outline"} onClick={() => setTab(k)}>
            {label}
          </Button>
        ))}
      </div>

      {tab === "requests" && (
        <div className="space-y-3">
          {pendingReqs.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border p-4">
              <p className="font-medium capitalize">{r.type || "verification"} · {r.status || "pending"}</p>
              <p className="text-xs text-muted-foreground">
                user {r.user_id?.slice?.(0, 8)} · {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
              </p>
              {r.notes && <p className="mt-1 text-sm">{r.notes}</p>}
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await reviewVerification(r.id, "approved", "Approved by admin");
                      toast.success("Approved");
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
                    const note = prompt("Rejection reason") || "Rejected by admin";
                    try {
                      await reviewVerification(r.id, "rejected", note);
                      toast.success("Rejected");
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
          {pendingReqs.length === 0 && (
            <p className="text-sm text-muted-foreground">No pending verification_requests rows.</p>
          )}
        </div>
      )}

      {tab === "creators" && (
        <div className="space-y-3">
          {pendingCreators.map((u) => (
            <VerifyUserRow key={u.id} u={u} onDone={reload} />
          ))}
          {pendingCreators.length === 0 && <p className="text-sm text-muted-foreground">None pending.</p>}
        </div>
      )}
      {tab === "brands" && (
        <div className="space-y-3">
          {pendingBrands.map((u) => (
            <VerifyUserRow key={u.id} u={u} onDone={reload} />
          ))}
          {pendingBrands.length === 0 && <p className="text-sm text-muted-foreground">None pending.</p>}
        </div>
      )}
    </Container>
  );
}

function VerifyUserRow({ u, onDone }: { u: AdminProfile; onDone: () => Promise<void> }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{u.full_name || "—"}</p>
        <p className="text-xs text-muted-foreground">
          {u.role} · @{u.username || "—"} · {u.location || "—"}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={async () => {
            try {
              await setUserVerified(u.id, true);
              toast.success("Verified");
              await onDone();
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
              await onDone();
            } catch (e: any) {
              toast.error(e?.message);
            }
          }}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
