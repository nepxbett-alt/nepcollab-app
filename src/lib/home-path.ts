import type { Role } from "@/data/types";

/** Canonical post-login home for a role. */
export function homePathForRole(role: Role | string | null | undefined): "/dashboard" | "/brand" | "/admin" {
  if (role === "brand") return "/brand";
  if (role === "admin") return "/admin";
  return "/dashboard";
}

/** Prefer persisted profile role over temporary auth intent. */
export function resolvePostAuthDestination(opts: {
  role?: string | null;
  onboarded?: boolean;
  next?: string | null;
}): string {
  if (!opts.onboarded) return "/onboarding";
  const next = opts.next;
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    // Don't send brands to creator home via stale next
    if (opts.role === "brand" && (next === "/dashboard" || next.startsWith("/dashboard"))) {
      return "/brand";
    }
    if (opts.role === "creator" && (next === "/brand" || next.startsWith("/brand"))) {
      return "/dashboard";
    }
    return next;
  }
  return homePathForRole(opts.role);
}
