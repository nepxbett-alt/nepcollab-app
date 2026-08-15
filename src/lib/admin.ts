/**
 * Admin Control Center — real Supabase operations only.
 * Authorization: is_admin() RPC + profiles.role === 'admin' + RLS policies.
 * Never uses service role in the browser.
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
  target_type?: string | null;
  target_id?: string | null;
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

/** Throws if caller is not admin — call before mutations. */
export async function requireAdmin(): Promise<string> {
  const uid = await currentUserId();
  if (!uid) throw new Error("Not signed in");
  const ok = await checkIsAdmin();
  if (!ok) throw new Error("Admin access required");
  return uid;
}

export async function audit(
  action: string,
  target_type: string,
  target_id: string | null,
  details: Record<string, unknown> = {},
) {
  try {
    const admin_id = await currentUserId();
    if (!admin_id) return;
    await supabase.from("admin_audit_logs").insert({
      admin_id,
      action,
      target_type,
      target_id,
      details,
    });
  } catch {
    /* non-fatal */
  }
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
  const week = daysAgoISO(7);

  const [profiles, campaigns, applications, collaborations, reports] = await Promise.all([
    supabase.from("profiles").select("id, role, onboarded, verified, suspended, created_at"),
    supabase.from("campaigns").select("id, status, budget, creator_reward, featured"),
    supabase.from("applications").select("id, status"),
    supabase.from("collaborations").select("id, status"),
    supabase.from("reports").select("id, status"),
  ]);

  if (profiles.error) throw new Error(profiles.error.message);
  if (campaigns.error) throw new Error(campaigns.error.message);

  const users = profiles.data ?? [];
  const camps = campaigns.data ?? [];
  const apps = applications.data ?? [];
  const collabs = collaborations.data ?? [];
  const reps = reports.data ?? [];

  const totalBudget = camps.reduce((s, c) => s + (Number(c.budget) || Number(c.creator_reward) || 0), 0);

  return {
    users: users.length,
    creators: users.filter((u) => u.role === "creator").length,
    brands: users.filter((u) => u.role === "brand").length,
    admins: users.filter((u) => u.role === "admin").length,
    verified: users.filter((u) => u.verified).length,
    unverified: users.filter((u) => !u.verified && (u.role === "creator" || u.role === "brand")).length,
    suspended: users.filter((u) => u.suspended).length,
    newToday: users.filter((u) => u.created_at && u.created_at >= today).length,
    newWeek: users.filter((u) => u.created_at && u.created_at >= week).length,
    campaigns: camps.length,
    activeCampaigns: camps.filter((c) => c.status === "active").length,
    draftCampaigns: camps.filter((c) => c.status === "draft").length,
    completedCampaigns: camps.filter((c) => c.status === "completed").length,
    featuredCampaigns: camps.filter((c) => c.featured).length,
    applications: apps.length,
    pendingApplications: apps.filter((a) => a.status === "pending").length,
    acceptedApplications: apps.filter((a) => a.status === "accepted").length,
    collaborations: collabs.length,
    activeCollabs: collabs.filter((c) => c.status === "active" || c.status === "submitted").length,
    completedCollabs: collabs.filter((c) => c.status === "completed").length,
    openReports: reps.filter((r) => !r.status || r.status === "open" || r.status === "pending" || r.status === "investigating").length,
    totalBudgetNpr: totalBudget,
  };
}

export async function fetchUsers(limit = 200) {
  await requireAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, role, location, onboarded, verified, rating, created_at, bio, suspended, suspended_at, suspended_reason, admin_notes, featured",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    // fallback without new columns
    const { data: d2, error: e2 } = await supabase
      .from("profiles")
      .select("id, full_name, username, role, location, onboarded, verified, rating, created_at, bio")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (e2) throw new Error(e2.message);
    return (d2 ?? []) as AdminProfile[];
  }
  return (data ?? []) as AdminProfile[];
}

export async function fetchUserDetail(userId: string) {
  await requireAdmin();
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  const [brand, creator, camps, apps, collabs, port, reps] = await Promise.all([
    supabase.from("brand_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("creator_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("campaigns").select("id, title, status, created_at").eq("brand_id", userId),
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
  await requireAdmin();
  const { error } = await supabase.from("profiles").update({ verified }).eq("id", userId);
  if (error) throw new Error(error.message);
  await audit(verified ? "USER_VERIFIED" : "USER_UNVERIFIED", "user", userId, { verified });
}

export async function setUserSuspended(userId: string, suspended: boolean, reason?: string) {
  await requireAdmin();
  const patch: Record<string, unknown> = {
    suspended,
    suspended_at: suspended ? new Date().toISOString() : null,
    suspended_reason: suspended ? reason || null : null,
  };
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw new Error(error.message);
  await audit(suspended ? "USER_SUSPENDED" : "USER_UNSUSPENDED", "user", userId, { reason });
}

export async function setUserFeatured(userId: string, featured: boolean) {
  await requireAdmin();
  const { error } = await supabase.from("profiles").update({ featured }).eq("id", userId);
  if (error) throw new Error(error.message);
  await audit(featured ? "USER_FEATURED" : "USER_UNFEATURED", "user", userId);
}

export async function setUserAdminNotes(userId: string, admin_notes: string) {
  await requireAdmin();
  const { error } = await supabase.from("profiles").update({ admin_notes }).eq("id", userId);
  if (error) throw new Error(error.message);
  await audit("USER_NOTES_UPDATED", "user", userId);
}

export async function setUserRole(userId: string, role: "creator" | "brand" | "admin") {
  await requireAdmin();
  if (role === "admin") {
    const { error } = await supabase.rpc("grant_admin", { p_user_id: userId });
    if (error) throw new Error(error.message);
    await audit("USER_ROLE_CHANGED", "user", userId, { role: "admin" });
    return;
  }
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  await audit("USER_ROLE_CHANGED", "user", userId, { role });
}

export async function fetchAdminCampaigns(limit = 200) {
  await requireAdmin();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, title, status, brand_id, location, category, budget, spots, deadline, created_at, views, featured, description, creator_reward")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    const { data: d2, error: e2 } = await supabase
      .from("campaigns")
      .select("id, title, status, brand_id, location, category, budget, spots, deadline, created_at, views")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (e2) throw new Error(e2.message);
    return (d2 ?? []) as AdminCampaign[];
  }
  return (data ?? []) as AdminCampaign[];
}

export async function setCampaignStatus(campaignId: string, status: string) {
  await requireAdmin();
  const { error } = await supabase.from("campaigns").update({ status }).eq("id", campaignId);
  if (error) throw new Error(error.message);
  await audit("CAMPAIGN_STATUS_CHANGED", "campaign", campaignId, { status });
}

export async function setCampaignFeatured(campaignId: string, featured: boolean) {
  await requireAdmin();
  const { error } = await supabase.from("campaigns").update({ featured }).eq("id", campaignId);
  if (error) throw new Error(error.message);
  await audit(featured ? "CAMPAIGN_FEATURED" : "CAMPAIGN_UNFEATURED", "campaign", campaignId);
}

export async function deleteCampaign(campaignId: string) {
  await requireAdmin();
  const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
  if (error) throw new Error(error.message);
  await audit("CAMPAIGN_DELETED", "campaign", campaignId);
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
  await audit("APPLICATION_STATUS_CHANGED", "application", id, { status });
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
  await audit("COLLABORATION_STATUS_CHANGED", "collaboration", id, { status });
}

export async function fetchReports(limit = 200) {
  await requireAdmin();
  const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminReport[];
}

export async function resolveReport(id: string, status: "resolved" | "dismissed" | "investigating" | "open", notes?: string) {
  await requireAdmin();
  const uid = await currentUserId();
  const patch: Record<string, unknown> = {
    status,
    resolved_at: status === "resolved" || status === "dismissed" ? new Date().toISOString() : null,
    resolved_by: status === "resolved" || status === "dismissed" ? uid : null,
  };
  if (notes !== undefined) patch.admin_notes = notes;
  const { error } = await supabase.from("reports").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  await audit("REPORT_STATUS_CHANGED", "report", id, { status, notes });
}

export async function fetchSettings() {
  await requireAdmin();
  const { data, error } = await supabase.from("platform_settings").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as PlatformSetting[];
}

export async function updateSetting(key: string, value: string) {
  await requireAdmin();
  const { error } = await supabase
    .from("platform_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  await audit("SETTING_UPDATED", "setting", null, { key, value });
}

export async function fetchAuditLogs(limit = 100) {
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
  if (!term) return { users: [], campaigns: [], applications: [] };
  const like = `%${term}%`;
  const [users, campaigns] = await Promise.all([
    supabase.from("profiles").select("id, full_name, username, role").or(`full_name.ilike.${like},username.ilike.${like}`).limit(20),
    supabase.from("campaigns").select("id, title, status, brand_id").ilike("title", `%${term}%`).limit(20),
  ]);
  return {
    users: users.data ?? [],
    campaigns: campaigns.data ?? [],
    applications: [] as any[],
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
  await requireAdmin();
  await supabase.from("profiles").update({ featured }).eq("id", userId);
  const { error } = await supabase.from("creator_profiles").update({ featured }).eq("user_id", userId);
  if (error && !/column|schema cache/i.test(error.message)) throw new Error(error.message);
  await audit(featured ? "CREATOR_FEATURED" : "CREATOR_UNFEATURED", "user", userId);
}

export async function setBrandFeatured(userId: string, featured: boolean) {
  await requireAdmin();
  await supabase.from("profiles").update({ featured }).eq("id", userId);
  const { error } = await supabase.from("brand_profiles").update({ featured }).eq("user_id", userId);
  if (error && !/column|schema cache/i.test(error.message)) throw new Error(error.message);
  await audit(featured ? "BRAND_FEATURED" : "BRAND_UNFEATURED", "user", userId);
}
