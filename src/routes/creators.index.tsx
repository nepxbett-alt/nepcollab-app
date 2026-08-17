import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Container, PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { formatFollowers, listCreators, totalFollowers } from "@/lib/lookup";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/creators/")({
  head: () => ({
    meta: [
      { title: "Creators — NepCollab" },
      { name: "description", content: "Discover Nepal creators for brand collaborations." },
    ],
  }),
  component: CreatorsPage,
});

function CreatorsPage() {
  // subscribe to store so lookup data is ready after load
  useStore();
  const [q, setQ] = useState("");
  const [niche, setNiche] = useState("all");

  const all = listCreators();
  const niches = useMemo(() => {
    const s = new Set<string>();
    all.forEach((c) => c.niches?.forEach((n) => s.add(n)));
    return ["all", ...[...s].sort()];
  }, [all]);

  const filtered = useMemo(() => {
    return all
      .filter((c) => {
        if (niche !== "all" && !(c.niches || []).some((n) => n.toLowerCase() === niche.toLowerCase())) {
          return false;
        }
        if (!q.trim()) return true;
        const hay = `${c.name} ${c.username} ${c.location} ${(c.niches || []).join(" ")} ${c.bio}`.toLowerCase();
        return hay.includes(q.trim().toLowerCase());
      })
      .sort((a, b) => Number(Boolean((b as any).featured)) - Number(Boolean((a as any).featured)) || totalFollowers(b.id) - totalFollowers(a.id));
  }, [all, q, niche]);

  return (
    <Container>
      <PageHeader
        title="Creators"
        subtitle="Find Nepal creators by niche, city, and audience."
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input
          className="h-11"
          placeholder="Search name, city, niche…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search creators"
        />
      </div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {niches.slice(0, 12).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNiche(n)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
              niche === n ? "bg-ink text-ink-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {n === "all" ? "All" : n}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No creators match"
          body="Try clearing filters or check back as more creators join NepCollab."
          actionLabel="Clear filters"
          onAction={() => {
            setQ("");
            setNiche("all");
          }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to="/creators/$creatorId"
              params={{ creatorId: c.id }}
              className="rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/20"
            >
              <div className="flex items-center gap-3">
                <img
                  src={c.avatar}
                  alt=""
                  className="size-12 rounded-full object-cover bg-muted"
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{c.username || "—"} · {c.location || "Nepal"}
                  </p>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">{c.bio || "Creator on NepCollab"}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(c.niches || []).slice(0, 3).map((n) => (
                  <span key={n} className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">
                    {n}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">
                {formatFollowers(totalFollowers(c.id))} followers · {c.rating ? `${c.rating}★` : "New"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
