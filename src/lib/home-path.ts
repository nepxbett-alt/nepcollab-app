import type { Role } from "@/data/types";

export function homePathForRole(role: Role | string | null | undefined): "/" | "/admin" {
  if (role === "admin") return "/admin";
  return "/";
}

export function resolvePostAuthDestination(opts: {
  role?: string | null;
  onboarded?: boolean;
  next?: string | null;
}): string {
  // V1: only admin is a real authenticated workspace
  if (opts.role === "admin") {
    const next = (opts.next || "").trim();
    if (next.startsWith("/admin")) return next;
    return "/admin";
  }
  // Non-admin authenticated users still land on public home
  return "/";
}
