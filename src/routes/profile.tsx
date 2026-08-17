import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, Clock, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Container, SectionHeader } from "@/components/AppShell";
import { CampaignCard } from "@/components/CampaignCard";
import { EmptyState } from "@/components/EmptyState";
import { ProfileProgress } from "@/components/ProfileProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatFollowers, getBrand, getCreator } from "@/lib/lookup";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Platform } from "@/data/types";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — NepCollab" },
      {
        name: "description",
        content:
          "Your creator portfolio or brand profile: socials, verification, portfolio, collaborations and reviews.",
      },
      { property: "og:title", content: "Your profile — NepCollab" },
      {
        property: "og:description",
        content: "The profile brands and creators see on NepCollab.",
      },
    ],
  }),
  component: Profile,
});

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl bg-secondary/70 p-3 text-center">
      <p className="text-[17px] font-bold leading-none tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function VerificationPill({ state }: { state: "verified" | "pending" | "none" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
        state === "verified" && "bg-success/12 text-success",
        state === "pending" && "bg-warning/20 text-warning-foreground",
        state === "none" && "bg-secondary text-muted-foreground",
      )}
    >
      {state === "verified" ? (
        <>
          <BadgeCheck className="size-3" /> Verified
        </>
      ) : state === "pending" ? (
        <>
          <Clock className="size-3" /> Pending
        </>
      ) : (
        "Not verified"
      )}
    </span>
  );
}

function Profile() {
  const {
    uploadFile,
    updateProfile,
    role,
    currentCreatorId,
    currentBrandId,
    signOut,
    campaigns,
    saved,
    toggleSaved,
    collaborations,
    signedIn,
    upsertSocialAccount,
    removeSocialAccount,
  } = useStore();

  const PLATFORMS: Platform[] = ["Instagram", "TikTok", "YouTube", "Facebook", "X"];
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [handle, setHandle] = useState("");
  const [followers, setFollowers] = useState("");
  const [engagement, setEngagement] = useState("");
  const [socialBusy, setSocialBusy] = useState(false);

  const addSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (socialBusy) return;
    setSocialBusy(true);
    try {
      await upsertSocialAccount({
        platform,
        handle,
        followers: Number(followers) || 0,
        engagementRate: Number(engagement) || 0,
      });
      setHandle("");
      setFollowers("");
      setEngagement("");
      toast.success(`${platform} connected`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not connect account");
    } finally {
      setSocialBusy(false);
    }
  };

  const removeSocial = async (id?: string, label?: string) => {
    if (!id) {
      toast.error("This account cannot be removed yet.");
      return;
    }
    setSocialBusy(true);
    try {
      await removeSocialAccount(id);
      toast.success(`${label || "Account"} removed`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not remove account");
    } finally {
      setSocialBusy(false);
    }
  };

  if (!signedIn) {
    return (
      <Container>
        <EmptyState
          title="Sign in to view your profile"
          body="Create an account to manage your creator or brand profile. You can still browse open campaigns without signing in."
          actionLabel="Sign in"
          actionTo="/auth"
        />
      </Container>
    );
  }

  if (role === "brand") {
    const brand = getBrand(currentBrandId);
    return (
      <Container className="max-w-3xl pt-4">
        <section className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <img
              src={brand?.logo}
              alt=""
              className="size-16 shrink-0 rounded-2xl object-cover"
            />
            <div className="min-w-0">
              <h1 className="flex items-center gap-1.5 truncate text-xl font-bold tracking-tight">
                {brand?.name}
                {brand?.verified ? (
                  <BadgeCheck className="size-4.5 shrink-0 text-signal" />
                ) : null}
              </h1>
              <p className="truncate text-[13px] text-muted-foreground">
                {brand?.category} · {brand?.location}
              </p>
              <div className="mt-1.5">
                <VerificationPill state={brand?.verified ? "verified" : "pending"} />
              </div>
            </div>
          </div>
          <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
            {brand?.description}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <Stat value={brand?.completedCampaigns ?? 0} label="Campaigns" />
            <Stat value={brand?.rating ?? 0} label="Rating" />
            <Stat value={`${brand?.responseRate ?? 0}%`} label="Response" />
          </div>
        </section>

        <Button
          variant="outline"
          className="mt-5 h-11 w-full rounded-full"
          onClick={signOut}
        >
          Sign out
        </Button>
      </Container>
    );
  }

  const creator = getCreator(currentCreatorId);
  const savedCampaigns = campaigns.filter((c) => saved.includes(c.id));
  const myCollabs = collaborations.filter((c) => c.creatorId === currentCreatorId);
  const filled = [
    Boolean(creator?.bio),
    (creator?.socials.length ?? 0) > 0,
    (creator?.portfolio.length ?? 0) > 1,
    (creator?.niches.length ?? 0) > 0,
    Boolean(creator?.verified),
  ].filter(Boolean).length;
  const percent = Math.round((filled / 5) * 100);

  return (
    <Container className="max-w-3xl pt-4">
      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="h-20 bg-gradient-to-r from-ink to-ink/80" />
        <div className="-mt-9 px-5 pb-5">
          <div className="relative inline-block">
            <img
              src={creator?.avatar}
              alt=""
              className="size-18 rounded-full border-4 border-card object-cover bg-muted"
            />
            <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-ink px-2 py-1 text-[10px] font-semibold text-ink-foreground">
              Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !currentCreatorId) return;
                  try {
                    const url = await uploadFile("avatars", `${currentCreatorId}/${Date.now()}-${file.name}`, file);
                    await updateProfile({ avatarUrl: url });
                    toast.success("Photo updated");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Upload failed");
                  }
                }}
              />
            </label>
          </div>
          <h1 className="mt-2 flex items-center gap-1.5 text-xl font-bold tracking-tight">
            {creator?.name}
            {creator?.verified ? (
              <BadgeCheck className="size-4.5 text-signal" aria-label="Verified creator" />
            ) : null}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            @{creator?.username} · {creator?.location}
          </p>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
            {creator?.bio}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {creator?.niches.map((n) => (
              <span
                key={n}
                className="rounded-full bg-secondary px-2.5 py-1 text-[11.5px] font-medium"
              >
                {n}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <Stat value={creator?.completedCollaborations ?? 0} label="Collabs" />
            <Stat value={creator?.rating ?? 0} label="Rating" />
            <Stat value={`${Math.round(Number(creator?.completionRate ?? creator?.completion_rate ?? 0))}%`} label="Completion" />
            <Stat value={creator?.reviews.length ?? 0} label="Reviews" />
          </div>
        </div>
      </section>

      {percent < 100 ? (
        <div className="mt-4">
          <ProfileProgress
            percent={percent}
            hint="Complete your portfolio and verify your socials to improve your chances of getting selected."
          />
        </div>
      ) : null}

      <div className="mt-8">
        <SectionHeader title="Social accounts" hint="Connect platforms brands can review" />
        {(creator?.socials.length ?? 0) === 0 ? (
          <EmptyState
            title="No social accounts yet"
            body="Add Instagram, TikTok or YouTube so brands can see your audience."
          />
        ) : (
          <ul className="space-y-2.5">
            {creator?.socials.map((s) => (
              <li
                key={`${s.platform}-${s.username}-${s.id ?? ""}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">
                    {s.platform}{" "}
                    <span className="font-normal text-muted-foreground">
                      @{s.username}
                    </span>
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {formatFollowers(s.followers)} followers · {s.engagement}% eng.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <VerificationPill state={s.verified ? "verified" : "pending"} />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={socialBusy}
                    aria-label={`Remove ${s.platform}`}
                    onClick={() => void removeSocial(s.id, s.platform)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={(e) => void addSocial(e)}
          className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4"
        >
          <p className="text-[13px] font-semibold">Connect a platform</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12.5px] font-medium",
                  platform === p
                    ? "border-ink bg-ink text-ink-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div>
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              className="mt-1.5"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@yourhandle"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="followers">Followers</Label>
              <Input
                id="followers"
                className="mt-1.5"
                inputMode="numeric"
                value={followers}
                onChange={(e) => setFollowers(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="12500"
              />
            </div>
            <div>
              <Label htmlFor="engagement">Engagement %</Label>
              <Input
                id="engagement"
                className="mt-1.5"
                inputMode="decimal"
                value={engagement}
                onChange={(e) => setEngagement(e.target.value)}
                placeholder="3.5"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={socialBusy || !handle.trim()}
            className="h-10 w-full rounded-full"
          >
            <Plus className="size-4" />
            {socialBusy ? "Saving…" : "Save social account"}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Manual connect for now. OAuth verification can be added later without changing this data model.
          </p>
        </form>
      </div>

      {creator && creator.portfolio.length > 0 ? (
        <div className="mt-8">
          <SectionHeader title="Portfolio" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {creator.portfolio.map((p) => (
              <figure
                key={p.id}
                className="tap group relative overflow-hidden rounded-2xl"
              >
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-2 text-[11px] font-medium text-ink-foreground">
                  <span className="line-clamp-1">{p.title}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <SectionHeader
          title="Saved campaigns"
          hint={`${savedCampaigns.length} saved`}
        />
        {savedCampaigns.length === 0 ? (
          <EmptyState
            icon={<Bookmark className="size-5" />}
            title="No saved campaigns"
            body="Save opportunities you want to come back to."
            actionLabel="Discover campaigns"
            actionTo="/campaigns"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {savedCampaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                saved
                onToggleSave={toggleSaved}
              />
            ))}
          </div>
        )}
      </div>

      {myCollabs.length > 0 ? (
        <div className="mt-8">
          <SectionHeader
            title="Collaborations"
            actionLabel="See all"
            actionTo="/collaborations"
          />
          <ul className="space-y-2.5">
            {myCollabs.map((c) => {
              const campaign = campaigns.find((x) => x.id === c.campaignId);
              return (
                <li key={c.id}>
                  <Link
                    to="/collaborations/$collabId"
                    params={{ collabId: c.id }}
                    className="tap block rounded-2xl border border-border bg-card p-3.5"
                  >
                    <p className="truncate text-[14px] font-semibold">
                      {campaign?.title}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">
                      {c.status.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {creator && creator.reviews.length > 0 ? (
        <div className="mt-8">
          <SectionHeader title="Reviews" />
          <ul className="space-y-2.5">
            {creator.reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                  <Star className="size-3.5 fill-current text-signal" />
                  {r.rating} · {r.author}
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">{r.text}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button
        variant="outline"
        className="mt-6 h-11 w-full rounded-full"
        onClick={signOut}
      >
        Sign out
      </Button>
    </Container>
  );
}
