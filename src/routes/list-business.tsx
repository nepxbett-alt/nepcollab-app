import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Container, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitBusinessListing, validateListing } from "@/lib/listings";
import { toUserError } from "@/lib/user-error";

export const Route = createFileRoute("/list-business")({
  head: () => ({
    meta: [
      { title: "List your business — NepCollab" },
      {
        name: "description",
        content: "Submit your business. After approval, you’ll appear on the NepCollab homepage.",
      },
    ],
  }),
  component: ListBusiness,
});

function ListBusiness() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    phone: "",
    email: "",
    category: "",
    location: "",
    description: "",
    website: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const v = validateListing(form);
    if (v) {
      toast.error(v);
      return;
    }
    setBusy(true);
    try {
      await submitBusinessListing(form);
      setDone(true);
      toast.success("Listing submitted");
    } catch (err) {
      toast.error(toUserError(err, "Could not submit. Please try again."));
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
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">You’re in review</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thanks for listing with NepCollab. After admin approval, your business will appear on the
          homepage. Sign in with the same email (Google) to track status and review influencer matches.
        </p>
        <Button asChild className="mt-6 h-12 w-full rounded-full">
          <Link to="/auth" search={{ next: "/brand" } as any}>
            Sign in with Google
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
        title="List your business"
        subtitle="Approved listings are shown on the homepage. Admin matches creators for you."
      />
      <div className="mt-4 rounded-2xl border border-signal/30 bg-signal/5 p-4 text-sm text-foreground">
        <strong>Promise:</strong> After approval, your business is displayed on the NepCollab homepage
        so partners and creators can see who is active on the platform.
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        <Field label="Business name" id="bn">
          <Input id="bn" className="h-11" required maxLength={120} value={form.business_name} onChange={set("business_name")} placeholder="Your company or brand" />
        </Field>
        <Field label="Contact person" id="cn">
          <Input id="cn" className="h-11" required maxLength={80} value={form.contact_name} onChange={set("contact_name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" id="ph">
            <Input id="ph" className="h-11" required maxLength={30} inputMode="tel" value={form.phone} onChange={set("phone")} placeholder="98XXXXXXXX" />
          </Field>
          <Field label="Email (use this for Google login)" id="em">
            <Input id="em" className="h-11" required type="email" maxLength={120} value={form.email} onChange={set("email")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" id="cat">
            <Input id="cat" className="h-11" maxLength={80} value={form.category} onChange={set("category")} placeholder="Food, fashion, tech…" />
          </Field>
          <Field label="Location" id="loc">
            <Input id="loc" className="h-11" maxLength={80} value={form.location} onChange={set("location")} placeholder="Kathmandu" />
          </Field>
        </div>
        <Field label="About your business / what you need" id="desc">
          <Textarea id="desc" className="min-h-[110px]" required maxLength={2000} value={form.description} onChange={set("description")} placeholder="Who you are and the kind of creator campaigns you want." />
        </Field>
        <Field label="Website (optional)" id="web">
          <Input id="web" className="h-11" maxLength={200} value={form.website} onChange={set("website")} placeholder="https://" />
        </Field>
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base font-bold">
          {busy ? "Submitting…" : "Submit listing"}
        </Button>
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
