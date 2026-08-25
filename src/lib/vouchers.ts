/**
 * Collaboration completion vouchers — brand generates, admin issues, creator shares/redeems.
 * Uses collab_vouchers table (see supabase/migrations/20260825140000_collab_vouchers.sql).
 */
import { createServerFn } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type VoucherStatus = "pending_admin" | "issued" | "redeemed" | "void";

export type CollabVoucher = {
  id: string;
  collaboration_id: string;
  campaign_id: string | null;
  brand_id: string;
  creator_id: string;
  code: string;
  title: string;
  description: string | null;
  reward_label: string | null;
  amount_npr: number | null;
  currency: string;
  status: VoucherStatus;
  brand_name: string | null;
  creator_name: string | null;
  campaign_title: string | null;
  brand_note: string | null;
  admin_note: string | null;
  issued_at: string | null;
  redeemed_at: string | null;
  created_at: string;
};

function genCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) => {
    let s = "";
    for (let i = 0; i < n; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
    return s;
  };
  return `NC-${part(4)}-${part(4)}`;
}

function mapRow(r: any): CollabVoucher {
  return {
    id: r.id,
    collaboration_id: r.collaboration_id,
    campaign_id: r.campaign_id ?? null,
    brand_id: r.brand_id,
    creator_id: r.creator_id,
    code: r.code,
    title: r.title || "NepCollab Collaboration Voucher",
    description: r.description ?? null,
    reward_label: r.reward_label ?? null,
    amount_npr: r.amount_npr != null ? Number(r.amount_npr) : null,
    currency: r.currency || "NPR",
    status: r.status,
    brand_name: r.brand_name ?? null,
    creator_name: r.creator_name ?? null,
    campaign_title: r.campaign_title ?? null,
    brand_note: r.brand_note ?? null,
    admin_note: r.admin_note ?? null,
    issued_at: r.issued_at ?? null,
    redeemed_at: r.redeemed_at ?? null,
    created_at: r.created_at,
  };
}

function missingTable(err: any): boolean {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    msg.includes("collab_vouchers") ||
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    err?.code === "PGRST205" ||
    err?.code === "42P01"
  );
}

/** Brand: generate voucher after collaboration deliverables are done. */
export const brandCreateVoucher = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: {
    collaborationId: string;
    rewardLabel?: string;
    amountNpr?: number;
    brandNote?: string;
  }) => {
    if (!data?.collaborationId) throw new Error("collaborationId required");
    return {
      collaborationId: String(data.collaborationId),
      rewardLabel: data.rewardLabel?.trim() || "Collaboration reward",
      amountNpr:
        typeof data.amountNpr === "number" && data.amountNpr > 0
          ? data.amountNpr
          : undefined,
      brandNote: data.brandNote?.trim() || undefined,
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: collab, error: cErr } = await supabase
      .from("collaborations")
      .select("id, brand_id, creator_id, campaign_id, status")
      .eq("id", data.collaborationId)
      .maybeSingle();
    if (cErr || !collab) return { success: false, message: "Collaboration not found." };
    if (collab.brand_id !== userId) {
      return { success: false, message: "Only the brand can generate this voucher." };
    }
    if (!["completed", "submitted"].includes(String(collab.status))) {
      // Allow if all deliverables approved
      const { data: dels } = await supabase
        .from("deliverables")
        .select("id, status")
        .eq("collaboration_id", collab.id);
      const list = dels ?? [];
      const allApproved =
        list.length > 0 &&
        list.every((d: any) => String(d.status).toLowerCase() === "approved");
      if (!allApproved && String(collab.status) !== "completed") {
        return {
          success: false,
          message:
            "Approve all deliverables (or complete the collaboration) before generating a voucher.",
        };
      }
    }

    const { data: existing } = await supabase
      .from("collab_vouchers")
      .select("id, status, code")
      .eq("collaboration_id", collab.id)
      .maybeSingle();
    if (existing?.id) {
      return {
        success: true,
        message: "Voucher already exists for this collaboration.",
        voucher: mapRow(existing),
        alreadyExists: true,
      };
    }

    const [{ data: brandProf }, { data: creatorProf }, { data: campaign }] =
      await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", collab.brand_id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", collab.creator_id).maybeSingle(),
        collab.campaign_id
          ? supabase
              .from("campaigns")
              .select("title, creator_reward, budget")
              .eq("id", collab.campaign_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

    let brandDisplay = brandProf?.full_name || "Brand";
    try {
      const { data: bp } = await supabase
        .from("brand_profiles")
        .select("business_name")
        .eq("user_id", collab.brand_id)
        .maybeSingle();
      if (bp?.business_name) brandDisplay = bp.business_name;
    } catch {
      /* ignore */
    }

    const amount =
      data.amountNpr ??
      (campaign?.creator_reward != null
        ? Number(campaign.creator_reward)
        : campaign?.budget != null
          ? Number(campaign.budget)
          : null);

    const code = genCode();
    const row = {
      collaboration_id: collab.id,
      campaign_id: collab.campaign_id,
      brand_id: collab.brand_id,
      creator_id: collab.creator_id,
      code,
      title: "NepCollab Collaboration Voucher",
      description: `Completed collaboration between ${brandDisplay} and ${creatorProf?.full_name || "creator"} on NepCollab.`,
      reward_label: data.rewardLabel,
      amount_npr: amount,
      currency: "NPR",
      status: "pending_admin",
      brand_name: brandDisplay,
      creator_name: creatorProf?.full_name || "Creator",
      campaign_title: campaign?.title || null,
      brand_note: data.brandNote || null,
    };

    const { data: inserted, error } = await supabase
      .from("collab_vouchers")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      if (missingTable(error)) {
        return {
          success: false,
          message:
            "Voucher table not installed yet. Run migration 20260825140000_collab_vouchers.sql in Supabase SQL editor.",
        };
      }
      return { success: false, message: error.message };
    }

    // Notify admin path via notification to creator that brand requested voucher
    try {
      await supabase.from("notifications").insert({
        user_id: collab.creator_id,
        title: "Reward voucher requested",
        body: `${brandDisplay} generated a NepCollab voucher for your collaboration. Admin will release it shortly.`,
      });
    } catch {
      /* optional */
    }

    return {
      success: true,
      message: "Voucher created — waiting for admin to release to creator.",
      voucher: mapRow(inserted),
      alreadyExists: false,
    };
  });

/** Admin: list all vouchers */
export const adminListVouchers = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) return { success: false, message: "Admin only.", vouchers: [] as CollabVoucher[] };

    const { data, error } = await supabase
      .from("collab_vouchers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      if (missingTable(error)) {
        return {
          success: false,
          message: "Run collab_vouchers migration in Supabase.",
          vouchers: [],
        };
      }
      return { success: false, message: error.message, vouchers: [] };
    }
    return { success: true, vouchers: (data ?? []).map(mapRow), message: "ok" };
  });

/** Admin: issue voucher to creator */
export const adminIssueVoucher = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: { voucherId: string; adminNote?: string }) => {
    if (!data?.voucherId) throw new Error("voucherId required");
    return { voucherId: String(data.voucherId), adminNote: data.adminNote?.trim() };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) return { success: false, message: "Admin only." };

    const { data: row, error } = await supabase
      .from("collab_vouchers")
      .select("*")
      .eq("id", data.voucherId)
      .maybeSingle();
    if (error || !row) return { success: false, message: "Voucher not found." };
    if (row.status === "issued") return { success: true, message: "Already issued.", voucher: mapRow(row) };
    if (row.status === "void") return { success: false, message: "Voucher was voided." };
    if (row.status === "redeemed") return { success: false, message: "Already redeemed." };

    const now = new Date().toISOString();
    const { data: updated, error: upErr } = await supabase
      .from("collab_vouchers")
      .update({
        status: "issued",
        issued_at: now,
        issued_by: userId,
        admin_note: data.adminNote || row.admin_note,
        updated_at: now,
      })
      .eq("id", row.id)
      .select("*")
      .single();
    if (upErr) return { success: false, message: upErr.message };

    try {
      await supabase.from("notifications").insert({
        user_id: row.creator_id,
        title: "Your NepCollab voucher is ready 🎁",
        body: `Code ${row.code} — open Vouchers to download, share to story, or redeem.`,
      });
    } catch {
      /* optional */
    }

    return { success: true, message: "Voucher issued to creator.", voucher: mapRow(updated) };
  });

/** Admin: void */
export const adminVoidVoucher = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: { voucherId: string }) => ({
    voucherId: String(data?.voucherId || ""),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) return { success: false, message: "Admin only." };
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("collab_vouchers")
      .update({ status: "void", voided_at: now, updated_at: now })
      .eq("id", data.voucherId);
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Voucher voided." };
  });

/** Creator / brand: list own vouchers */
export const listMyVouchers = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data, error } = await supabase
      .from("collab_vouchers")
      .select("*")
      .or(`creator_id.eq.${userId},brand_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      if (missingTable(error)) {
        return { success: false, message: "Vouchers not set up yet.", vouchers: [] as CollabVoucher[] };
      }
      return { success: false, message: error.message, vouchers: [] };
    }
    // Creators only see issued/redeemed (not pending internal drafts for privacy of admin queue)
    const rows = (data ?? []).filter((r: any) => {
      if (r.brand_id === userId) return true;
      return r.status === "issued" || r.status === "redeemed";
    });
    return { success: true, vouchers: rows.map(mapRow), message: "ok" };
  });

/** Creator: mark redeemed */
export const creatorRedeemVoucher = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: { voucherId: string }) => ({
    voucherId: String(data?.voucherId || ""),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: row } = await supabase
      .from("collab_vouchers")
      .select("*")
      .eq("id", data.voucherId)
      .eq("creator_id", userId)
      .maybeSingle();
    if (!row) return { success: false, message: "Voucher not found." };
    if (row.status !== "issued") {
      return { success: false, message: `Cannot redeem while status is ${row.status}.` };
    }
    const now = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from("collab_vouchers")
      .update({ status: "redeemed", redeemed_at: now, updated_at: now })
      .eq("id", row.id)
      .eq("creator_id", userId)
      .select("*")
      .single();
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Marked as redeemed. Enjoy!", voucher: mapRow(updated) };
  });
