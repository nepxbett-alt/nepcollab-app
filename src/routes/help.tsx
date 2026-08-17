import { createFileRoute, Link } from "@tanstack/react-router";
import { Container } from "@/components/AppShell";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help — NepCollab" }] }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <Container className="max-w-2xl py-8">
      <h1 className="text-2xl font-bold tracking-tight">Help & support</h1>
      <p className="mt-2 text-sm text-muted-foreground">Quick answers for creators and brands in Nepal.</p>
      <div className="mt-6 space-y-5 text-sm">
        <section>
          <h2 className="font-semibold">How do I sign in?</h2>
          <p className="mt-1 text-muted-foreground">
            Use <Link to="/auth" className="text-signal underline">email magic link</Link>. Check spam if needed. You can enter the 6-digit code from the email.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">How do payments work?</h2>
          <p className="mt-1 text-muted-foreground">
            NepCollab never holds money. Agree fee or barter directly (bank transfer, eSewa, Khalti, etc.) and confirm in messages.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Creators</h2>
          <p className="mt-1 text-muted-foreground">
            <Link to="/campaigns" className="text-signal underline">Discover campaigns</Link>, apply with a clear pitch, deliver on time after selection.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Brands</h2>
          <p className="mt-1 text-muted-foreground">
            <Link to="/brand/campaigns/new" className="text-signal underline">Publish a campaign</Link>, review applicants, message selected creators. Browse the{" "}
            <Link to="/creators" className="text-signal underline">creator directory</Link>.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Contact</h2>
          <p className="mt-1 text-muted-foreground">
            Email <a className="text-signal underline" href="mailto:nepcoollab@gmail.com">nepcoollab@gmail.com</a> for account or safety issues.
          </p>
        </section>
        <p className="text-xs text-muted-foreground">
          <Link to="/terms" className="underline">Terms</Link> · <Link to="/privacy" className="underline">Privacy</Link>
        </p>
      </div>
    </Container>
  );
}
