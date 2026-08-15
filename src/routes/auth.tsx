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
  const { requestMagicLink, verifyEmailOtp, signedIn, loading, onboarded } = useStore();
  const pref = typeof window !== "undefined" ? readPref() : {};

  const [role, setRole] = useState<Role>(pref.role === "brand" ? "brand" : "creator");
  const [name, setName] = useState(pref.name ?? "");
  const [email, setEmail] = useState(pref.email ?? "");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "code">("form");
  const [busy, setBusy] = useState(false);

  const { next } = Route.useSearch();
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  useEffect(() => {
    if (!loading && signedIn && onboarded) {
      navigate({ to: safeNext as "/" });
    }
  }, [loading, signedIn, onboarded, navigate, safeNext]);

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
      const settings = await fetchPublicSettings().catch(() => [] as Awaited<ReturnType<typeof fetchPublicSettings>>);
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
        error instanceof Error
          ? error.message
          : "Invalid or expired code. Request a new one.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-md py-10">
      <Logo size={40} withWordmark={false} />
      <h1 className="mt-4 text-xl font-bold tracking-tight">
        {step === "form" ? "Sign in to NepCollab" : "Enter your code"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {step === "form"
          ? "No password. We'll email a 6-digit code and a one-tap link."
          : `We sent a code to ${email}. Enter it below, or open the link on this device.`}
      </p>

      {step === "form" ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
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

          <form onSubmit={(e) => void sendCode(e)} className="mt-6 space-y-4">
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
            <p className="text-center text-[12px] text-muted-foreground">
              Returning? Use the same email — your session stays signed in on this device.
            </p>
          </form>
        </>
      ) : (
        <form onSubmit={(e) => void confirmCode(e)} className="mt-8 space-y-5">
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
          <p className="text-center text-[12px] text-muted-foreground">
            Prefer one tap? Open the magic link in the same email — it signs you in on this device.
          </p>
        </form>
      )}
    </Container>
  );
}
