import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Container, SectionHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { NepCollabVoucher } from "@/components/NepCollabVoucher";
import { Button } from "@/components/ui/button";
import {
  creatorRedeemVoucher,
  listMyVouchers,
  type CollabVoucher,
} from "@/lib/vouchers";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/vouchers")({
  head: () => ({
    meta: [
      { title: "My vouchers — NepCollab" },
      {
        name: "description",
        content: "Download, share and redeem your NepCollab collaboration vouchers.",
      },
    ],
  }),
  component: VouchersPage,
});

function VouchersPage() {
  const { signedIn, role } = useStore();
  const [rows, setRows] = useState<CollabVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await listMyVouchers();
      setRows(res.vouchers || []);
      if (!res.success && res.message) toast.message(res.message);
    } catch (e: any) {
      toast.error(e?.message || "Could not load vouchers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (signedIn) void reload();
    else setLoading(false);
  }, [signedIn]);

  if (!signedIn) {
    return (
      <Container className="py-10">
        <EmptyState
          title="Sign in to see vouchers"
          body="Collaboration vouchers appear here after admin release."
          actionLabel="Sign in"
          actionTo="/auth"
        />
      </Container>
    );
  }

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vouchers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {role === "brand"
            ? "Gift cards you generated for completed collaborations."
            : "Your NepCollab rewards — download the card, share to story, redeem in store."}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No vouchers yet"
          body={
            role === "brand"
              ? "After you approve deliverables, generate a voucher from the collaboration workspace."
              : "When a brand completes a collab and admin releases your voucher, it shows up here."
          }
          actionLabel="Collaborations"
          actionTo="/collaborations"
        />
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          {rows.map((v) => (
            <div key={v.id} className="space-y-3">
              <NepCollabVoucher voucher={v} />
              {role === "creator" && v.status === "issued" ? (
                <Button
                  className="h-11 w-full max-w-[360px] rounded-full"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await creatorRedeemVoucher({ data: { voucherId: v.id } });
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
                  Mark as redeemed at store
                </Button>
              ) : null}
              <p className="max-w-[360px] text-[11px] text-muted-foreground">
                Show this code at the partner store or redeem as instructed by the brand. Sharing the
                card promotes your work and NepCollab.
              </p>
            </div>
          ))}
        </div>
      )}

      <SectionHeader title="How it works" />
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Creator finishes deliverables</li>
        <li>Brand approves work and generates a voucher</li>
        <li>Admin verifies and issues the voucher</li>
        <li>Creator downloads, shares to story, and redeems</li>
      </ol>
      <Link to="/collaborations" className="text-sm font-medium text-signal underline">
        Back to collaborations
      </Link>
    </Container>
  );
}
