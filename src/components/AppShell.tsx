import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Compass,
  FileText,
  Home,
  LayoutGrid,
  MessageCircle,
  User,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const creatorNav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/campaigns", label: "Discover", icon: Compass },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const brandNav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/brand/campaigns", label: "Campaigns", icon: LayoutGrid },
  { to: "/brand/applicants", label: "Applications", icon: Users },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const { role, signedIn, notifications } = useStore();

  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const nav = role === "brand" ? brandNav : creatorNav;

  const unread = notifications.filter(
    (n) => n.audience === (role ?? "creator") && !n.read,
  ).length;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Mobile / public app header */}
      <header
        className={cn(
          "sticky top-0 z-40",
          "border-b border-border/60",
          "bg-background/90 backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-background/75",
          "pt-[env(safe-area-inset-top)]",
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-14 w-full items-center justify-between gap-3 px-4",
            signedIn ? "max-w-7xl lg:pl-[248px]" : "max-w-6xl",
          )}
        >
          <Link
            to={signedIn ? "/dashboard" : "/"}
            className={cn(
              "flex min-w-0 items-center",
              signedIn && "lg:pointer-events-none lg:opacity-0",
            )}
            aria-label="NepCollab home"
          >
            <Logo />
          </Link>

          <div className="flex shrink-0 items-center gap-1">
            {signedIn ? (
              <Link
                to="/notifications"
                aria-label={
                  unread > 0
                    ? `Notifications, ${unread} unread`
                    : "Notifications"
                }
                className={cn(
                  "tap relative flex size-11 items-center justify-center",
                  "rounded-full text-foreground",
                  "hover:bg-secondary",
                  "focus-visible:bg-secondary",
                )}
              >
                <Bell className="size-[19px]" />

                {unread > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-2.5 top-2.5 size-2 rounded-full bg-signal ring-2 ring-background"
                  />
                ) : null}
              </Link>
            ) : (
              <Link
                to="/auth"
                className="tap rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-ink-foreground hover:opacity-90"
              >
                Get started
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      {signedIn ? (
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-[248px] flex-col border-r border-border bg-card px-4 py-5 lg:flex">
          <Link
            to="/dashboard"
            className="mb-6 flex items-center px-2"
            aria-label="NepCollab home"
          >
            <Logo />
          </Link>

          <nav aria-label="Primary" className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = isActive(pathname, item.to);
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "tap flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[18px]",
                      active && "text-signal",
                    )}
                  />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      ) : null}

      {/* Main content */}
      <main
        className={cn(
          "min-w-0 flex-1",
          "pb-[calc(5rem+env(safe-area-inset-bottom))]",
          "md:pb-10",
          signedIn && "lg:pl-[248px]",
        )}
      >
        {children}
      </main>

      {/* Mobile bottom navigation */}
      {signedIn ? (
        <nav
          aria-label="Primary"
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 lg:hidden",
            "border-t border-border/80",
            "bg-background/95 backdrop-blur-xl",
            "supports-[backdrop-filter]:bg-background/80",
            "pb-[env(safe-area-inset-bottom)]",
          )}
        >
          <ul className="mx-auto flex w-full max-w-lg items-stretch px-1">
            {nav.map((item) => {
              const active = isActive(pathname, item.to);
              const Icon = item.icon;

              return (
                <li key={item.to} className="min-w-0 flex-1">
                  <Link
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "tap flex min-h-[60px] flex-col items-center justify-center",
                      "gap-1 px-1 py-2",
                      "text-[10px] font-medium",
                      "select-none",
                      active
                        ? "text-signal"
                        : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-12 items-center justify-center rounded-full",
                        "transition-colors duration-200",
                        active && "bg-signal/10",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[19px]",
                          active && "stroke-[2.5]",
                        )}
                      />
                    </span>

                    <span className="max-w-full truncate px-1">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pb-4">
      <div className="min-w-0">
        <h1 className="truncate text-[22px] font-bold tracking-tight sm:text-2xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      {action}
    </div>
  );
}

export function SectionHeader({
  title,
  hint,
  actionLabel,
  actionTo,
}: {
  title: string;
  hint?: string | undefined;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-[17px] font-bold tracking-tight">
          {title}
        </h2>

        {hint ? (
          <p className="text-[12.5px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>

      {actionLabel && actionTo ? (
        <Link
          {...({ to: actionTo } as unknown as { to: "/" })}
          className="shrink-0 text-[13px] font-semibold text-signal hover:underline"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-5xl px-4 py-5 sm:px-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
