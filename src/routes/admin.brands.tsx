import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchBrands, setBrandFeatured, setUserSuspended, setUserVerified } from "@/lib/admin";

export const Route = createFileRoute("/admin/brands")({
  head: () => ({ meta: [{ title: "Admin brands — NepCollab" }] }),
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
      setRows(await fetchBrands());
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
      const hay = `${r.full_name} ${r.brand_profile?.business_name} ${r.brand_profile?.category} ${r.location}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [rows, q]);

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Brands</h1>
        <p className="text-sm text-muted-foreground">Verify, feature, and suspend brand accounts.</p>
      </div>
      <Input className="max-w-sm" placeholder="Search brand…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-3">
        {list.map((b) => (
          <div key={b.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{b.brand_profile?.business_name || b.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {b.brand_profile?.category || "—"} · {b.brand_profile?.website || "—"} · {b.location || "—"}
                </p>
                <p className="text-xs">
                  {b.verified ? "Verified" : "Unverified"} · {b.suspended ? "Suspended" : "Active"} ·{" "}
                  {b.featured ? "Featured" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    await setUserVerified(b.id, !b.verified);
                    toast.success("Updated");
                    await reload();
                  } catch (e: any) {
                    toast.error(e?.message);
                  }
                }}>{b.verified ? "Unverify" : "Verify"}</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    await setBrandFeatured(b.id, !b.featured);
                    toast.success("Updated");
                    await reload();
                  } catch (e: any) {
                    toast.error(e?.message);
                  }
                }}>{b.featured ? "Unfeature" : "Feature"}</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    if (!b.suspended && !confirm("Suspend brand?")) return;
                    await setUserSuspended(b.id, !b.suspended);
                    toast.success("Updated");
                    await reload();
                  } catch (e: any) {
                    toast.error(e?.message);
                  }
                }}>{b.suspended ? "Restore" : "Suspend"}</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
