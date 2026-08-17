import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Briefcase,
  ChevronDown,
  Compass,
  FileText,
  Flag,
  Handshake,
  Home,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { getBrand, getCreator } from "@/lib/lookup";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badgeKey?: "applications" | "messages" | "notifications";
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

const creatorSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { to: "/dashboard", label: "Home", icon: Home },
      { to: "/campaigns", label: "Discover", icon: Compass },
      { to: "/applications", label: "Applications", icon: FileText, badgeKey: "applications" },
    ],
  },
  {
    title: "Work",
    items: [
      { to: "/collaborations", label: "Collaborations", icon: Handshake },
      { to: "/messages", label: "Messages", icon: MessageCircle, badgeKey: "messages" },
    ],
  },
];

const brandSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { to: "/dashboard", label: "Home", icon: Home },
      { to: "/brand/campaigns", label: "Campaigns", icon: LayoutGrid },
      { to: "/brand/applicants", label: "Applicants", icon: Users, badgeKey: "applications" },
    ],
  },
  {
    title: "Work",
    items: [
      { to: "/collaborations", label: "Collaborations", icon: Handshake },
      { to: "/messages", label: "Messages", icon: MessageCircle, badgeKey: "messages" },
    ],
  },
];

const adminSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: Shield },
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/creators", label: "Creators", icon: User },
      { to: "/admin/brands", label: "Brands", icon: Briefcase },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { to: "/admin/campaigns", label: "Campaigns", icon: Compass },
      { to: "/admin/applications", label: "Applications", icon: FileText },
      { to: "/admin/collaborations", label: "Collaborations", icon: Handshake },
      { to: "/admin/content", label: "Content", icon: LayoutGrid },
    ],
  },
  {
    title: "Trust & safety",
    items: [
      { to: "/admin/reports", label: "Reports", icon: Flag },
      { to: "/admin/disputes", label: "Disputes", icon: Flag },
      { to: "/admin/verification", label: "Verification", icon: Bell },
    ],
  },
  {
    title: "System",
    items: [
      { to: "/admin/settings", label: "Settings", icon: Settings },
      { to: "/admin/audit", label: "Audit log", icon: FileText },
    ],
  },
];

/** Mobile bottom tabs — keep to 5 for thumb reach */
const creatorTabs: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/campaigns", label: "Discover", icon: Compass },
  { to: "/creators", label: "Creators", icon: Users },
  { to: "/applications", label: "Apply", icon: FileText, badgeKey: "applications" },
  { to: "/messages", label: "Chat", icon: MessageCircle, badgeKey: "messages" },
  { to: "/profile", label: "You", icon: User },
];

const brandTabs: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/brand/campaigns", label: "Campaigns", icon: LayoutGrid },
  { to: "/creators", label: "Creators", icon: Users },
  { to: "/brand/applicants", label: "Applicants", icon: Users, badgeKey: "applications" },
  { to: "/messages", label: "Chat", icon: MessageCircle, badgeKey: "messages" },
  { to: "/profile", label: "You", icon: User },
];

const adminTabs: NavItem[] = [
  { to: "/admin", label: "Home", icon: Shield },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/campaigns", label: "Campaigns", icon: Compass },
  { to: "/admin/reports", label: "Reports", icon: Flag },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

/** Guest (signed-out) public exploration */
const guestTabs: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/campaigns", label: "Discover", icon: Compass },
  { to: "/auth", label: "Sign in", icon: User },
];


function isActive(pathname: string, to: string) {
  if (to === "/dashboard" || to === "/admin") return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-signal px-1.5 text-[10px] font-bold text-signal-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal px-1 text-[9px] font-bold leading-none text-signal-foreground">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function useNavBadges() {
  const { applications, threads, notifications, role, currentBrandId, currentCreatorId } =
    useStore();

  const applicationCount =
    role === "brand"
      ? applications.filter((a) => {
          // brand sees pending-ish apps on their campaigns via store already scoped by RLS
          return a.status === "APPLIED" || a.status === "UNDER_REVIEW";
        }).length
      : applications.filter(
          (a) =>
            a.creatorId === currentCreatorId &&
            (a.status === "SHORTLISTED" || a.status === "SELECTED"),
        ).length;

  const messageCount = threads.filter((t) => t.messages.length === 0).length; // empty threads still need attention less useful — use unread style if available
  void messageCount;
  const unreadMessages = 0; // message read receipts optional

  const unreadNotifications = notifications.filter(
    (n) => (role === "admin" || n.audience === (role ?? "creator")) && !n.read,
  ).length;

  void currentBrandId;

  return {
    applications: applicationCount,
    messages: unreadMessages,
    notifications: unreadNotifications,
  };
}

function AccountMenu() {
  const { role, signOut, currentCreatorId, currentBrandId } = useStore();
  const navigate = useNavigate();
  const creator = getCreator(currentCreatorId);
  const brand = getBrand(currentBrandId);

  const name =
    role === "brand"
      ? brand?.name || "Brand"
      : role === "admin"
        ? "Admin"
        : creator?.name || "Creator";
  const avatar =
    role === "brand" ? brand?.logo : role === "admin" ? undefined : creator?.avatar;
  const subtitle =
    role === "brand" ? "Brand account" : role === "admin" ? "Platform admin" : "Creator account";

  const onSignOut = async () => {
    try {
      await signOut();
      navigate({ to: "/" });
    } catch {
      navigate({ to: "/" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "tap flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-background/60 p-2.5 text-left",
            "hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
            {avatar ? (
              <img src={avatar} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-4 text-muted-foreground" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{subtitle}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg"
          onClick={() => navigate({ to: "/profile" })}
        >
          <User className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg"
          onClick={() => navigate({ to: "/notifications" })}
        >
          <Bell className="size-4" />
          Notifications
        </DropdownMenuItem>
        {role === "admin" ? (
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg"
            onClick={() => navigate({ to: "/admin/settings" })}
          >
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg text-destructive focus:text-destructive"
          onClick={() => void onSignOut()}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderAccountButton() {
  const { role, signOut, currentCreatorId, currentBrandId } = useStore();
  const navigate = useNavigate();
  const creator = getCreator(currentCreatorId);
  const brand = getBrand(currentBrandId);
  const avatar =
    role === "brand" ? brand?.logo : role === "admin" ? undefined : creator?.avatar;
  const name =
    role === "brand"
      ? brand?.name || "Brand"
      : role === "admin"
        ? "Admin"
        : creator?.name || "You";

  const onSignOut = async () => {
    try {
      await signOut();
      navigate({ to: "/" });
    } catch {
      navigate({ to: "/" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            "tap flex size-11 items-center justify-center overflow-hidden rounded-full",
            "bg-secondary ring-1 ring-border hover:ring-foreground/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {avatar ? (
            <img src={avatar} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-muted-foreground">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground capitalize">{role ?? "member"}</p>
        </DropdownMenuLabel>
        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate({ to: "/profile" })}>
          <User className="size-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={() => navigate({ to: "/collaborations" })}
        >
          <Handshake className="size-4" /> Collaborations
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={() => navigate({ to: "/notifications" })}
        >
          <Bell className="size-4" /> Notifications
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          onClick={() => void onSignOut()}
        >
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarNav({ sections, badges }: { sections: NavSection[]; badges: ReturnType<typeof useNavBadges> }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav aria-label="Primary" className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-2">
      {sections.map((section) => (
        <div key={section.title ?? "main"}>
          {section.title ? (
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {section.title}
            </p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.to);
              const Icon = item.icon;
              const count = item.badgeKey ? badges[item.badgeKey] : 0;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "tap group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                      active
                        ? "bg-secondary text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0",
                        active ? "text-signal" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    <Badge count={count} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { role, signedIn, loading, accountSuspended } = useStore();
  const badges = useNavBadges();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const sections =
    role === "admin" ? adminSections : role === "brand" ? brandSections : creatorSections;
  const tabs = !signedIn
    ? guestTabs
    : role === "admin"
      ? adminTabs
      : role === "brand"
        ? brandTabs
        : creatorTabs;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Top app bar */}
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
            signedIn ? "max-w-7xl lg:pl-[272px]" : "max-w-6xl",
          )}
        >
          <Link
            to={signedIn ? (role === "admin" ? "/admin" : "/dashboard") : "/"}
            className={cn(
              "flex min-w-0 items-center",
              signedIn && "lg:pointer-events-none lg:opacity-0",
            )}
            aria-label="NepCollab home"
          >
            <Logo />
          </Link>

          <div className="flex shrink-0 items-center gap-1.5">
            {signedIn ? (
              <>
                <Link
                  to="/notifications"
                  aria-label={
                    badges.notifications > 0
                      ? `Notifications, ${badges.notifications} unread`
                      : "Notifications"
                  }
                  className={cn(
                    "tap relative flex size-11 items-center justify-center",
                    "rounded-full text-foreground",
                    "hover:bg-secondary focus-visible:bg-secondary",
                  )}
                >
                  <Bell className="size-[19px]" />
                  {badges.notifications > 0 ? (
                    <span
                      aria-hidden
                      className="absolute right-2.5 top-2.5 size-2 rounded-full bg-signal ring-2 ring-background"
                    />
                  ) : null}
                </Link>
                <div className="lg:hidden">
                  <HeaderAccountButton />
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/campaigns"
                  className="tap hidden rounded-full px-3 py-2 text-[13px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground sm:inline-flex"
                >
                  Browse campaigns
                </Link>
                <Link
                  to="/auth"
                  className="tap rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-ink-foreground hover:opacity-90"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Desktop sidebar — real app chrome */}
      {signedIn ? (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 hidden w-[256px] flex-col",
            "border-r border-border bg-card",
            "lg:flex",
          )}
        >
          <div className="flex items-center px-5 pb-2 pt-5">
            <Link
              to={role === "admin" ? "/admin" : "/dashboard"}
              className="flex items-center"
              aria-label="NepCollab home"
            >
              <Logo />
            </Link>
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col px-3">
            <SidebarNav sections={sections} badges={badges} />
          </div>

          <div className="mt-auto space-y-3 border-t border-border/80 p-3">
            <AccountMenu />
          </div>
        </aside>
      ) : null}

      {/* Main content */}

      {accountSuspended ? (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-sm text-destructive">
          Your account is suspended. You can browse but can&apos;t apply or publish. Contact support if this is a mistake.
        </div>
      ) : null}
      <main
        className={cn(
          "min-w-0 flex-1",
          "pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-10",
          signedIn && "lg:pl-[256px]",
        )}
      >
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          children
        )}
      </main>

      {/* Mobile bottom tab bar — guests get public Discover; members get role tabs */}
      <nav
        aria-label="Primary"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 lg:hidden",
          "border-t border-border/80",
          "bg-background/95 backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-background/85",
          "pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <ul className="mx-auto flex h-[60px] w-full max-w-lg items-stretch px-1">
          {tabs.map((item) => {
            const active = isActive(pathname, item.to);
            const Icon = item.icon;
            const count = signedIn && item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <li key={item.to} className="min-w-0 flex-1">
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "tap relative flex h-full flex-col items-center justify-center gap-0.5",
                    "px-1 text-[10px] font-semibold select-none",
                    active ? "text-signal" : "text-muted-foreground",
                  )}
                >
                  <span className="relative">
                    <span
                      className={cn(
                        "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                        active && "bg-signal/12",
                      )}
                    >
                      <Icon className={cn("size-[20px]", active && "stroke-[2.4]")} />
                    </span>
                    <TabBadge count={count} />
                  </span>
                  <span className="max-w-full truncate px-0.5">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
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
        <h1 className="truncate text-[22px] font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>
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
        <h2 className="truncate text-[17px] font-bold tracking-tight">{title}</h2>
        {hint ? <p className="text-[12.5px] text-muted-foreground">{hint}</p> : null}
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
    <div className={cn("mx-auto w-full max-w-5xl px-4 py-5 sm:px-5", className)}>{children}</div>
  );
}
