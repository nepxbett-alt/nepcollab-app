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
import {
  formatFollowerCount,
  parseFollowerInput,
  parseSocialProfileUrl,
  type ParsedSocialUrl,
} from "@/lib/social-url";
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

  const [socialOpen, setSocialOpen] = useState(false);
  const [profileUrlInput, setProfileUrlInput] = useState("");
  const [parsed, setParsed] = useState<ParsedSocialUrl | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [followers, setFollowers] = useState("");
  const [socialBusy, setSocialBusy] = useState(false);

  const onUrlChange = (value: string) => {
    setProfileUrlInput(value);
    setUrlError(null);
    if (!value.trim()) {
      setParsed(null);
      return;
    }
    const result = parseSocialProfileUrl(value);
    if (result) setParsed(result);
    else setParsed(null);
  };

  const addSocial = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (socialBusy) return;
    const result = parsed || parseSocialProfileUrl(profileUrlInput);
    if (!result) {
      setUrlError("Please enter a valid Instagram, TikTok, YouTube or Facebook profile link.");
      return;
    }
    setSocialBusy(true);
    try {
      await upsertSocialAccount({
        platform: result.platform,
        handle: result.username,
        profileUrl: result.profileUrl,
        followers: parseFollowerInput(followers) || 0,
        engagementRate: 0,
        statsSource: parseFollowerInput(followers) > 0 ? "self_reported" : undefined,
      });
      setProfileUrlInput("");
      setParsed(null);
      setFollowers("");
      setSocialOpen(false);
      toast.success(`${result.platform} added`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not add account");
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
        <SectionHeader
          title="Social accounts"
          hint="Paste a profile link — we detect the platform"
        />
        {(creator?.socials.length ?? 0) === 0 ? (
          <EmptyState
            title="No social accounts yet"
            body="Add Instagram, TikTok, YouTube or Facebook so brands can open your real profiles."
          />
        ) : (
          <ul className="space-y-2.5">
            {creator?.socials.map((s) => {
              const href =
                s.profileUrl ||
                (s.platform === "Instagram"
                  ? `https://www.instagram.com/${s.username}/`
                  : s.platform === "TikTok"
                    ? `https://www.tiktok.com/@${s.username}`
                    : s.platform === "YouTube"
                      ? `https://www.youtube.com/@${s.username}`
                      : s.platform === "Facebook"
                        ? `https://www.facebook.com/${s.username}`
                        : undefined);
              return (
                <li
                  key={`${s.platform}-${s.username}-${s.id ?? ""}`}
                  className="rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold">{s.platform}</p>
                      <p className="truncate text-[13px] text-muted-foreground">@{s.username}</p>
                      {s.followers > 0 ? (
                        <p className="mt-1 text-[11.5px] text-muted-foreground">
                          {formatFollowers(s.followers)}{" "}
                          {s.platform === "YouTube" ? "subscribers" : "followers"} · Self-reported
                        </p>
                      ) : (
                        <p className="mt-1 text-[11.5px] text-muted-foreground">Added</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] font-semibold text-signal hover:underline"
                        >
                          View ↗
                        </a>
                      ) : null}
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
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Button
          type="button"
          variant="outline"
          className="mt-4 h-11 w-full rounded-full"
          onClick={() => {
            setSocialOpen(true);
            setUrlError(null);
          }}
        >
          <Plus className="size-4" /> Add Social Account
        </Button>

        {socialOpen ? (
          <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close"
              onClick={() => setSocialOpen(false)}
            />
            <form
              onSubmit={(e) => void addSocial(e)}
              className="relative z-10 w-full max-w-md rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl"
            >
              <p className="text-[15px] font-bold tracking-tight">Add Social Account</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Paste an Instagram, TikTok, YouTube or Facebook profile link.
              </p>
              <div className="mt-4">
                <Label htmlFor="social-url">Profile URL</Label>
                <Input
                  id="social-url"
                  className="mt-1.5 h-12"
                  autoFocus
                  autoCapitalize="off"
                  autoCorrect="off"
                  inputMode="url"
                  placeholder="https://instagram.com/yourname"
                  value={profileUrlInput}
                  onChange={(e) => onUrlChange(e.target.value)}
                />
                {urlError ? (
                  <p className="mt-1.5 text-[12px] text-destructive">{urlError}</p>
                ) : null}
              </div>

              {parsed ? (
                <div className="mt-3 rounded-2xl border border-signal/30 bg-accent/40 px-3 py-2.5">
                  <p className="text-[12px] font-semibold text-signal">{parsed.platform} detected ✓</p>
                  <p className="mt-0.5 text-[13px] font-medium">@{parsed.username}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{parsed.profileUrl}</p>
                </div>
              ) : null}

              <div className="mt-3">
                <Label htmlFor="followers-opt">
                  Followers / Subscribers <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="followers-opt"
                  className="mt-1.5 h-11"
                  inputMode="text"
                  placeholder="12,500 or 12.5K"
                  value={followers}
                  onChange={(e) => setFollowers(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">Self-reported — not marked as verified.</p>
              </div>

              <Button
                type="submit"
                disabled={socialBusy || !parsed}
                className="mt-4 h-12 w-full rounded-full bg-signal text-signal-foreground hover:bg-signal/90"
              >
                {socialBusy ? "Saving…" : "Add Account"}
              </Button>
              <button
                type="button"
                className="mt-2 h-10 w-full text-[13px] font-medium text-muted-foreground"
                onClick={() => setSocialOpen(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        ) : null}
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
