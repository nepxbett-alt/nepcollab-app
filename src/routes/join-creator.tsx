import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Container, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitCreatorRegistration, validateCreatorReg } from "@/lib/creators-registry";
import { toUserError } from "@/lib/user-error";

export const Route = createFileRoute("/join-creator")({
  head: () => ({
    meta: [
      { title: "Register as creator — NepCollab" },
      {
        name: "description",
        content: "Join NepCollab as a creator. Get notified when businesses list.",
      },
    ],
  }),
  component: JoinCreator,
});

function JoinCreator() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    niche: "",
    location: "",
    platforms: "",
    followers_text: "",
    bio: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const v = validateCreatorReg(form);
    if (v) {
      toast.error(v);
      return;
    }
    setBusy(true);
    try {
      await submitCreatorRegistration(form);
      setDone(true);
      toast.success("You’re registered");
    } catch (err) {
      toast.error(toUserError(err, "Could not register. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Container className="max-w-md py-12 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="size-7 text-success" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">You’re on the list</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          When businesses are approved on NepCollab, we’ll notify active creators. Sign in with the same
          email to open your creator space and see alerts.
        </p>
        <Button asChild className="mt-6 h-12 w-full rounded-full">
          <Link to="/auth" search={{ next: "/creator" } as any}>
            Sign in (required)
          </Link>
        </Button>
        <Button asChild variant="outline" className="mt-2 h-11 w-full rounded-full">
          <Link to="/">Back to home</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container className="max-w-lg py-8">
      <PageHeader
        title="Register as creator"
        subtitle="Free. When businesses list, we notify you. Login required for your workspace."
      />
      <div className="mt-4 rounded-2xl border border-signal/30 bg-signal/5 p-4 text-sm">
        <strong>You’ll be notified</strong> when new businesses go live on the homepage — so you never miss
        a relevant opportunity.
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        <Field label="Full name" id="fn">
          <Input id="fn" className="h-11" required maxLength={100} value={form.full_name} onChange={set("full_name")} />
        </Field>
        <Field label="Email (use this for Google login)" id="em">
          <Input id="em" className="h-11" required type="email" maxLength={120} value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Phone (optional)" id="ph">
          <Input id="ph" className="h-11" maxLength={30} inputMode="tel" value={form.phone} onChange={set("phone")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Niche" id="ni">
            <Input id="ni" className="h-11" maxLength={80} value={form.niche} onChange={set("niche")} placeholder="Food, fashion, travel…" />
          </Field>
          <Field label="Location" id="loc">
            <Input id="loc" className="h-11" maxLength={80} value={form.location} onChange={set("location")} placeholder="Kathmandu" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Platforms" id="pl">
            <Input id="pl" className="h-11" maxLength={120} value={form.platforms} onChange={set("platforms")} placeholder="Instagram, TikTok" />
          </Field>
          <Field label="Followers (approx.)" id="fo">
            <Input id="fo" className="h-11" maxLength={40} value={form.followers_text} onChange={set("followers_text")} placeholder="e.g. 25K" />
          </Field>
        </div>
        <Field label="About you (optional)" id="bio">
          <Textarea id="bio" className="min-h-[90px]" maxLength={2000} value={form.bio} onChange={set("bio")} placeholder="What you create and who follows you." />
        </Field>
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base font-bold">
          {busy ? "Submitting…" : "Register"}
        </Button>
        <p className="text-center text-[12px] text-muted-foreground">
          After registering, <Link to="/auth" className="font-semibold text-signal">sign in</Link> to access
          your creator space.
        </p>
      </form>
    </Container>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
