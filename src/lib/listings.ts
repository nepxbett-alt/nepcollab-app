import { supabase } from "@/integrations/supabase/client";
import { requireAdmin } from "@/lib/admin";

export type ListingStatus = "pending" | "listed" | "paused" | "closed";
export type DealStatus = "open" | "matched" | "closing" | "closed";
export type AssignmentStatus =
  | "proposed"
  | "brand_selected"
  | "declined"
  | "notified"
  | "confirmed"
  | "closed";

export type BusinessListing = {
  id: string;
  owner_id: string | null;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  category: string | null;
  location: string | null;
  description: string;
  website: string | null;
  status: ListingStatus;
  featured: boolean;
  show_on_homepage: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  listed_at: string | null;
};

export type BusinessDeal = {
  id: string;
  listing_id: string;
  brand_user_id: string | null;
  title: string;
  brief: string | null;
  status: DealStatus;
  admin_notes: string | null;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DealAssignment = {
  id: string;
  deal_id: string;
  influencer_name: string;
  influencer_handle: string | null;
  platform: string | null;
  followers_text: string | null;
  niche: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: AssignmentStatus;
  admin_note: string | null;
  brand_note: string | null;
  assigned_by: string | null;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ListingInput = {
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  category?: string;
  location?: string;
  description: string;
  website?: string;
};

function clean(s: string, max: number) {
  return String(s || "").trim().slice(0, max);
}

export function validateListing(input: ListingInput): string | null {
  if (clean(input.business_name, 120).length < 2) return "Enter your business name.";
  if (clean(input.contact_name, 80).length < 2) return "Enter a contact name.";
  if (clean(input.phone, 30).length < 7) return "Enter a valid phone number.";
  const email = clean(input.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Enter a valid email.";
  if (clean(input.description, 2000).length < 10) return "Add a short description of your business.";
  return null;
}

/** Public: businesses shown on homepage */
export async function fetchHomepageListings(): Promise<BusinessListing[]> {
  const { data, error } = await (supabase as any)
    .from("business_listings")
    .select("id, business_name, category, location, description, featured, listed_at, website")
    .eq("show_on_homepage", true)
    .eq("status", "listed")
    .order("featured", { ascending: false })
    .order("listed_at", { ascending: false })
    .limit(48);
  if (error) {
    console.warn("[listings]", error.message);
    return [];
  }
  return (data ?? []) as BusinessListing[];
}

/** Public submit — appears only after admin lists it */
export async function submitBusinessListing(input: ListingInput): Promise<void> {
  const err = validateListing(input);
  if (err) throw new Error(err);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row = {
    business_name: clean(input.business_name, 120),
    contact_name: clean(input.contact_name, 80),
    phone: clean(input.phone, 30),
    email: clean(input.email, 120).toLowerCase(),
    category: clean(input.category || "", 80) || null,
    location: clean(input.location || "", 80) || null,
    description: clean(input.description, 2000),
    website: clean(input.website || "", 200) || null,
    status: "pending",
    show_on_homepage: false,
    featured: false,
    owner_id: user?.id ?? null,
  };

  const { error } = await (supabase as any).from("business_listings").insert(row);
  if (error) {
    const msg = String(error.message || "").toLowerCase();
    if (msg.includes("business_listings") || msg.includes("does not exist") || msg.includes("schema")) {
      throw new Error("Listing is being set up. Please try again shortly.");
    }
    throw new Error("Could not submit your listing. Please try again.");
  }
}

export async function fetchMyListings(): Promise<BusinessListing[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await (supabase as any)
    .from("business_listings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BusinessListing[];
}

export async function claimListingByEmail(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return 0;
  const { data, error } = await (supabase as any)
    .from("business_listings")
    .update({ owner_id: user.id })
    .or(`owner_id.is.null,owner_id.eq.${user.id}`)
    .ilike("email", user.email)
    .select("id");
  if (error) return 0;
  const n = (data ?? []).length;
  if (n > 0) {
    // Prefer brand role for listing owners (no-op if RLS blocks)
    await (supabase as any)
      .from("profiles")
      .update({ role: "brand", onboarded: true })
      .eq("id", user.id)
      .neq("role", "admin");
  }
  return n;
}

/** Admin */
export async function adminFetchListings(limit = 100): Promise<BusinessListing[]> {
  await requireAdmin();
  const { data, error } = await (supabase as any)
    .from("business_listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as BusinessListing[];
}

export async function adminFetchListing(id: string): Promise<BusinessListing | null> {
  await requireAdmin();
  const { data, error } = await (supabase as any)
    .from("business_listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as BusinessListing) ?? null;
}

export async function adminUpdateListing(
  id: string,
  patch: Partial<
    Pick<BusinessListing, "status" | "show_on_homepage" | "featured" | "admin_notes" | "owner_id">
  >,
): Promise<void> {
  await requireAdmin();
  const body: Record<string, unknown> = { ...patch };
  if (patch.status === "listed" || patch.show_on_homepage === true) {
    body.listed_at = new Date().toISOString();
    body.status = patch.status ?? "listed";
    body.show_on_homepage = patch.show_on_homepage ?? true;
  }
  const { error } = await (supabase as any).from("business_listings").update(body).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminCreateDeal(input: {
  listing_id: string;
  brand_user_id?: string | null;
  title: string;
  brief?: string;
}): Promise<string> {
  await requireAdmin();
  const { data, error } = await (supabase as any)
    .from("business_deals")
    .insert({
      listing_id: input.listing_id,
      brand_user_id: input.brand_user_id || null,
      title: clean(input.title, 160),
      brief: clean(input.brief || "", 4000) || null,
      status: "open",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function fetchDealsForListing(listingId: string): Promise<BusinessDeal[]> {
  const { data, error } = await (supabase as any)
    .from("business_deals")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BusinessDeal[];
}

export async function fetchMyDeals(): Promise<(BusinessDeal & { listing?: BusinessListing })[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await (supabase as any)
    .from("business_deals")
    .select("*, business_listings(*)")
    .eq("brand_user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    // fallback without join
    const { data: d2, error: e2 } = await (supabase as any)
      .from("business_deals")
      .select("*")
      .eq("brand_user_id", user.id)
      .order("created_at", { ascending: false });
    if (e2) throw new Error(e2.message);
    return (d2 ?? []) as BusinessDeal[];
  }
  return (data ?? []).map((r: any) => ({
    ...r,
    listing: r.business_listings ?? undefined,
  }));
}

export async function adminAssignInfluencer(input: {
  deal_id: string;
  influencer_name: string;
  influencer_handle?: string;
  platform?: string;
  followers_text?: string;
  niche?: string;
  contact_phone?: string;
  contact_email?: string;
  admin_note?: string;
}): Promise<void> {
  await requireAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await (supabase as any).from("deal_assignments").insert({
    deal_id: input.deal_id,
    influencer_name: clean(input.influencer_name, 100),
    influencer_handle: clean(input.influencer_handle || "", 80) || null,
    platform: clean(input.platform || "", 40) || null,
    followers_text: clean(input.followers_text || "", 40) || null,
    niche: clean(input.niche || "", 80) || null,
    contact_phone: clean(input.contact_phone || "", 30) || null,
    contact_email: clean(input.contact_email || "", 120) || null,
    admin_note: clean(input.admin_note || "", 1000) || null,
    status: "proposed",
    assigned_by: user?.id ?? null,
  });
  if (error) throw new Error(error.message);
  await (supabase as any).from("business_deals").update({ status: "matched" }).eq("id", input.deal_id);
}

export async function fetchAssignments(dealId: string): Promise<DealAssignment[]> {
  const { data, error } = await (supabase as any)
    .from("deal_assignments")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DealAssignment[];
}

export async function brandSelectAssignment(assignmentId: string, selected: boolean, note?: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("deal_assignments")
    .update({
      status: selected ? "brand_selected" : "declined",
      brand_note: clean(note || "", 500) || null,
    })
    .eq("id", assignmentId);
  if (error) throw new Error(error.message);
}

export async function adminNotifyInfluencer(assignmentId: string): Promise<void> {
  await requireAdmin();
  const { error } = await (supabase as any)
    .from("deal_assignments")
    .update({
      status: "notified",
      notified_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);
  if (error) throw new Error(error.message);
}

export async function closeDeal(dealId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await (supabase as any)
    .from("business_deals")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: user?.id ?? null,
    })
    .eq("id", dealId);
  if (error) throw new Error(error.message);
}

export const LISTING_STATUS: Record<ListingStatus, string> = {
  pending: "Pending review",
  listed: "On homepage",
  paused: "Paused",
  closed: "Closed",
};

export const ASSIGNMENT_STATUS: Record<AssignmentStatus, string> = {
  proposed: "Proposed",
  brand_selected: "Selected by brand",
  declined: "Declined",
  notified: "Influencer notified",
  confirmed: "Confirmed",
  closed: "Closed",
};
