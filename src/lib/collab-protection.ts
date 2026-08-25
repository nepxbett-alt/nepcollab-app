/**
 * Non-cash collaboration protection — server-side state transitions.
 * No wallets, payouts, or cash balances. Benefits are products/services/experiences only.
 */
import { createServerFn } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BenefitCommitmentStatus =
  | "pending"
  | "committed"
  | "available"
  | "redeemed"
  | "fulfilled"
  | "cancelled"
  | "disputed";

export type ProtectionStatus =
  | "pending_agreement"
  | "agreement_active"
  | "benefit_committed"
  | "benefit_available"
  | "benefit_redeemed"
  | "in_progress"
  | "submitted"
  | "revision_requested"
  | "completed"
  | "failed"
  | "cancelled"
  | "disputed";

const BENEFIT_TYPES = [
  "product",
  "service",
  "experience",
  "meal",
  "stay",
  "event_access",
  "ticket",
  "sample",
  "discount",
  "other",
] as const;

function missingCol(err: any): boolean {
  const m = String(err?.message || "").toLowerCase();
  return (
    err?.code === "42703" ||
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    m.includes("could not find")
  );
}

async function logEvent(
  supabase: any,
  collabId: string,
  eventType: string,
  oldStatus?: string | null,
  newStatus?: string | null,
  metadata?: Record<string, unknown>,
) {
  try {
    await supabase.rpc("log_collab_event", {
      p_collaboration_id: collabId,
      p_event_type: eventType,
      p_old_status: oldStatus ?? null,
      p_new_status: newStatus ?? null,
      p_metadata: metadata ?? {},
    });
  } catch {
    try {
      await supabase.from("collaboration_events").insert({
        collaboration_id: collabId,
        event_type: eventType,
        old_status: oldStatus ?? null,
        new_status: newStatus ?? null,
        metadata: metadata ?? {},
      });
    } catch {
      /* optional until migration applied */
    }
  }
}

async function notify(supabase: any, userId: string, title: string, body: string) {
  try {
    await supabase.from("notifications").insert({ user_id: userId, title, body });
  } catch {
    /* optional */
  }
}

function buildAgreementSnapshot(collab: any, campaign: any) {
  return {
    brand_id: collab.brand_id,
    creator_id: collab.creator_id,
    campaign_id: collab.campaign_id,
    campaign_title: campaign?.title ?? null,
    benefit: {
      type: collab.benefit_type || campaign?.benefit_type || null,
      title: collab.benefit_title || campaign?.benefit_title || campaign?.perks?.[0] || null,
      description:
        collab.benefit_description ||
        campaign?.benefit_description ||
        null,
      quantity: collab.benefit_quantity || campaign?.benefit_quantity || "1",
      terms: collab.benefit_terms || campaign?.benefit_terms || null,
      value_display:
        collab.benefit_value_display || campaign?.benefit_value_display || null,
      redemption_method:
        collab.redemption_method || campaign?.redemption_method || "manual",
    },
    deliverables: campaign?.deliverables ?? [],
    requirements: campaign?.requirements ?? null,
    revision_limit: collab.revision_limit ?? campaign?.revision_limit ?? 1,
    content_deadline_days: campaign?.content_deadline_days ?? 7,
    review_window_days: campaign?.review_window_days ?? 7,
    created_at: new Date().toISOString(),
  };
}

/** After accept: create v1 agreement from campaign benefit terms */
export const ensureCollaborationAgreement = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: { collaborationId: string }) => ({
    collaborationId: String(data?.collaborationId || ""),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: collab, error } = await supabase
      .from("collaborations")
      .select("*")
      .eq("id", data.collaborationId)
      .maybeSingle();
    if (error || !collab) return { success: false, message: "Collaboration not found." };
    if (collab.brand_id !== userId && collab.creator_id !== userId) {
      return { success: false, message: "Not a participant." };
    }

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", collab.campaign_id)
      .maybeSingle();

    // Seed benefit fields from campaign if empty
    const benefitPatch: Record<string, unknown> = {};
    if (!collab.benefit_title && campaign) {
      benefitPatch.benefit_type = campaign.benefit_type || "other";
      benefitPatch.benefit_title =
        campaign.benefit_title ||
        (Array.isArray(campaign.perks) && campaign.perks[0]) ||
        "Agreed non-cash benefit";
      benefitPatch.benefit_description = campaign.benefit_description || campaign.description;
      benefitPatch.benefit_quantity = campaign.benefit_quantity || "1";
      benefitPatch.benefit_terms = campaign.benefit_terms;
      benefitPatch.benefit_value_display = campaign.benefit_value_display;
      benefitPatch.redemption_method = campaign.redemption_method || "manual";
      benefitPatch.revision_limit = campaign.revision_limit ?? 1;
    }

    if (Object.keys(benefitPatch).length) {
      const { error: upErr } = await supabase
        .from("collaborations")
        .update(benefitPatch)
        .eq("id", collab.id);
      if (upErr && !missingCol(upErr)) {
        return { success: false, message: upErr.message };
      }
      Object.assign(collab, benefitPatch);
    }

    const { data: existing } = await supabase
      .from("collaboration_agreements")
      .select("id, version")
      .eq("collaboration_id", collab.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existing) {
      const snapshot = buildAgreementSnapshot(collab, campaign);
      const { error: aErr } = await supabase.from("collaboration_agreements").insert({
        collaboration_id: collab.id,
        version: 1,
        snapshot,
        created_by: userId,
      });
      if (aErr && !missingCol(aErr)) {
        return { success: false, message: aErr.message };
      }
      await logEvent(supabase, collab.id, "AGREEMENT_CREATED", null, "pending_agreement", {
        version: 1,
      });
    }

    return { success: true, message: "Agreement ready." };
  });

/** Both sides confirm agreement terms */
export const confirmCollaborationAgreement = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: { collaborationId: string }) => ({
    collaborationId: String(data?.collaborationId || ""),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: collab, error } = await supabase
      .from("collaborations")
      .select("*")
      .eq("id", data.collaborationId)
      .maybeSingle();
    if (error || !collab) return { success: false, message: "Collaboration not found." };

    const isBrand = collab.brand_id === userId;
    const isCreator = collab.creator_id === userId;
    if (!isBrand && !isCreator) return { success: false, message: "Not a participant." };

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {};
    if (isBrand) patch.agreement_confirmed_by_brand_at = now;
    if (isCreator) patch.agreement_confirmed_by_creator_at = now;

    const brandOk = isBrand || collab.agreement_confirmed_by_brand_at;
    const creatorOk = isCreator || collab.agreement_confirmed_by_creator_at;
    if (brandOk && creatorOk) {
      patch.protection_status = "agreement_active";
    }

    const { error: upErr } = await supabase
      .from("collaborations")
      .update(patch)
      .eq("id", collab.id);
    if (upErr) {
      if (missingCol(upErr)) {
        return {
          success: false,
          message:
            "Protection columns missing. Run migration 20260825160000_noncash_collab_protection.sql",
        };
      }
      return { success: false, message: upErr.message };
    }

    await logEvent(
      supabase,
      collab.id,
      "AGREEMENT_CONFIRMED",
      collab.protection_status,
      (patch.protection_status as string) || collab.protection_status,
      { by: isBrand ? "brand" : "creator" },
    );

    const other = isBrand ? collab.creator_id : collab.brand_id;
    await notify(
      supabase,
      other,
      "Agreement confirmation",
      isBrand
        ? "The brand confirmed the collaboration agreement."
        : "The creator confirmed the collaboration agreement.",
    );

    return {
      success: true,
      message:
        brandOk && creatorOk
          ? "Both sides confirmed. Brand can commit the benefit."
          : "Your confirmation is recorded. Waiting for the other party.",
      bothConfirmed: Boolean(brandOk && creatorOk),
    };
  });

/** Brand explicitly commits the non-cash benefit */
export const brandCommitBenefit = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: {
    collaborationId: string;
    redemptionCode?: string;
    redemptionInstructions?: string;
    makeAvailable?: boolean;
  }) => ({
    collaborationId: String(data?.collaborationId || ""),
    redemptionCode: data?.redemptionCode?.trim() || undefined,
    redemptionInstructions: data?.redemptionInstructions?.trim() || undefined,
    makeAvailable: data?.makeAvailable !== false,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: collab, error } = await supabase
      .from("collaborations")
      .select("*")
      .eq("id", data.collaborationId)
      .maybeSingle();
    if (error || !collab) return { success: false, message: "Collaboration not found." };
    if (collab.brand_id !== userId) {
      return { success: false, message: "Only the brand can commit the benefit." };
    }

    const now = new Date().toISOString();
    const code =
      data.redemptionCode ||
      collab.redemption_code ||
      `NPC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const patch: Record<string, unknown> = {
      benefit_commitment_status: data.makeAvailable ? "available" : "committed",
      benefit_committed_at: now,
      benefit_committed_by: userId,
      redemption_code: code,
      redemption_instructions:
        data.redemptionInstructions ||
        collab.redemption_instructions ||
        "Present this code / confirm inside NepCollab when you receive the benefit.",
      protection_status: data.makeAvailable ? "benefit_available" : "benefit_committed",
      updated_at: now,
    };
    if (data.makeAvailable) patch.benefit_available_at = now;

    const { error: upErr } = await supabase
      .from("collaborations")
      .update(patch)
      .eq("id", collab.id);
    if (upErr) {
      if (missingCol(upErr)) {
        return {
          success: false,
          message: "Run non-cash protection migration in Supabase SQL editor.",
        };
      }
      return { success: false, message: upErr.message };
    }

    await logEvent(
      supabase,
      collab.id,
      "BENEFIT_COMMITTED",
      collab.benefit_commitment_status,
      patch.benefit_commitment_status as string,
      { code },
    );
    await notify(
      supabase,
      collab.creator_id,
      "Benefit confirmed 🎁",
      "The brand committed your non-cash benefit. Open the collaboration to redeem when ready.",
    );

    return {
      success: true,
      message: "Benefit committed. Creator can redeem when ready.",
      redemptionCode: code,
    };
  });

/** Creator marks benefit redeemed / received */
export const creatorRedeemBenefit = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: { collaborationId: string; note?: string }) => ({
    collaborationId: String(data?.collaborationId || ""),
    note: data?.note?.trim() || undefined,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: collab, error } = await supabase
      .from("collaborations")
      .select("*")
      .eq("id", data.collaborationId)
      .maybeSingle();
    if (error || !collab) return { success: false, message: "Collaboration not found." };
    if (collab.creator_id !== userId) {
      return { success: false, message: "Only the creator can mark redemption." };
    }
    const status = collab.benefit_commitment_status;
    if (!["committed", "available"].includes(String(status))) {
      return {
        success: false,
        message: "Benefit is not available to redeem yet. Wait for the brand to commit it.",
      };
    }

    const now = new Date().toISOString();
    const days = 7;
    const deadline = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { error: upErr } = await supabase
      .from("collaborations")
      .update({
        benefit_commitment_status: "redeemed",
        benefit_redeemed_at: now,
        benefit_redeemed_by: userId,
        benefit_confirmed_received_at: now,
        protection_status: "in_progress",
        deliverable_deadline: collab.deliverable_deadline || deadline,
        status: collab.status === "completed" ? collab.status : "active",
        updated_at: now,
      })
      .eq("id", collab.id);
    if (upErr) return { success: false, message: upErr.message };

    await logEvent(supabase, collab.id, "BENEFIT_REDEEMED", status, "redeemed", {
      note: data.note,
    });
    await notify(
      supabase,
      collab.brand_id,
      "Creator redeemed benefit",
      "The creator marked the benefit as received. Deliverable work is now in progress.",
    );

    return {
      success: true,
      message: "Benefit marked as received. Complete your deliverable by the deadline.",
      deliverableDeadline: deadline,
    };
  });

/** After submit: set review deadline (brand has N days) */
export const markSubmittedForReview = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: { collaborationId: string }) => ({
    collaborationId: String(data?.collaborationId || ""),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: collab } = await supabase
      .from("collaborations")
      .select("*")
      .eq("id", data.collaborationId)
      .maybeSingle();
    if (!collab || collab.creator_id !== userId) {
      return { success: false, message: "Not allowed." };
    }
    const reviewDays = 7;
    const reviewDeadline = new Date(
      Date.now() + reviewDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { error } = await supabase
      .from("collaborations")
      .update({
        protection_status: "submitted",
        status: "submitted",
        review_deadline: reviewDeadline,
        updated_at: new Date().toISOString(),
      })
      .eq("id", collab.id);
    if (error && !missingCol(error)) return { success: false, message: error.message };

    await logEvent(supabase, collab.id, "DELIVERABLE_SUBMITTED", null, "submitted", {
      review_deadline: reviewDeadline,
    });
    await notify(
      supabase,
      collab.brand_id,
      "Deliverable submitted",
      `Review within ${reviewDays} days. No response → collaboration may auto-complete.`,
    );
    return { success: true, message: "Submitted for brand review.", reviewDeadline };
  });

/** Open dispute (either side) */
export const openCollabDispute = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: {
    collaborationId: string;
    reason: string;
    description?: string;
  }) => {
    if (!data?.collaborationId || !data?.reason?.trim()) {
      throw new Error("collaborationId and reason required");
    }
    return {
      collaborationId: data.collaborationId,
      reason: data.reason.trim().slice(0, 200),
      description: data.description?.trim().slice(0, 2000),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: collab } = await supabase
      .from("collaborations")
      .select("*")
      .eq("id", data.collaborationId)
      .maybeSingle();
    if (!collab) return { success: false, message: "Collaboration not found." };
    if (collab.brand_id !== userId && collab.creator_id !== userId) {
      return { success: false, message: "Not a participant." };
    }
    const against =
      collab.brand_id === userId ? collab.creator_id : collab.brand_id;

    const { data: row, error } = await supabase
      .from("disputes")
      .insert({
        collaboration_id: collab.id,
        opened_by: userId,
        against_id: against,
        reason: data.reason,
        description: data.description || null,
        status: "open",
      })
      .select("id")
      .single();
    if (error) return { success: false, message: error.message };

    await supabase
      .from("collaborations")
      .update({
        protection_status: "disputed",
        benefit_commitment_status:
          collab.benefit_commitment_status === "redeemed"
            ? "disputed"
            : collab.benefit_commitment_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", collab.id);

    await logEvent(supabase, collab.id, "DISPUTE_OPENED", null, "disputed", {
      reason: data.reason,
      dispute_id: row?.id,
    });
    await notify(supabase, against, "Dispute opened", data.reason);

    return { success: true, message: "Dispute opened for admin review.", disputeId: row?.id };
  });

export const BENEFIT_TYPE_OPTIONS = BENEFIT_TYPES.map((t) => ({
  value: t,
  label: t
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" "),
}));
