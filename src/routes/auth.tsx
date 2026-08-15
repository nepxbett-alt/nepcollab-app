import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Role } from "@/data/types";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NepCollab" },
      { name: "description", content: "Passwordless sign in for NepCollab creators and brands." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { requestMagicLink } = useStore();
  const [role, setRole] = useState<Role>("creator");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await requestMagicLink(email, role, name);
      setSent(true);
      toast.success("Magic link sent. Check your email.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send the magic link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-md py-10">
      <Logo size={40} withWordmark={false} />
      <h1 className="mt-4 text-xl font-bold">Get started</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        No password. We'll email you a secure sign-in link.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {(
          [
            { key: "creator", label: "I'm a Creator", body: "Find and apply to campaigns", icon: Sparkles },
            { key: "brand", label: "I'm a Brand", body: "Publish campaigns, pick creators", icon: Briefcase },
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

      {!sent ? (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">{role === "brand" ? "Brand name" : "Your name"}</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === "brand" ? "Acme Nepal" : "Your full name"}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2"
            />
          </div>
          <Button disabled={busy} type="submit" size="lg" className="w-full rounded-full">
            {busy ? "Sending…" : "Send magic link"}
          </Button>
        </form>
      ) : (
        <div className="mt-8 rounded-2xl border bg-card p-6 text-center">
          <CheckCircle2 className="mx-auto size-10" />
          <h2 className="mt-4 font-semibold">Check your email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a secure link to <strong>{email}</strong>. Open it on this device to continue.
          </p>
          <Button variant="outline" className="mt-5 rounded-full" onClick={() => setSent(false)}>
            Use another email
          </Button>
        </div>
      )}
    </Container>
  );
}
