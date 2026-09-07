import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Container, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitBusinessRequest, validateBusinessRequest } from "@/lib/business-requests";
import { toUserError } from "@/lib/user-error";

export const Route = createFileRoute("/request")({
  head: () => ({
    meta: [
      { title: "Work with NepCollab — Request" },
      {
        name: "description",
        content: "Submit a short brief. NepCollab will review and contact you.",
      },
    ],
  }),
  component: RequestPage,
});

function RequestPage() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    phone: "",
    email: "",
    category: "",
    location: "",
    request_details: "",
    budget: "",
    timeline: "",
    preferred_niche: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const v = validateBusinessRequest(form);
    if (v) {
      toast.error(v);
      return;
    }
    setBusy(true);
    try {
      await submitBusinessRequest(form);
      setDone(true);
      toast.success("Request received");
    } catch (err) {
      toast.error(toUserError(err, "Could not send your request. Please try again."));
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
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">Request received</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thanks for contacting NepCollab. Our team will review your request and contact you shortly.
        </p>
        <Button asChild className="mt-8 h-12 w-full rounded-full">
          <Link to="/">Back to home</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container className="max-w-lg py-8">
      <PageHeader
        title="Work with NepCollab"
        subtitle="No account needed. Share a short brief and we’ll follow up."
      />
      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        <Field label="Business name" id="business_name">
          <Input id="business_name" className="h-11" required maxLength={120} value={form.business_name} onChange={set("business_name")} placeholder="Your company or brand" />
        </Field>
        <Field label="Contact person" id="contact_name">
          <Input id="contact_name" className="h-11" required maxLength={80} value={form.contact_name} onChange={set("contact_name")} placeholder="Full name" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" id="phone">
            <Input id="phone" className="h-11" required maxLength={30} inputMode="tel" value={form.phone} onChange={set("phone")} placeholder="98XXXXXXXX" />
          </Field>
          <Field label="Email" id="email">
            <Input id="email" className="h-11" required type="email" maxLength={120} value={form.email} onChange={set("email")} placeholder="you@company.com" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category (optional)" id="category">
            <Input id="category" className="h-11" maxLength={80} value={form.category} onChange={set("category")} placeholder="Food, fashion, tech…" />
          </Field>
          <Field label="Location (optional)" id="location">
            <Input id="location" className="h-11" maxLength={80} value={form.location} onChange={set("location")} placeholder="Kathmandu" />
          </Field>
        </div>
        <Field label="What do you want to promote?" id="request_details">
          <Textarea
            id="request_details"
            className="min-h-[110px]"
            required
            maxLength={4000}
            value={form.request_details}
            onChange={set("request_details")}
            placeholder="Product or service, content type (Reel, Stories…), and any must-haves."
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Budget (optional)" id="budget">
            <Input id="budget" className="h-11" maxLength={80} value={form.budget} onChange={set("budget")} placeholder="e.g. NPR 25,000 or product kit" />
          </Field>
          <Field label="Timeline (optional)" id="timeline">
            <Input id="timeline" className="h-11" maxLength={80} value={form.timeline} onChange={set("timeline")} placeholder="e.g. This month" />
          </Field>
        </div>
        <Field label="Preferred creator type (optional)" id="preferred_niche">
          <Input id="preferred_niche" className="h-11" maxLength={120} value={form.preferred_niche} onChange={set("preferred_niche")} placeholder="Lifestyle, food, travel…" />
        </Field>
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base font-bold">
          {busy ? "Sending…" : "Submit request"}
        </Button>
        <p className="text-center text-[12px] text-muted-foreground">
          By submitting, you agree we may contact you about this request.
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
