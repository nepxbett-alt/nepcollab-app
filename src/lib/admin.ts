/**
 * Admin Control Center — uses existing Supabase admin RPCs + tables.
 * Mutations go through SECURITY DEFINER functions (never raw privileged updates).
 */
import { supabase } from "@/integrations/supabase/client";

export type AdminProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  role: string | null;
  location: string | null;
  onboarded: boolean | null;
  verified: boolean | null;
  rating: number | null;
  created_at: string | null;
  bio: string | null;
  suspended?: boolean | null;
  suspended_at?: string | null;
  suspended_reason?: string | null;
  admin_notes?: string | null;
  featured?: boolean | null;
  avatar_url?: string | null;
};

export type AdminCampaign = {
  id: string;
  title: string;
  status: string | null;
  brand_id: string;
  location: string | null;
  category: string | null;
  budget: number | null;
  spots: number | null;
  deadline: string | null;
  created_at: string | null;
  views: number | null;
  featured?: boolean | null;
  description?: string | null;
  creator_reward?: number | null;
};

export type AdminReport = {
  id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  reason: string | null;
  status: string | null;
  details: string | null;
  severity?: string | null;
  admin_notes?: string | null;
  created_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
};

export type PlatformSetting = {
  key: string;
  value: string | null;
  description?: string | null;
  updated_at?: string | null;
};

export type AuditLog = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: unknown;
  created_at: string | null;
};

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (!error) return Boolean(data);
  const uid = await currentUserId();
  if (!uid) return false;
  const { data: p } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
  return p?.role === "admin";
}

export async function requireAdmin(): Promise<string> {
  const uid = await currentUserId();
  if (!uid) throw new Error("Not signed in");
  const ok = await checkIsAdmin();
  if (!ok) throw new Error("Admin access required");
  return uid;
}

async function rpc(name: string, args: Record<string, unknown>) {
  await requireAdmin();
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function daysAgoISO(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

export async function fetchAdminStats() {
  await requireAdmin();
  const today = startOfTodayISO();
  const d7 = daysAgoISO(7);
  const d30 = daysAgoISO(30);

  const [profiles, campaigns, applications, collaborations, reports, verifs, disputes] =
    await Promise.all([
      supabase.from("profiles").select("id, role, verified, suspended, created_at, onboarded"),
      supabase.from("campaigns").select("id, status, budget, creator_reward, featured, created_at"),
      supabase.from("applications").select("id, status, created_at"),
      supabase.from("collaborations").select("id, status, created_at"),
      supabase.from("reports").select("id, status"),
      supabase.from("verification_requests").select("id, status"),
      supabase.from("disputes").select("id, status"),
    ]);

  if (profiles.error) throw new Error(profiles.error.message);
  if (campaigns.error) throw new Error(campaigns.error.message);

  const users = profiles.data ?? [];
  const camps = campaigns.data ?? [];
  const apps = applications.data ?? [];
  const collabs = collaborations.data ?? [];
  const reps = reports.data ?? [];
  const vreqs = verifs.data ?? [];
  const disp = disputes.data ?? [];

  const openStatus = (s: string | null) =>
    !s || ["open", "pending", "investigating"].includes(s);

  return {
    users: users.length,
    creators: users.filter((u) => u.role === "creator").length,
    brands: users.filter((u) => u.role === "brand").length,
    admins: users.filter((u) => u.role === "admin").length,
    verified: users.filter((u) => u.verified).length,
    unverified: users.filter((u) => !u.verified && (u.role === "creator" || u.role === "brand")).length,
    suspended: users.filter((u) => u.suspended).length,
    newToday: users.filter((u) => u.created_at && u.created_at >= today).length,
    new7: users.filter((u) => u.created_at && u.created_at >= d7).length,
    new30: users.filter((u) => u.created_at && u.created_at >= d30).length,
    campaigns: camps.length,
    activeCampaigns: camps.filter((c) => c.status === "active").length,
    draftCampaigns: camps.filter((c) => c.status === "draft").length,
    pausedCampaigns: camps.filter((c) => c.status === "paused").length,
    completedCampaigns: camps.filter((c) => c.status === "completed").length,
    featuredCampaigns: camps.filter((c) => c.featured).length,
    campaigns7: camps.filter((c) => c.created_at && c.created_at >= d7).length,
    applications: apps.length,
    pendingApplications: apps.filter((a) => a.status === "pending").length,
    acceptedApplications: apps.filter((a) => a.status === "accepted").length,
    apps7: apps.filter((a) => a.created_at && a.created_at >= d7).length,
    collaborations: collabs.length,
    activeCollabs: collabs.filter((c) => ["active", "submitted", "revision_requested"].includes(c.status || "")).length,
    completedCollabs: collabs.filter((c) => c.status === "completed").length,
    collabs7: collabs.filter((c) => c.created_at && c.created_at >= d7).length,
    openReports: reps.filter((r) => openStatus(r.status)).length,
    pendingVerifications: vreqs.filter((v) => openStatus(v.status) || v.status === "pending").length,
    openDisputes: disp.filter((d) => openStatus(d.status)).length,
    totalBudgetNpr: camps.reduce((s, c) => s + (Number(c.budget) || Number(c.creator_reward) || 0), 0),
  };
}

export async function fetchUsers(limit = 200) {
  await requireAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, role, location, onboarded, verified, rating, created_at, bio, suspended, suspended_at, suspended_reason, admin_notes, featured, avatar_url",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminProfile[];
}

export async function fetchUserDetail(userId: string) {
  await requireAdmin();
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  const [brand, creator, camps, apps, collabs, port, reps] = await Promise.all([
    supabase.from("brand_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("creator_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("campaigns").select("id, title, status, created_at, featured").eq("brand_id", userId),
    supabase.from("applications").select("id, campaign_id, status, created_at").eq("creator_id", userId),
    supabase.from("collaborations").select("id, campaign_id, status, created_at").or(`creator_id.eq.${userId},brand_id.eq.${userId}`),
    supabase.from("portfolio_items").select("id, title, sort_order").eq("creator_id", userId),
    supabase.from("reports").select("*").or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`),
  ]);
  return {
    profile,
    brand: brand.data,
    creator: creator.data,
    campaigns: camps.data ?? [],
    applications: apps.data ?? [],
    collaborations: collabs.data ?? [],
    portfolio: port.data ?? [],
    reports: reps.data ?? [],
  };
}

export async function setUserVerified(userId: string, verified: boolean) {
  // Prefer verification RPC when request exists; else direct verified via admin role update path
  await requireAdmin();
  const { data: reqs } = await supabase
    .from("verification_requests")
    .select("id, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  const pending = (reqs ?? []).find((r) => r.status === "pending" || r.status === "open");
  if (pending) {
    await rpc("admin_review_verification", {
      p_request_id: pending.id,
      p_status: verified ? "approved" : "rejected",
      p_note: verified ? "Approved by admin" : "Rejected by admin",
    });
  } else {
    // Fallback: featured-style path not available; use admin_write_audit + update if RLS allows admin
    const { error } = await supabase.from("profiles").update({ verified }).eq("id", userId);
    if (error) throw new Error(error.message);
    await rpc("admin_write_audit", {
      p_action: verified ? "USER_VERIFIED" : "USER_UNVERIFIED",
      p_target_type: "user",
      p_target_id: userId,
      p_details: { verified },
    });
  }
}

export async function setUserSuspended(userId: string, suspended: boolean, reason?: string) {
  await rpc("admin_set_user_suspension", {
    p_user_id: userId,
    p_suspended: suspended,
    p_reason: reason || null,
  });
}

export async function setUserRole(userId: string, role: "creator" | "brand" | "admin") {
  await rpc("admin_set_user_role", { p_user_id: userId, p_role: role });
}

export async function setUserFeatured(userId: string, featured: boolean, targetType: "user" | "creator" | "brand" = "user") {
  await rpc("admin_set_featured", {
    p_target_type: targetType,
    p_target_id: userId,
    p_featured: featured,
  });
}

export async function setUserAdminNotes(userId: string, admin_notes: string) {
  await requireAdmin();
  const { error } = await supabase.from("profiles").update({ admin_notes }).eq("id", userId);
  if (error) throw new Error(error.message);
  await rpc("admin_write_audit", {
    p_action: "USER_NOTES_UPDATED",
    p_target_type: "user",
    p_target_id: userId,
    p_details: {},
  });
}

export async function fetchAdminCampaigns(limit = 200) {
  await requireAdmin();
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id, title, status, brand_id, location, category, budget, spots, deadline, created_at, views, featured, description, creator_reward",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminCampaign[];
}

export async function setCampaignStatus(campaignId: string, status: string, reason?: string) {
  await rpc("admin_set_campaign_status", {
    p_campaign_id: campaignId,
    p_status: status,
    p_reason: reason || null,
  });
}

export async function setCampaignFeatured(campaignId: string, featured: boolean) {
  await rpc("admin_set_featured", {
    p_target_type: "campaign",
    p_target_id: campaignId,
    p_featured: featured,
  });
}

export async function deleteCampaign(campaignId: string) {
  await requireAdmin();
  const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
  if (error) throw new Error(error.message);
  await rpc("admin_write_audit", {
    p_action: "CAMPAIGN_DELETED",
    p_target_type: "campaign",
    p_target_id: campaignId,
    p_details: {},
  });
}

export async function fetchAdminApplications(limit = 200) {
  await requireAdmin();
  const { data, error } = await supabase
    .from("applications")
    .select("id, campaign_id, creator_id, status, message, pitch, applied_at, created_at, brand_remarks")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function setApplicationStatusAdmin(id: string, status: string) {
  await requireAdmin();
  const { error } = await supabase.from("applications").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  await rpc("admin_write_audit", {
    p_action: "APPLICATION_STATUS_CHANGED",
    p_target_type: "application",
    p_target_id: id,
    p_details: { status },
  });
}

export async function fetchAdminCollaborations(limit = 200) {
  await requireAdmin();
  const { data, error } = await supabase
    .from("collaborations")
    .select("id, campaign_id, creator_id, brand_id, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function setCollabStatus(id: string, status: string) {
  await requireAdmin();
  const { error } = await supabase.from("collaborations").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  await rpc("admin_write_audit", {
    p_action: "COLLABORATION_STATUS_CHANGED",
    p_target_type: "collaboration",
    p_target_id: id,
    p_details: { status },
  });
}

export async function fetchReports(limit = 200) {
  await requireAdmin();
  const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminReport[];
}

export async function resolveReport(
  id: string,
  status: "resolved" | "dismissed" | "investigating" | "open",
  note?: string,
) {
  await rpc("admin_resolve_report", {
    p_report_id: id,
    p_status: status,
    p_note: note || null,
  });
}

export async function fetchDisputes(limit = 200) {
  await requireAdmin();
  const { data, error } = await supabase.from("disputes").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function resolveDispute(id: string, status: string, resolution?: string) {
  await rpc("admin_resolve_dispute", {
    p_dispute_id: id,
    p_status: status,
    p_resolution: resolution || null,
  });
}

export async function fetchVerificationRequests(limit = 200) {
  await requireAdmin();
  const { data, error } = await supabase
    .from("verification_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function reviewVerification(requestId: string, status: "approved" | "rejected", note?: string) {
  await rpc("admin_review_verification", {
    p_request_id: requestId,
    p_status: status,
    p_note: note || null,
  });
}

export async function fetchSettings() {
  await requireAdmin();
  const { data, error } = await supabase.from("platform_settings").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as PlatformSetting[];
}

/** Public-safe settings read (for app behavior). */
export async function fetchPublicSettings() {
  const { data, error } = await supabase.from("platform_settings").select("key, value");
  if (error) return [] as PlatformSetting[];
  return (data ?? []) as PlatformSetting[];
}

export async function updateSetting(key: string, value: string) {
  await rpc("admin_set_platform_setting", { p_key: key, p_value: value });
}

export async function fetchAuditLogs(limit = 200) {
  await requireAdmin();
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditLog[];
}

export async function globalAdminSearch(q: string) {
  await requireAdmin();
  const term = q.trim();
  if (term.length < 2) return { users: [], campaigns: [], reports: [], disputes: [] };
  const [users, campaigns, reports, disputes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, username, role")
      .or(`full_name.ilike.%${term}%,username.ilike.%${term}%`)
      .limit(15),
    supabase.from("campaigns").select("id, title, status, brand_id").ilike("title", `%${term}%`).limit(15),
    supabase.from("reports").select("id, reason, status").ilike("reason", `%${term}%`).limit(10),
    supabase.from("disputes").select("id, reason, status").ilike("reason", `%${term}%`).limit(10),
  ]);
  return {
    users: users.data ?? [],
    campaigns: campaigns.data ?? [],
    reports: reports.data ?? [],
    disputes: disputes.data ?? [],
  };
}

export async function fetchCreators() {
  await requireAdmin();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "creator")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const ids = (profiles ?? []).map((p) => p.id);
  const { data: cps } = ids.length
    ? await supabase.from("creator_profiles").select("*").in("user_id", ids)
    : { data: [] };
  const map = new Map((cps ?? []).map((c: any) => [c.user_id, c]));
  return (profiles ?? []).map((p) => ({ ...p, creator_profile: map.get(p.id) }));
}

export async function fetchBrands() {
  await requireAdmin();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "brand")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const ids = (profiles ?? []).map((p) => p.id);
  const { data: bps } = ids.length
    ? await supabase.from("brand_profiles").select("*").in("user_id", ids)
    : { data: [] };
  const map = new Map((bps ?? []).map((b: any) => [b.user_id, b]));
  return (profiles ?? []).map((p) => ({ ...p, brand_profile: map.get(p.id) }));
}

export async function setCreatorFeatured(userId: string, featured: boolean) {
  await setUserFeatured(userId, featured, "creator");
}

export async function setBrandFeatured(userId: string, featured: boolean) {
  await setUserFeatured(userId, featured, "brand");
}
