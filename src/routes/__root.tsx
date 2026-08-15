import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/AppShell";
import { AppStoreProvider, useStore } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or head back home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#12295c" },
      { name: "author", content: "NepCollab" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/app-icon.png" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function OnboardingGate() {
  const { signedIn, onboarded, role, completeOnboarding } = useStore();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");

  if (!signedIn || onboarded) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await completeOnboarding({ name, username, bio, location, website });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step 1 of 1</p>
        <h2 className="mt-2 text-2xl font-bold">
          {role === "brand" ? "Set up your brand" : "Build your creator profile"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add the basics so NepCollab can personalize discovery and collaboration.
        </p>
        <div className="mt-6 grid gap-4">
          <div>
            <Label htmlFor="on-name">{role === "brand" ? "Brand name" : "Name"}</Label>
            <Input id="on-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="on-username">Username</Label>
            <Input id="on-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" />
          </div>
          <div>
            <Label htmlFor="on-location">Location</Label>
            <Input id="on-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Pokhara, Nepal" />
          </div>
          {role === "brand" && (
            <div>
              <Label htmlFor="on-website">Website</Label>
              <Input id="on-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
            </div>
          )}
          <div>
            <Label htmlFor="on-bio">Bio</Label>
            <Input
              id="on-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={role === "brand" ? "Tell creators what your brand does" : "Tell brands what you create"}
            />
          </div>
        </div>
        <Button type="submit" className="mt-6 w-full rounded-full">
          Finish setup
        </Button>
      </form>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppStoreProvider>
        <OnboardingGate />
        <AppShell>
          <Outlet />
        </AppShell>
        <Toaster />
      </AppStoreProvider>
    </QueryClientProvider>
  );
}
