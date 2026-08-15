import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Container, PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/lookup";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — NepCollab" },
      { name: "description", content: "Application updates, invitations, submissions and deadlines." },
      { property: "og:title", content: "Notifications — NepCollab" },
      { property: "og:description", content: "Everything that changed while you were away." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { notifications, role, markNotificationsRead } = useStore();
  const mine = notifications.filter((n) => n.audience === (role ?? "creator"));

  useEffect(() => {
    const timer = setTimeout(markNotificationsRead, 1200);
    return () => clearTimeout(timer);
  }, [markNotificationsRead]);

  return (
    <Container className="max-w-2xl">
      <PageHeader title="Notifications" />
      {mine.length === 0 ? (
        <EmptyState
          title="Nothing new"
          body="Updates about your campaigns and applications will show up here."
          actionLabel="Browse campaigns"
          actionTo="/campaigns"
        />
      ) : (
        <ul className="space-y-3">
          {mine.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-2xl border p-4",
                n.read ? "border-border bg-card" : "border-signal/40 bg-accent/40",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{n.title}</p>
                <span className="text-xs text-muted-foreground">{formatDate(n.at)}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
