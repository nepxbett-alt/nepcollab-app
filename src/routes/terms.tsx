import { createFileRoute, Link } from "@tanstack/react-router";
import { Container } from "@/components/AppShell";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of use — NepCollab" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <Container className="max-w-2xl py-8">
      <h1 className="text-2xl font-bold tracking-tight">Terms of use</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated August 2026 · Nepal-focused creator marketplace</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>NepCollab connects brands and creators for collaboration opportunities. By using the service you agree to these terms.</p>
        <h2 className="text-base font-semibold text-foreground">Accounts</h2>
        <p>You must provide accurate information. You are responsible for activity under your account. We may suspend accounts that abuse the platform or other users.</p>
        <h2 className="text-base font-semibold text-foreground">Collaborations & payments</h2>
        <p>NepCollab does not process payments, hold funds, or guarantee payouts. Compensation, product seeding, and deliverables are agreed directly between brand and creator.</p>
        <h2 className="text-base font-semibold text-foreground">Content</h2>
        <p>You retain rights to content you upload. You grant NepCollab a license to display it for operating the marketplace. Do not post illegal, infringing, or harmful content.</p>
        <h2 className="text-base font-semibold text-foreground">Acceptable use</h2>
        <p>No spam, fraud, harassment, or attempts to bypass security. Campaigns and applications must be genuine.</p>
        <h2 className="text-base font-semibold text-foreground">Contact</h2>
        <p>Questions: see <Link to="/help" className="text-signal underline">Help</Link>.</p>
      </div>
    </Container>
  );
}
