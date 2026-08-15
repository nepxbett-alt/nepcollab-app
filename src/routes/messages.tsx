import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useState } from "react";
import { Container, PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBrand, getCreator } from "@/lib/lookup";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — NepCollab" },
      { name: "description", content: "Chat with your collaboration partners once a creator has been selected." },
      { property: "og:title", content: "Messages — NepCollab" },
      { property: "og:description", content: "Collaboration chat for selected creators and brands." },
    ],
  }),
  component: Messages,
});

function Messages() {
  const { threads, campaigns, sendMessage, role } = useStore();
  const [activeId, setActiveId] = useState(threads[0]?.id ?? "");
  const [text, setText] = useState("");
  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  if (threads.length === 0) {
    return (
      <Container>
        <PageHeader title="Messages" />
        <EmptyState
          title="No conversations yet"
          body="Messaging unlocks once a brand selects a creator for a campaign."
          actionLabel="Browse campaigns"
          actionTo="/campaigns"
        />
      </Container>
    );
  }

  return (
    <Container className="grid gap-6 md:grid-cols-[260px_1fr]">
      <div className="space-y-2">
        <PageHeader title="Messages" />
        {threads.map((t) => {
          const campaign = campaigns.find((c) => c.id === t.campaignId);
          const other =
            role === "brand"
              ? getCreator(t.creatorId)?.name
              : campaign
                ? getBrand(campaign.brandId)?.name
                : "";
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveId(t.id)}
              className={cn(
                "w-full rounded-2xl border p-3 text-left",
                active?.id === t.id ? "border-signal bg-accent/50" : "border-border bg-card",
              )}
            >
              <p className="text-sm font-semibold">{other}</p>
              <p className="truncate text-xs text-muted-foreground">{campaign?.title}</p>
            </button>
          );
        })}
      </div>

      <div className="flex min-h-[60vh] flex-col rounded-2xl border border-border bg-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {active?.messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                m.from === "system"
                  ? "mx-auto bg-secondary text-center text-xs text-muted-foreground"
                  : m.from === role
                    ? "ml-auto bg-ink text-ink-foreground"
                    : "bg-secondary text-secondary-foreground",
              )}
            >
              {m.text}
            </div>
          ))}
        </div>
        <form
          className="flex gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim() || !active) return;
            sendMessage(active.id, text.trim());
            setText("");
          }}
        >
          <Input
            value={text}
            maxLength={500}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message"
            className="rounded-full"
          />
          <Button type="submit" size="icon" className="rounded-full">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </Container>
  );
}
