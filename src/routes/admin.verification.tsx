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
import {
  adminListSocialAccounts,
  adminMarkSocialVerified,
} from "@/lib/social-lookup";
import { formatFollowers } from "@/lib/lookup";

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
  const [socials, setSocials] = useState<any[]>([]);
  const [socialBusy, setSocialBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"social" | "requests" | "creators" | "brands">("social");

  const reload = async () => {
    try {
      const [r, u, s] = await Promise.all([
        fetchVerificationRequests(100),
        fetchUsers(300),
        adminListSocialAccounts(),
      ]);
      setRequests(r);
      setUsers(u);
      if (s.success) setSocials(s.accounts || []);
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
  const pendingSocial = socials.filter(
    (s) => !s.verified && (s.verifyCode || s.followers != null),
  );

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Verification center</h1>
        <p className="text-sm text-muted-foreground">
          Confirm social ownership codes, approve creator/brand profiles, and review requests.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["social", `Social (${pendingSocial.length})`],
            ["requests", `Requests (${pendingReqs.length})`],
            ["creators", `Creators (${pendingCreators.length})`],
            ["brands", `Brands (${pendingBrands.length})`],
          ] as const
        ).map(([k, label]) => (
          <Button
            key={k}
            size="sm"
            variant={tab === k ? "default" : "outline"}
            onClick={() => setTab(k)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "social" && (
        <div className="space-y-3">
          <p className="text-[13px] text-muted-foreground">
            Creators get a unique code (e.g. NC-AB12), put it in their public bio, then verify —
            or you open their profile, confirm the code, and mark verified here.
          </p>
          {pendingSocial.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border p-4 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {s.platform}{" "}
                    <span className="font-normal text-muted-foreground">@{s.handle}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {typeof s.followers === "number"
                      ? `${formatFollowers(s.followers)} followers`
                      : "Followers pending"}
                    {typeof s.engagement === "number" ? ` · ${s.engagement}% eng.` : ""}
                    {s.statsSource ? ` · ${s.statsSource}` : ""}
                  </p>
                  {s.verifyCode ? (
                    <p className="mt-1.5 font-mono text-sm font-bold text-signal">
                      Code: {s.verifyCode}
                      {s.verifyExpiresAt
                        ? ` · expires ${new Date(s.verifyExpiresAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No active code — creator starts verification from Profile.
                    </p>
                  )}
                  {s.profileUrl ? (
                    <a
                      href={s.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-primary underline"
                    >
                      Open public profile
                    </a>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  disabled={socialBusy === s.id}
                  onClick={async () => {
                    setSocialBusy(s.id);
                    try {
                      const res = await adminMarkSocialVerified({
                        data: { accountId: s.id, verified: true },
                      });
                      if (!res.success) toast.error(res.message);
                      else {
                        toast.success(res.message);
                        await reload();
                      }
                    } catch (e: any) {
                      toast.error(e?.message);
                    } finally {
                      setSocialBusy(null);
                    }
                  }}
                >
                  Mark verified
                </Button>
              </div>
            </div>
          ))}
          {pendingSocial.length === 0 && (
            <p className="text-sm text-muted-foreground">No pending social ownership checks.</p>
          )}
        </div>
      )}

      {tab === "requests" && (
        <div className="space-y-3">
          {pendingReqs.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border p-4">
              <p className="font-medium capitalize">
                {r.type || "verification"} · {r.status || "pending"}
              </p>
              <p className="text-xs text-muted-foreground">{r.id}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await reviewVerification(r.id, "approved");
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
                    try {
                      await reviewVerification(r.id, "rejected");
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
          {pendingCreators.length === 0 && (
            <p className="text-sm text-muted-foreground">None pending.</p>
          )}
        </div>
      )}
      {tab === "brands" && (
        <div className="space-y-3">
          {pendingBrands.map((u) => (
            <VerifyUserRow key={u.id} u={u} onDone={reload} />
          ))}
          {pendingBrands.length === 0 && (
            <p className="text-sm text-muted-foreground">None pending.</p>
          )}
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
