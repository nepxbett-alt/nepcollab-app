import { createFileRoute } from "@tanstack/react-router";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Container } from "@/components/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LOCATIONS, NICHES, PLATFORMS } from "@/data/types";
import { daysLeft, getBrand, matchScore } from "@/lib/lookup";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campaigns/")({
  head: () => ({
    meta: [
      { title: "Discover collaborations — NepCollab" },
      {
        name: "description",
        content:
          "Search open brand campaigns across Nepal. Filter by category, city, platform and reward, then apply in minutes.",
      },
      { property: "og:title", content: "Discover collaborations — NepCollab" },
      {
        property: "og:description",
        content: "Open collaboration opportunities from brands looking for creators.",
      },
    ],
  }),
  component: Discover,
});

const SORTS = [
  { id: "recommended", label: "Recommended" },
  { id: "newest", label: "Newest" },
  { id: "closing", label: "Closing soon" },
  { id: "reward", label: "Best reward" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

const REWARD_FILTERS = ["Paid", "Gifted", "Remote"] as const;

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "tap shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-medium",
        active
          ? "border-ink bg-ink text-ink-foreground"
          : "border-border bg-card text-muted-foreground hover:border-foreground/25",
      )}
    >
      {label}
    </button>
  );
}

function Discover() {
  const { campaigns, saved, toggleSaved, currentCreatorId } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [location, setLocation] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [sort, setSort] = useState<SortId>("recommended");
  const [open, setOpen] = useState(false);

  const activeFilters = [location, platform, reward].filter(Boolean).length;

  const results = useMemo(() => {
    const list = campaigns.filter((c) => {
      const brand = getBrand(c.brandId);
      const haystack =
        `${c.title} ${c.description} ${brand?.name ?? ""} ${c.types.join(" ")} ${c.perks.join(" ")}`.toLowerCase();
      if (query && !haystack.includes(query.toLowerCase())) return false;
      if (
        category !== "All" &&
        c.category !== category &&
        !c.requirements.niches.includes(category)
      )
        return false;
      if (location && c.location !== location && !(location === "Remote" && c.remote))
        return false;
      if (platform && !c.platforms.includes(platform as never)) return false;
      if (reward === "Remote" && !c.remote) return false;
      if (
        reward === "Paid" &&
        !c.perks.some((p) => /cash|paid|negotiable/i.test(p))
      )
        return false;
      if (
        reward === "Gifted" &&
        !c.perks.some((p) => /free|gift|product|stay|meal/i.test(p))
      )
        return false;
      return true;
    });

    return list.sort((a, b) => {
      if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "closing") return daysLeft(a.deadline) - daysLeft(b.deadline);
      if (sort === "reward") return b.perks.length - a.perks.length;
      return matchScore(b, currentCreatorId) - matchScore(a, currentCreatorId);
    });
  }, [campaigns, query, category, location, platform, reward, sort, currentCreatorId]);

  const clearAll = () => {
    setLocation(null);
    setPlatform(null);
    setReward(null);
  };

  return (
    <Container className="pt-4">
      <h1 className="text-[22px] font-bold tracking-tight">Discover</h1>

      <div className="sticky top-13 z-30 -mx-4 mt-3 space-y-3 bg-background/92 px-4 pb-3 pt-2 backdrop-blur-xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns..."
              aria-label="Search campaigns"
              className="h-11 rounded-full border-border bg-secondary/70 pl-10 text-[14px]"
            />
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="tap relative h-11 shrink-0 rounded-full px-4"
                aria-label="Filters"
              >
                <SlidersHorizontal className="size-4" />
                {activeFilters > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-signal text-[10px] font-bold text-signal-foreground">
                    {activeFilters}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[85dvh] overflow-y-auto rounded-t-3xl"
            >
              <SheetHeader className="pb-0">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8">
                <FilterGroup title="Sort by">
                  {SORTS.map((s) => (
                    <Chip
                      key={s.id}
                      label={s.label}
                      active={sort === s.id}
                      onClick={() => setSort(s.id)}
                    />
                  ))}
                </FilterGroup>
                <FilterGroup title="Reward">
                  {REWARD_FILTERS.map((r) => (
                    <Chip
                      key={r}
                      label={r}
                      active={reward === r}
                      onClick={() => setReward(reward === r ? null : r)}
                    />
                  ))}
                </FilterGroup>
                <FilterGroup title="Location">
                  {LOCATIONS.map((l) => (
                    <Chip
                      key={l}
                      label={l}
                      active={location === l}
                      onClick={() => setLocation(location === l ? null : l)}
                    />
                  ))}
                </FilterGroup>
                <FilterGroup title="Platform">
                  {PLATFORMS.map((p) => (
                    <Chip
                      key={p}
                      label={p}
                      active={platform === p}
                      onClick={() => setPlatform(platform === p ? null : p)}
                    />
                  ))}
                </FilterGroup>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="h-11 flex-1 rounded-full"
                    onClick={clearAll}
                  >
                    <X className="size-4" /> Clear
                  </Button>
                  <Button
                    className="h-11 flex-1 rounded-full bg-ink text-ink-foreground hover:opacity-90"
                    onClick={() => setOpen(false)}
                  >
                    <Check className="size-4" /> Show {results.length}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["All", ...NICHES].map((n) => (
            <Chip
              key={n}
              label={n}
              active={category === n}
              onClick={() => setCategory(n)}
            />
          ))}
        </div>
      </div>

      <p className="mb-3 mt-1 text-[12.5px] text-muted-foreground">
        {results.length} {results.length === 1 ? "opportunity" : "opportunities"} ·{" "}
        {SORTS.find((s) => s.id === sort)?.label}
      </p>

      {results.length === 0 ? (
        <EmptyState
          title="No campaigns match your filters"
          body="Try widening your search — new opportunities are posted every week."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery("");
            setCategory("All");
            clearAll();
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              saved={saved.includes(c.id)}
              onToggleSave={toggleSaved}
              match={matchScore(c, currentCreatorId)}
            />
          ))}
        </div>
      )}
    </Container>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
