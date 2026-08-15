import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Role } from "@/data/types";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Complete your profile — NepCollab" }],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { signedIn, role, completeOnboarding, loading } = useStore();
  const [pickedRole, setPickedRole] = useState<Role>((role as Role) || "creator");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("Kathmandu");
  const [niches, setNiches] = useState("");
  const [languages, setLanguages] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && !signedIn) {
    navigate({ to: "/auth" });
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setBusy(true);
    try {
      const r = pickedRole || (role as Role) || "creator";
      await completeOnboarding({
        role: r,
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        niches: niches.split(",").map((s) => s.trim()).filter(Boolean),
        languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
      } as any);
      toast.success("Profile saved");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-lg py-10">
      <h1 className="text-2xl font-bold tracking-tight">Complete your profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Brands and creators need a complete profile to collaborate.
      </p>
      <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPickedRole("creator")}
            className={`rounded-2xl border p-3 text-left text-sm font-semibold ${pickedRole === "creator" ? "border-signal bg-accent/50" : "border-border"}`}
          >
            I'm a Creator
          </button>
          <button
            type="button"
            onClick={() => setPickedRole("brand")}
            className={`rounded-2xl border p-3 text-left text-sm font-semibold ${pickedRole === "brand" ? "border-signal bg-accent/50" : "border-border"}`}
          >
            I'm a Brand
          </button>
        </div>
        <div>
          <Label htmlFor="name">Display name</Label>
          <Input id="name" className="mt-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" className="mt-2" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" className="mt-2" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="niches">Niches (comma-separated)</Label>
          <Input id="niches" className="mt-2" value={niches} onChange={(e) => setNiches(e.target.value)} placeholder="Lifestyle, Food, Travel" />
        </div>
        <div>
          <Label htmlFor="languages">Languages (comma-separated)</Label>
          <Input id="languages" className="mt-2" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Nepali, English" />
        </div>
        <Button type="submit" disabled={busy} className="w-full rounded-full" size="lg">
          {busy ? "Saving…" : "Save and continue"}
        </Button>
      </form>
    </Container>
  );
}
