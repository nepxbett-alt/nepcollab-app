import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Role } from "@/data/types";
import { toUserError } from "@/lib/user-error";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Complete your profile — NepCollab" }],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { signedIn, role, completeOnboarding, loading, onboarded } = useStore();
  const [step, setStep] = useState(1);
  const [pickedRole, setPickedRole] = useState<Role>(() => {
    if (role === "brand" || role === "creator") return role;
    try {
      const intent = localStorage.getItem("nepcollab.auth.intent");
      if (intent === "brand" || intent === "creator") return intent;
    } catch { /* ignore */ }
    return "creator";
  });
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("Kathmandu");
  const [niches, setNiches] = useState("");
  const [languages, setLanguages] = useState("Nepali, English");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!signedIn) {
      navigate({ to: "/auth", search: { next: "/onboarding" } });
      return;
    }
    if (onboarded) {
      navigate({ to: role === "brand" ? "/brand" : role === "admin" ? "/admin" : "/dashboard" });
    }
  }, [loading, signedIn, onboarded, navigate, role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name.");
      setStep(2);
      return;
    }
    setBusy(true);
    try {
      const r = pickedRole || (role as Role) || "creator";
      await completeOnboarding({
        role: r,
        name: name.trim(),
        username: username.trim() || undefined,
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim() || undefined,
        niches: niches
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        languages: languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      } as any);
      toast.success(
        r === "brand" ? "Brand profile ready — publish your first campaign" : "Profile saved — welcome to NepCollab",
      );
      navigate({ to: r === "brand" ? "/brand" : "/dashboard" });
    } catch (err: unknown) {
      toast.error(toUserError(err, "We couldn't save your profile. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Container className="max-w-lg py-16 text-center text-sm text-muted-foreground">
        Loading…
      </Container>
    );
  }

  const progress = (step / 3) * 100;

  return (
    <Container className="max-w-lg py-8 sm:py-10">
      <p className="text-[13px] font-medium text-signal">Create · Connect · Grow</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        {step === 1 ? "How will you use NepCollab?" : "Complete your profile"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {step === 1
          ? "One account. Choose creator or brand — you can finish setup in under a minute."
          : "Step " + step + " of 3 — keep it simple so the other side can trust you."}
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
        <div className="h-full rounded-full bg-signal transition-all" style={{ width: `${progress}%` }} />
      </div>

      <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-5">
        {step === 1 && (
          <div className="space-y-3">
            <Label className="sr-only">I am joining as</Label>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setPickedRole("creator")}
                className={`min-h-[4.5rem] rounded-2xl border p-4 text-left transition ${
                  pickedRole === "creator" ? "border-signal bg-accent/50 ring-1 ring-signal/30" : "border-border hover:border-foreground/20"
                }`}
              >
                <span className="text-[15px] font-semibold">I&apos;m a creator</span>
                <span className="mt-1 block text-[13px] font-normal text-muted-foreground">
                  Discover campaigns, apply with a pitch, deliver work
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPickedRole("brand")}
                className={`min-h-[4.5rem] rounded-2xl border p-4 text-left transition ${
                  pickedRole === "brand" ? "border-signal bg-accent/50 ring-1 ring-signal/30" : "border-border hover:border-foreground/20"
                }`}
              >
                <span className="text-[15px] font-semibold">I&apos;m a brand</span>
                <span className="mt-1 block text-[13px] font-normal text-muted-foreground">
                  Publish opportunities, review applicants, collaborate
                </span>
              </button>
            </div>
            <Button type="button" className="h-12 w-full rounded-full" onClick={() => setStep(2)}>
              Continue as {pickedRole === "brand" ? "brand" : "creator"}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Display name *</Label>
              <Input
                id="name"
                className="mt-1.5 h-12"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={pickedRole === "brand" ? "Brand or company name" : "Your name"}
                required
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                className="mt-1.5 h-12"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="optional"
              />
            </div>
            <div>
              <Label htmlFor="location">City / location</Label>
              <Input
                id="location"
                className="mt-1.5 h-12"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Kathmandu"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="h-12 flex-1 rounded-full" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" className="h-12 flex-1 rounded-full" onClick={() => setStep(3)} disabled={!name.trim()}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bio">Short bio</Label>
              <Textarea
                id="bio"
                className="mt-1.5 min-h-[88px]"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What you create or what your brand needs"
              />
            </div>
            {pickedRole === "creator" ? (
              <>
                <div>
                  <Label htmlFor="niches">Niches (comma-separated)</Label>
                  <Input
                    id="niches"
                    className="mt-1.5 h-12"
                    value={niches}
                    onChange={(e) => setNiches(e.target.value)}
                    placeholder="Fashion, Travel, Food"
                  />
                </div>
                <div>
                  <Label htmlFor="languages">Languages</Label>
                  <Input
                    id="languages"
                    className="mt-1.5 h-12"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  className="mt-1.5 h-12"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="h-12 flex-1 rounded-full" onClick={() => setStep(2)} disabled={busy}>
                Back
              </Button>
              <Button type="submit" className="h-12 flex-1 rounded-full" disabled={busy}>
                {busy ? "Saving…" : "Finish setup"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Container>
  );
}
