import type { Role } from "@/data/types";

export function homePathForRole(role: Role | string | null | undefined): "/" | "/admin" | "/brand" | "/creator" {
  if (role === "admin") return "/admin";
  if (role === "brand") return "/brand";
  if (role === "creator") return "/creator";
  return "/";
}

export function resolvePostAuthDestination(opts: {
  role?: string | null;
  onboarded?: boolean;
  next?: string | null;
}): string {
  const next = (opts.next || "").trim();
  const safe = (path: string) =>
    path.startsWith("/") && !path.startsWith("//") && !path.includes("://") ? path : null;

  if (opts.role === "admin") {
    const n = safe(next);
    if (n?.startsWith("/admin")) return n;
    return "/admin";
  }
  if (opts.role === "brand") {
    const n = safe(next);
    if (n && (n.startsWith("/brand") || n === "/list-business")) return n;
    return "/brand";
  }
  if (opts.role === "creator") {
    const n = safe(next);
    if (n && (n.startsWith("/creator") || n === "/join-creator")) return n;
    return "/creator";
  }
  const n = safe(next);
  if (n && !n.startsWith("/admin")) return n;
  return "/";
}
