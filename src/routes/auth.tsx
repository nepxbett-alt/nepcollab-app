import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Briefcase, CheckCircle2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Role } from "@/data/types";
import { fetchPublicSettings } from "@/lib/admin";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — NepCollab" },
      {
        name: "description",
        content: "Sign in to NepCollab with your email. No password needed.",
      },
      { property: "og:title", content: "Sign in — NepCollab" },
    ],
  }),
  component: AuthPage,
});

type Pref = { email?: string; role?: Role; name?: string };

function readPref(): Pref {
  try {
    const raw = localStorage.getItem("nepcollab.auth.pref");
    if (!raw) return {};
    return JSON.parse(raw) as Pref;
  } catch {
    return {};
  }
}

function AuthPage() {
  const navigate = useNavigate();
  const { requestMagicLink, verifyEmailOtp, demoSignIn, passwordSignIn, signedIn, loading, onboarded } =
    useStore();
  const pref = typeof window !== "undefined" ? readPref() : {};

  const [role, setRole] = useState<Role>(pref.role === "brand" ? "brand" : "creator");
  const [name, setName] = useState(pref.name ?? "");
  const [email, setEmail] = useState(pref.email ?? "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "code">("form");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"otp" | "password">("otp");

  const { next } = Route.useSearch();
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  useEffect(() => {
    if (!loading && signedIn && onboarded) {
      navigate({ to: safeNext as "/" });
    }
  }, [loading, signedIn, onboarded, navigate, safeNext]);

  const runDemo = async (kind: "creator" | "brand") => {
    if (busy) return;
    setBusy(true);
    try {
      await demoSignIn(kind);
      toast.success(kind === "brand" ? "Signed in as Test Brand" : "Signed in as Aarav (creator)");
      navigate({ to: safeNext as "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Demo login failed");
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(role === "brand" ? "Enter your brand name." : "Enter your name.");
      return;
    }
    if (!trimmedEmail.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const settings = await fetchPublicSettings().catch(
        () => [] as Awaited<ReturnType<typeof fetchPublicSettings>>,
      );
      const reg = settings.find((s) => s.key === "registration_open");
      if (reg && reg.value === "false") {
        toast.error("Registration is temporarily closed.");
        return;
      }
      const maint = settings.find((s) => s.key === "maintenance_mode");
      if (maint && maint.value === "true") {
        toast.error("NepCollab is in maintenance mode. Try again later.");
        return;
      }
      await requestMagicLink(trimmedEmail, role, trimmedName);
      setStep("code");
      toast.success("Check your email for a code or magic link.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send the sign-in code.");
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const code = otp.replace(/\s/g, "");
    if (code.length < 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    try {
      await verifyEmailOtp(email.trim().toLowerCase(), code);
      toast.success("You're signed in.");
      navigate({ to: safeNext as "/" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Invalid or expired code. Request a new one.",
      );
    } finally {
      setBusy(false);
    }
  };

  const passwordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      toast.error("Enter email and password.");
      return;
    }
    setBusy(true);
    try {
      await passwordSignIn(email.trim().toLowerCase(), password);
      toast.success("You're signed in.");
      navigate({ to: safeNext as "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-md py-8">
      <Logo size={40} withWordmark={false} />
      <h1 className="mt-4 text-xl font-bold tracking-tight">Sign in to NepCollab</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Testing? Use one-click demo accounts below. Or continue with email.
      </p>

      {/* One-click demo access for full testing */}
      <div className="mt-5 rounded-2xl border border-signal/30 bg-signal/5 p-4">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-signal">
          Quick test access
        </p>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Instantly open the full app as a creator or brand — no email needed.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            type="button"
            disabled={busy}
            className="h-11 rounded-xl bg-signal text-signal-foreground hover:bg-signal/90"
            onClick={() => void runDemo("creator")}
          >
            <Sparkles className="size-4" />
            Creator demo
          </Button>
          <Button
            type="button"
            disabled={busy}
            variant="outline"
            className="h-11 rounded-xl border-signal/40"
            onClick={() => void runDemo("brand")}
          >
            <Briefcase className="size-4" />
            Brand demo
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Creator: creator@nepcollab.test · Brand: brand@nepcollab.test · password test1234
        </p>
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          or email
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {step === "form" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                {
                  key: "creator" as const,
                  label: "I'm a Creator",
                  body: "Find & apply to campaigns",
                  icon: Sparkles,
                },
                {
                  key: "brand" as const,
                  label: "I'm a Brand",
                  body: "Publish & pick creators",
                  icon: Briefcase,
                },
              ] as const
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRole(option.key)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all",
                  role === option.key
                    ? "border-signal bg-accent/60 shadow-sm"
                    : "border-border bg-card hover:border-foreground/30",
                )}
              >
                <option.icon className="size-5" />
                <p className="mt-3 font-semibold">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.body}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2 text-[12px]">
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-1 font-medium",
                mode === "otp" ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
              onClick={() => setMode("otp")}
            >
              Email code
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-1 font-medium",
                mode === "password" ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
              onClick={() => setMode("password")}
            >
              Password
            </button>
          </div>

          {mode === "otp" ? (
            <form onSubmit={(e) => void sendCode(e)} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="name">{role === "brand" ? "Brand name" : "Your name"}</Label>
                <Input
                  id="name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === "brand" ? "Acme Nepal" : "Your full name"}
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 h-11"
                />
              </div>
              <Button disabled={busy} type="submit" size="lg" className="h-11 w-full rounded-full">
                {busy ? "Sending…" : "Continue with email"}
              </Button>
            </form>
          ) : (
            <form onSubmit={(e) => void passwordSubmit(e)} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="email-pw">Email</Label>
                <Input
                  id="email-pw"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@nepcollab.test"
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 h-11"
                />
              </div>
              <Button disabled={busy} type="submit" size="lg" className="h-11 w-full rounded-full">
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          )}
        </>
      ) : (
        <form onSubmit={(e) => void confirmCode(e)} className="mt-4 space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <CheckCircle2 className="mx-auto size-9 text-success" />
            <p className="mt-3 text-sm text-muted-foreground">
              Code sent to <strong className="text-foreground">{email}</strong>
            </p>
          </div>
          <div>
            <Label htmlFor="otp">6-digit code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={8}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
              placeholder="000000"
              className="mt-2 h-12 text-center text-lg tracking-[0.35em]"
            />
          </div>
          <Button
            disabled={busy || otp.replace(/\s/g, "").length < 6}
            type="submit"
            size="lg"
            className="h-11 w-full rounded-full"
          >
            {busy ? "Signing in…" : "Verify & continue"}
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-full"
              disabled={busy}
              onClick={() => void sendCode()}
            >
              Resend code
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 flex-1 rounded-full"
              onClick={() => {
                setStep("form");
                setOtp("");
              }}
            >
              Change email
            </Button>
          </div>
        </form>
      )}
    </Container>
  );
}
