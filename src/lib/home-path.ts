import type { Role } from "@/data/types";

/** Primary home after auth/onboarding for each role. */
export function homePathForRole(role: Role | string | null | undefined): "/campaigns" | "/brand" | "/admin" {
  if (role === "brand") return "/brand";
  if (role === "admin") return "/admin";
  return "/campaigns";
}

/** Prefer persisted profile role over temporary auth intent. */
export function resolvePostAuthDestination(opts: {
  role?: string | null;
  onboarded?: boolean;
  next?: string | null;
}): string {
  if (!opts.onboarded) return "/onboarding";
  const next = (opts.next || "").trim();
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes("://")) {
    // Keep role workspaces consistent
    if (opts.role === "brand" && (next === "/dashboard" || next === "/campaigns" || next.startsWith("/dashboard"))) {
      return "/brand";
    }
    if (opts.role === "creator" && (next === "/brand" || next.startsWith("/brand"))) {
      return "/campaigns";
    }
    if (opts.role === "admin" && next.startsWith("/admin")) return next;
    return next;
  }
  return homePathForRole(opts.role);
}
