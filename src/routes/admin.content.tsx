import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  fetchAdminCampaigns,
  fetchBrands,
  fetchCreators,
  setBrandFeatured,
  setCampaignFeatured,
  setCreatorFeatured,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/content")({
  head: () => ({ meta: [{ title: "Admin content — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const reload = async () => {
    try {
      const [c, cr, b] = await Promise.all([fetchAdminCampaigns(100), fetchCreators(), fetchBrands()]);
      setCampaigns(c);
      setCreators(cr);
      setBrands(b);
    } catch (e: any) {
      toast.error(e?.message);
    }
  };
  useEffect(() => {
    void reload();
  }, []);

  return (
    <Container className="space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Featured content</h1>
        <p className="text-sm text-muted-foreground">
          Control what is highlighted on discovery. Requires featured columns from admin migration.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">Campaigns</h2>
        {campaigns.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
            <span>
              {c.title} <span className="text-muted-foreground">({c.status})</span>
              {c.featured ? " · Featured" : ""}
            </span>
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                await setCampaignFeatured(c.id, !c.featured);
                toast.success("Updated");
                await reload();
              } catch (e: any) {
                toast.error(e?.message || "Run admin migration for featured column");
              }
            }}>{c.featured ? "Unfeature" : "Feature"}</Button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Creators</h2>
        {creators.slice(0, 30).map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
            <span>{c.full_name || c.username}{c.featured ? " · Featured" : ""}</span>
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                await setCreatorFeatured(c.id, !c.featured);
                toast.success("Updated");
                await reload();
              } catch (e: any) {
                toast.error(e?.message);
              }
            }}>{c.featured ? "Unfeature" : "Feature"}</Button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Brands</h2>
        {brands.slice(0, 30).map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
            <span>{b.brand_profile?.business_name || b.full_name}{b.featured ? " · Featured" : ""}</span>
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                await setBrandFeatured(b.id, !b.featured);
                toast.success("Updated");
                await reload();
              } catch (e: any) {
                toast.error(e?.message);
              }
            }}>{b.featured ? "Unfeature" : "Feature"}</Button>
          </div>
        ))}
      </section>
    </Container>
  );
}
