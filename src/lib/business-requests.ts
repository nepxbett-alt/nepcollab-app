import { supabase } from "@/integrations/supabase/client";
import { requireAdmin } from "@/lib/admin";

export type RequestStatus =
  | "new"
  | "contacted"
  | "in_progress"
  | "matched"
  | "completed"
  | "closed";

export type BusinessRequest = {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  category: string | null;
  location: string | null;
  request_details: string;
  budget: string | null;
  timeline: string | null;
  preferred_niche: string | null;
  status: RequestStatus;
  admin_notes: string | null;
  next_action: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessRequestInput = {
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  category?: string;
  location?: string;
  request_details: string;
  budget?: string;
  timeline?: string;
  preferred_niche?: string;
};

function clean(s: string, max: number) {
  return String(s || "").trim().slice(0, max);
}

export function validateBusinessRequest(input: BusinessRequestInput): string | null {
  const business = clean(input.business_name, 120);
  const contact = clean(input.contact_name, 80);
  const phone = clean(input.phone, 30);
  const email = clean(input.email, 120).toLowerCase();
  const details = clean(input.request_details, 4000);
  if (business.length < 2) return "Enter your business name.";
  if (contact.length < 2) return "Enter a contact name.";
  if (phone.length < 7) return "Enter a valid phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Enter a valid email address.";
  if (details.length < 10) return "Tell us a bit more about what you need (at least a short sentence).";
  return null;
}

export async function submitBusinessRequest(input: BusinessRequestInput): Promise<void> {
  const err = validateBusinessRequest(input);
  if (err) throw new Error(err);

  const row = {
    business_name: clean(input.business_name, 120),
    contact_name: clean(input.contact_name, 80),
    phone: clean(input.phone, 30),
    email: clean(input.email, 120).toLowerCase(),
    category: clean(input.category || "", 80) || null,
    location: clean(input.location || "", 80) || null,
    request_details: clean(input.request_details, 4000),
    budget: clean(input.budget || "", 80) || null,
    timeline: clean(input.timeline || "", 80) || null,
    preferred_niche: clean(input.preferred_niche || "", 120) || null,
    status: "new",
  };

  const { error } = await (supabase as any).from("business_requests").insert(row);
  if (error) {
    const msg = String(error.message || "").toLowerCase();
    if (msg.includes("business_requests") || msg.includes("schema cache") || msg.includes("does not exist")) {
      throw new Error("Request intake is being set up. Please try again shortly or email us directly.");
    }
    throw new Error("Could not send your request. Please try again.");
  }
}

export async function fetchBusinessRequests(limit = 100): Promise<BusinessRequest[]> {
  await requireAdmin();
  const { data, error } = await (supabase as any)
    .from("business_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message || "Could not load requests.");
  return (data ?? []) as BusinessRequest[];
}

export async function fetchBusinessRequest(id: string): Promise<BusinessRequest | null> {
  await requireAdmin();
  const { data, error } = await (supabase as any)
    .from("business_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message || "Could not load request.");
  return (data as BusinessRequest) ?? null;
}

export async function updateBusinessRequest(
  id: string,
  patch: Partial<Pick<BusinessRequest, "status" | "admin_notes" | "next_action">>,
): Promise<void> {
  await requireAdmin();
  const { error } = await (supabase as any)
    .from("business_requests")
    .update({
      ...(patch.status != null ? { status: patch.status } : {}),
      ...(patch.admin_notes != null ? { admin_notes: patch.admin_notes } : {}),
      ...(patch.next_action != null ? { next_action: patch.next_action } : {}),
    })
    .eq("id", id);
  if (error) throw new Error(error.message || "Could not update request.");
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In progress",
  matched: "Matched",
  completed: "Completed",
  closed: "Closed",
};
