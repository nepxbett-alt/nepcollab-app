import { supabase } from "@/integrations/supabase/client";
import { requireAdmin } from "@/lib/admin";

export type CreatorRegStatus = "pending" | "active" | "paused";

export type CreatorRegistration = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  niche: string | null;
  location: string | null;
  platforms: string | null;
  followers_text: string | null;
  bio: string | null;
  status: CreatorRegStatus;
  notify_new_businesses: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatorAlert = {
  id: string;
  listing_id: string | null;
  title: string;
  message: string;
  created_by: string | null;
  created_at: string;
};

export type CreatorRegInput = {
  full_name: string;
  email: string;
  phone?: string;
  niche?: string;
  location?: string;
  platforms?: string;
  followers_text?: string;
  bio?: string;
};

function clean(s: string, max: number) {
  return String(s || "").trim().slice(0, max);
}

export function validateCreatorReg(input: CreatorRegInput): string | null {
  if (clean(input.full_name, 100).length < 2) return "Enter your name.";
  const email = clean(input.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Enter a valid email.";
  return null;
}

export async function submitCreatorRegistration(input: CreatorRegInput): Promise<void> {
  const err = validateCreatorReg(input);
  if (err) throw new Error(err);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row = {
    full_name: clean(input.full_name, 100),
    email: clean(input.email, 120).toLowerCase(),
    phone: clean(input.phone || "", 30) || null,
    niche: clean(input.niche || "", 80) || null,
    location: clean(input.location || "", 80) || null,
    platforms: clean(input.platforms || "", 120) || null,
    followers_text: clean(input.followers_text || "", 40) || null,
    bio: clean(input.bio || "", 2000) || null,
    status: "pending",
    notify_new_businesses: true,
    user_id: user?.id ?? null,
  };

  const { error } = await (supabase as any).from("creator_registrations").insert(row);
  if (error) {
    const msg = String(error.message || "").toLowerCase();
    if (msg.includes("unique") || msg.includes("duplicate")) {
      throw new Error("This email is already registered. Sign in to open your creator space.");
    }
    if (msg.includes("does not exist") || msg.includes("schema")) {
      throw new Error("Creator signup is being set up. Please try again shortly.");
    }
    throw new Error("Could not register. Please try again.");
  }
}

export async function claimCreatorByEmail(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return 0;
  const { data, error } = await (supabase as any)
    .from("creator_registrations")
    .update({ user_id: user.id })
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .ilike("email", user.email)
    .select("id");
  if (error) return 0;
  const n = (data ?? []).length;
  if (n > 0) {
    await (supabase as any)
      .from("profiles")
      .update({ role: "creator", onboarded: true })
      .eq("id", user.id)
      .neq("role", "admin");
  }
  return n;
}

export async function fetchMyCreatorRegistration(): Promise<CreatorRegistration | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await (supabase as any)
    .from("creator_registrations")
    .select("*")
    .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    // fallback without or
    const { data: d2 } = await (supabase as any)
      .from("creator_registrations")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    return (d2 as CreatorRegistration) ?? null;
  }
  return (data as CreatorRegistration) ?? null;
}

export async function fetchCreatorAlerts(limit = 30): Promise<CreatorAlert[]> {
  const { data, error } = await (supabase as any)
    .from("creator_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as CreatorAlert[];
}

export async function adminFetchCreators(limit = 150): Promise<CreatorRegistration[]> {
  await requireAdmin();
  const { data, error } = await (supabase as any)
    .from("creator_registrations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as CreatorRegistration[];
}

export async function adminUpdateCreator(
  id: string,
  patch: Partial<Pick<CreatorRegistration, "status" | "admin_notes" | "notify_new_businesses">>,
): Promise<void> {
  await requireAdmin();
  const { error } = await (supabase as any).from("creator_registrations").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminNotifyCreatorsAboutListing(input: {
  listing_id: string;
  business_name: string;
  category?: string | null;
  location?: string | null;
}): Promise<void> {
  await requireAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const title = `New business listed: ${input.business_name}`;
  const parts = [
    `${input.business_name} is now on NepCollab.`,
    input.category ? `Category: ${input.category}.` : "",
    input.location ? `Location: ${input.location}.` : "",
    "Open your creator space for details. We'll reach out if you're a strong fit.",
  ].filter(Boolean);
  const { error } = await (supabase as any).from("creator_alerts").insert({
    listing_id: input.listing_id,
    title,
    message: parts.join(" "),
    created_by: user?.id ?? null,
  });
  if (error) throw new Error(error.message);
}

export const CREATOR_STATUS: Record<CreatorRegStatus, string> = {
  pending: "Pending review",
  active: "Active",
  paused: "Paused",
};
