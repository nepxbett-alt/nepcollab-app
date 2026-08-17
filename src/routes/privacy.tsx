import { createFileRoute, Link } from "@tanstack/react-router";
import { Container } from "@/components/AppShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy policy — NepCollab" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <Container className="max-w-2xl py-8">
      <h1 className="text-2xl font-bold tracking-tight">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated August 2026</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>We collect account data (email, profile, role), collaboration activity, and messages needed to run the marketplace.</p>
        <h2 className="text-base font-semibold text-foreground">How we use data</h2>
        <p>To authenticate you, show profiles and campaigns, enable applications and messaging, moderate abuse, and improve NepCollab.</p>
        <h2 className="text-base font-semibold text-foreground">Sharing</h2>
        <p>Profile and campaign information you publish is visible to other users as designed. Infrastructure is hosted with Supabase. We do not sell personal data.</p>
        <h2 className="text-base font-semibold text-foreground">Your choices</h2>
        <p>Update profile fields in-app. Contact us via <Link to="/help" className="text-signal underline">Help</Link> for deletion requests.</p>
      </div>
    </Container>
  );
}
