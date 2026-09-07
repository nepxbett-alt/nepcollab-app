import type { Role } from "@/data/types";

export function homePathForRole(role: Role | string | null | undefined): "/" | "/admin" | "/brand" {
  if (role === "admin") return "/admin";
  if (role === "brand") return "/brand";
  return "/";
}

export function resolvePostAuthDestination(opts: {
  role?: string | null;
  onboarded?: boolean;
  next?: string | null;
}): string {
  const next = (opts.next || "").trim();
  if (opts.role === "admin") {
    if (next.startsWith("/admin")) return next;
    return "/admin";
  }
  if (opts.role === "brand") {
    if (next.startsWith("/brand") || next === "/list-business") return next || "/brand";
    return "/brand";
  }
  // Public / creators: no marketplace; allow next if safe
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes("://")) {
    if (next.startsWith("/admin")) return "/";
    return next;
  }
  return "/";
}
