import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { NepCollabVoucher } from "@/components/NepCollabVoucher";
import { Button } from "@/components/ui/button";
import {
  adminIssueVoucher,
  adminListVouchers,
  adminVoidVoucher,
  type CollabVoucher,
} from "@/lib/vouchers";

export const Route = createFileRoute("/admin/vouchers")({
  head: () => ({ meta: [{ title: "Admin vouchers — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  const [rows, setRows] = useState<CollabVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<CollabVoucher | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await adminListVouchers();
      if (!res.success) toast.error(res.message);
      setRows(res.vouchers || []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const pending = rows.filter((r) => r.status === "pending_admin");
  const issued = rows.filter((r) => r.status === "issued");
  const other = rows.filter((r) => r.status !== "pending_admin" && r.status !== "issued");

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Vouchers & gift cards</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Brands generate vouchers after deliverables are approved. Issue them to creators when
          everything checks out — this confirms completion and unlocks shareable NepCollab marketing
          cards.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Pending</p>
          <p className="text-xl font-bold">{pending.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Issued</p>
          <p className="text-xl font-bold">{issued.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">All</p>
          <p className="text-xl font-bold">{rows.length}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No vouchers yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((v) => (
            <li key={v.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-bold tracking-wide text-signal">{v.code}</p>
                  <p className="mt-1 text-sm font-medium">
                    {v.brand_name} × {v.creator_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {v.campaign_title || "Campaign"} · {v.status}
                    {v.amount_npr != null
                      ? ` · NPR ${Number(v.amount_npr).toLocaleString("en-NP")}`
                      : ""}
                  </p>
                  {v.brand_note ? (
                    <p className="mt-1 text-xs text-muted-foreground">Brand note: {v.brand_note}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreview(v)}>
                    Preview card
                  </Button>
                  {v.status === "pending_admin" ? (
                    <Button
                      size="sm"
                      className="bg-signal text-signal-foreground hover:bg-signal/90"
                      onClick={async () => {
                        try {
                          const res = await adminIssueVoucher({
                            data: { voucherId: v.id },
                          });
                          if (!res.success) toast.error(res.message);
                          else {
                            toast.success(res.message);
                            await reload();
                          }
                        } catch (e: any) {
                          toast.error(e?.message);
                        }
                      }}
                    >
                      Issue to creator
                    </Button>
                  ) : null}
                  {v.status === "pending_admin" || v.status === "issued" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          const res = await adminVoidVoucher({ data: { voucherId: v.id } });
                          if (!res.success) toast.error(res.message);
                          else {
                            toast.message(res.message);
                            await reload();
                          }
                        } catch (e: any) {
                          toast.error(e?.message);
                        }
                      }}
                    >
                      Void
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {preview ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => setPreview(null)}
          />
          <div className="relative z-10 max-h-[90vh] overflow-auto rounded-3xl bg-background p-4">
            <NepCollabVoucher voucher={preview} />
            <Button className="mt-3 w-full" variant="outline" onClick={() => setPreview(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Container>
  );
}
