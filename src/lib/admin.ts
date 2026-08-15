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
};

export type AdminReport = {
  id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  reason: string | null;
  status: string | null;
  details: string | null;
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

async function audit(action: string, target_type: string, target_id: string | null, details: Record<string, unknown> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action,
      target_type,
      target_id,
      details,
    });
  } catch {
    /* non-fatal */
  }
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    // Fallback: profile role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return p?.role === "admin";
  }
  return Boolean(data);
}

export async function fetchAdminStats() {
  const [profiles, campaigns, applications, collaborations, reports] = await Promise.all([
    supabase.from("profiles").select("id, role, onboarded, verified", { count: "exact" }),
    supabase.from("campaigns").select("id, status", { count: "exact" }),
    supabase.from("applications").select("id, status", { count: "exact" }),
    supabase.from("collaborations").select("id, status", { count: "exact" }),
    supabase.from("reports").select("id, status", { count: "exact" }),
  ]);
  const users = profiles.data ?? [];
  const camps = campaigns.data ?? [];
  const apps = applications.data ?? [];
  const collabs = collaborations.data ?? [];
  const reps = reports.data ?? [];
  return {
    users: profiles.count ?? users.length,
    creators: users.filter((u) => u.role === "creator").length,
    brands: users.filter((u) => u.role === "brand").length,
    admins: users.filter((u) => u.role === "admin").length,
    verified: users.filter((u) => u.verified).length,
    campaigns: campaigns.count ?? camps.length,
    activeCampaigns: camps.filter((c) => c.status === "active").length,
    applications: applications.count ?? apps.length,
    pendingApplications: apps.filter((a) => a.status === "pending").length,
    collaborations: collaborations.count ?? collabs.length,
    openReports: reps.filter((r) => !r.status || r.status === "open" || r.status === "pending").length,
  };
}

export async function fetchUsers(limit = 100) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, role, location, onboarded, verified, rating, created_at, bio")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminProfile[];
}

export async function setUserVerified(userId: string, verified: boolean) {
  const { error } = await supabase.from("profiles").update({ verified }).eq("id", userId);
  if (error) throw new Error(error.message);
  await audit(verified ? "verify_user" : "unverify_user", "user", userId);
}

export async function setUserRole(userId: string, role: "creator" | "brand" | "admin") {
  if (role === "admin") {
    const { error } = await supabase.rpc("grant_admin", { p_user_id: userId });
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  await audit("set_role", "user", userId, { role });
}

export async function fetchAdminCampaigns(limit = 100) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, title, status, brand_id, location, category, budget, spots, deadline, created_at, views")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminCampaign[];
}

export async function setCampaignStatus(campaignId: string, status: string) {
  const { error } = await supabase.from("campaigns").update({ status }).eq("id", campaignId);
  if (error) throw new Error(error.message);
  await audit("set_campaign_status", "campaign", campaignId, { status });
}

export async function deleteCampaign(campaignId: string) {
  const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
  if (error) throw new Error(error.message);
  await audit("delete_campaign", "campaign", campaignId);
}

export async function fetchAdminApplications(limit = 100) {
  const { data, error } = await supabase
    .from("applications")
    .select("id, campaign_id, creator_id, status, message, pitch, applied_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function setApplicationStatusAdmin(id: string, status: string) {
  const { error } = await supabase.from("applications").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  await audit("set_application_status", "application", id, { status });
}

export async function fetchAdminCollaborations(limit = 100) {
  const { data, error } = await supabase
    .from("collaborations")
    .select("id, campaign_id, creator_id, brand_id, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function setCollabStatus(id: string, status: string) {
  const { error } = await supabase.from("collaborations").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  await audit("set_collab_status", "collaboration", id, { status });
}

export async function fetchReports(limit = 100) {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminReport[];
}

export async function resolveReport(id: string, status: "resolved" | "dismissed") {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("reports")
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await audit("resolve_report", "report", id, { status });
}

export async function fetchSettings() {
  const { data, error } = await supabase.from("platform_settings").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as PlatformSetting[];
}

export async function updateSetting(key: string, value: string) {
  const { error } = await supabase
    .from("platform_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  await audit("update_setting", "setting", null, { key, value });
}

export async function fetchAuditLogs(limit = 50) {
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditLog[];
}
