import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Role } from "@/data/types";
import { homePathForRole } from "@/lib/home-path";
import { useStore } from "@/lib/store";
import { toUserError } from "@/lib/user-error";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Finish setup — NepCollab" },
      { name: "description", content: "Choose creator or brand and enter your name." },
    ],
  }),
  component: OnboardingPage,
});

function readIntent(): Role | null {
  try {
    const v = localStorage.getItem("nepcollab.auth.intent");
    if (v === "brand" || v === "creator") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { signedIn, role, completeOnboarding, loading, onboarded } = useStore();
  const [picked, setPicked] = useState<Role | null>(() => {
    if (role === "brand" || role === "creator") return role;
    return readIntent();
  });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!signedIn) {
      navigate({ to: "/auth" });
      return;
    }
    if (onboarded) {
      navigate({ to: homePathForRole(role) });
    }
  }, [loading, signedIn, onboarded, navigate, role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!picked) {
      toast.error("Choose creator or brand.");
      return;
    }
    if (!name.trim()) {
      toast.error(picked === "brand" ? "Enter your brand name." : "Enter your name.");
      return;
    }
    setBusy(true);
    try {
      await completeOnboarding({
        role: picked,
        name: name.trim(),
      } as any);
      try {
        localStorage.setItem("nepcollab.auth.intent", picked);
      } catch {
        /* ignore */
      }
      toast.success(picked === "brand" ? "You're set — create a campaign" : "You're set — find campaigns");
      navigate({ to: homePathForRole(picked) });
    } catch (err: unknown) {
      toast.error(toUserError(err, "Could not finish setup. Try again."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Container className="max-w-md py-16 text-center text-sm text-muted-foreground">
        Loading…
      </Container>
    );
  }

  return (
    <Container className="max-w-md py-8 sm:py-12">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-signal">Almost there</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">How will you use NepCollab?</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">One choice. One name. You can edit the rest later.</p>

      <form onSubmit={(e) => void submit(e)} className="mt-7 space-y-5">
        <div className="grid gap-2.5">
          <button
            type="button"
            onClick={() => setPicked("creator")}
            className={cn(
              "rounded-2xl border px-4 py-3.5 text-left transition-colors",
              picked === "creator"
                ? "border-ink bg-ink text-ink-foreground"
                : "border-border bg-card hover:bg-secondary/60",
            )}
          >
            <p className="text-[15px] font-semibold">I&apos;m a creator</p>
            <p
              className={cn(
                "mt-0.5 text-[13px]",
                picked === "creator" ? "text-ink-foreground/75" : "text-muted-foreground",
              )}
            >
              Find campaigns and apply
            </p>
          </button>
          <button
            type="button"
            onClick={() => setPicked("brand")}
            className={cn(
              "rounded-2xl border px-4 py-3.5 text-left transition-colors",
              picked === "brand"
                ? "border-ink bg-ink text-ink-foreground"
                : "border-border bg-card hover:bg-secondary/60",
            )}
          >
            <p className="text-[15px] font-semibold">I&apos;m a brand</p>
            <p
              className={cn(
                "mt-0.5 text-[13px]",
                picked === "brand" ? "text-ink-foreground/75" : "text-muted-foreground",
              )}
            >
              Post campaigns and hire creators
            </p>
          </button>
        </div>

        <div>
          <Label htmlFor="ob-name">{picked === "brand" ? "Brand name" : "Your name"}</Label>
          <Input
            id="ob-name"
            className="mt-1.5 h-12"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={picked === "brand" ? "e.g. Himalayan Coffee" : "e.g. Aarav Sharma"}
          />
        </div>

        <Button
          type="submit"
          disabled={busy || !picked || !name.trim()}
          className="h-12 w-full rounded-full text-base"
        >
          {busy ? "Saving…" : picked === "brand" ? "Enter brand home" : "Enter creator home"}
        </Button>
      </form>
    </Container>
  );
}
