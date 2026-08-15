import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCreators, setCreatorFeatured, setUserSuspended, setUserVerified } from "@/lib/admin";

export const Route = createFileRoute("/admin/creators")({
  head: () => ({ meta: [{ title: "Admin creators — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const reload = async () => {
    try {
      setRows(await fetchCreators());
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    }
  };
  useEffect(() => {
    void reload();
  }, []);
  const list = useMemo(() => {
    return rows.filter((r) => {
      if (!q) return true;
      const hay = `${r.full_name} ${r.username} ${r.location} ${(r.creator_profile?.niches || []).join(" ")}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [rows, q]);

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Creators</h1>
        <p className="text-sm text-muted-foreground">Verify, feature, suspend creators. Featured affects public discovery after migration.</p>
      </div>
      <Input className="max-w-sm" placeholder="Search name, niche, city…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-3">
        {list.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{c.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  @{c.username || "—"} · {c.location || "—"} ·{" "}
                  {(c.creator_profile?.niches || []).join(", ") || "no niches"} · eng{" "}
                  {c.creator_profile?.engagement_rate ?? "—"}%
                </p>
                <p className="text-xs">
                  {c.verified ? "Verified" : "Unverified"} · {c.suspended ? "Suspended" : "Active"} ·{" "}
                  {c.featured ? "Featured" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    await setUserVerified(c.id, !c.verified);
                    toast.success("Updated");
                    await reload();
                  } catch (e: any) {
                    toast.error(e?.message);
                  }
                }}>{c.verified ? "Unverify" : "Verify"}</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    await setCreatorFeatured(c.id, !c.featured);
                    toast.success("Updated");
                    await reload();
                  } catch (e: any) {
                    toast.error(e?.message);
                  }
                }}>{c.featured ? "Unfeature" : "Feature"}</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    if (!c.suspended && !confirm("Suspend creator?")) return;
                    await setUserSuspended(c.id, !c.suspended);
                    toast.success("Updated");
                    await reload();
                  } catch (e: any) {
                    toast.error(e?.message);
                  }
                }}>{c.suspended ? "Restore" : "Suspend"}</Button>
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">No creators found.</p>}
      </div>
    </Container>
  );
}
