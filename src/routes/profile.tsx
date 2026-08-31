import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, Clock, Plus, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
  parseSocialProfileUrl,
  type ParsedSocialUrl,
} from "@/lib/social-url";
import {
  confirmSocialVerification,
  lookupSocialProfile,
  startSocialVerification,
} from "@/lib/social-lookup";
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

function formatUpdatedAt(iso?: string) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const days = Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated 1 day ago";
  if (days < 30) return `Updated ${days} days ago`;
  return `Updated ${new Date(iso).toLocaleDateString()}`;
}

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
  const [socialBusy, setSocialBusy] = useState(false);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [activeVerify, setActiveVerify] = useState<{
    platform: string;
    code: string;
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editNiches, setEditNiches] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [basicsHydrated, setBasicsHydrated] = useState(false);

  const [lastFetchPreview, setLastFetchPreview] = useState<{
    platform: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    followers?: number | null;
    following?: number | null;
    posts?: number | null;
    engagement?: number | null;
    profileUrl?: string | null;
  } | null>(null);

  const resetSocialForm = () => {
    setProfileUrlInput("");
    setParsed(null);
    setUrlError(null);
    setLookupFailed(false);
    setLastFetchPreview(null);
  };

  const onUrlChange = (value: string) => {
    setProfileUrlInput(value);
    setUrlError(null);
    setLookupFailed(false);
    setLastFetchPreview(null);
    if (!value.trim()) {
      setParsed(null);
      return;
    }
    const result = parseSocialProfileUrl(value);
    setParsed(result);
    if (!result) {
      setUrlError(
        "Paste a valid public profile URL (Instagram, TikTok, YouTube, or Facebook). Posts, reels, and login links are not accepted.",
      );
    }
  };

  const addSocial = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (socialBusy) return;
    const result = parsed || parseSocialProfileUrl(profileUrlInput);
    if (!result) {
      setUrlError(
        result === null && profileUrlInput.trim()
          ? "Please enter a valid public profile URL."
          : "Please paste your Instagram or Facebook profile URL.",
      );
      return;
    }
    setSocialBusy(true);
    setLookupFailed(false);
    try {
      // URL is the only input — never send manual metrics
      const res = await lookupSocialProfile({
        data: { profileUrl: result.profileUrl },
      });
      if (!res.success) {
        toast.error(res.message || "We couldn't fetch this profile right now. Please try again.");
        setLookupFailed(true);
        return;
      }
      const acct = res.account;
      await upsertSocialAccount({
        platform: result.platform,
        handle: acct?.username || result.username,
        profileUrl: acct?.profileUrl || result.profileUrl,
        followers: acct?.followers ?? null,
        engagementRate: typeof (acct as any)?.engagementRate === "number" ? (acct as any).engagementRate : 0,
        statsSource: (acct?.statsSource as any) || "brightdata",
      });
      setLastFetchPreview({
        platform: result.platform,
        username: acct?.username || result.username,
        displayName: acct?.displayName ?? null,
        avatarUrl: (acct as any)?.avatarUrl ?? null,
        followers: acct?.followers ?? null,
        following: (acct as any)?.following ?? null,
        posts: (acct as any)?.postsCount ?? (acct as any)?.postCount ?? null,
        engagement: (acct as any)?.engagementRate ?? null,
        profileUrl: acct?.profileUrl || result.profileUrl,
      });
      const count = acct?.followers;
      toast.success(
        count
          ? `${result.platform} connected · ${formatFollowerCount(count)} ${result.platform === "YouTube" ? "subscribers" : "followers"}`
          : res.message || `${result.platform} profile fetched`,
      );
      // Keep modal open briefly to show success card, then close
      setTimeout(() => {
        resetSocialForm();
        setSocialOpen(false);
      }, 1200);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not fetch profile");
      setLookupFailed(true);
    } finally {
      setSocialBusy(false);
    }
  };

  const refreshSocial = async (s: {
    id?: string;
    platform: string;
    profileUrl?: string;
    username: string;
  }) => {
    if (socialBusy) return;
    setSocialBusy(true);
    try {
      const nextUrl =
        s.profileUrl ||
        (s.platform === "Instagram"
          ? `https://www.instagram.com/${s.username}/`
          : s.platform === "TikTok"
            ? `https://www.tiktok.com/@${s.username}`
            : s.platform === "YouTube"
              ? `https://www.youtube.com/@${s.username}`
              : `https://www.facebook.com/${s.username}`);
      const res = await lookupSocialProfile({
        data: {
          profileUrl: nextUrl,
          forceRefresh: true,
        },
      });
      if (!res.success) {
        toast.error(res.message || "We couldn't refresh this profile right now.");
        return;
      }
      await upsertSocialAccount({
        platform: s.platform as any,
        handle: res.account?.username || s.username,
        profileUrl: res.account?.profileUrl || nextUrl,
        followers: res.account?.followers ?? null,
        engagementRate: 0,
        statsSource: (res.account?.statsSource as any) || "brightdata",
      });
      toast.success(res.message || "Stats updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setSocialBusy(false);
    }
  };

  const startVerify = async (platform: string) => {
    if (verifyBusy) return;
    setVerifyBusy(true);
    try {
      const res = await startSocialVerification({ data: { platform } });
      if (!res.success) {
        toast.error(res.message || "Could not start verification");
        return;
      }
      if (res.alreadyVerified) {
        toast.success("Already verified");
        return;
      }
      if (res.code) {
        setActiveVerify({ platform, code: res.code });
        toast.message(`Add ${res.code} to your ${platform} bio`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyBusy(false);
    }
  };

  const confirmVerify = async (platform: string) => {
    if (verifyBusy) return;
    setVerifyBusy(true);
    try {
      const res = await confirmSocialVerification({ data: { platform } });
      if (!res.success) {
        toast.error(res.message || "Not verified yet");
        return;
      }
      toast.success(res.message || "Verified");
      setActiveVerify(null);
      const existing = creator?.socials.find((s) => s.platform === platform);
      if (existing) {
        await upsertSocialAccount({
          platform: platform as any,
          handle: existing.username,
          profileUrl: existing.profileUrl,
          followers: res.followers ?? existing.followers ?? null,
          engagementRate: existing.engagement || 0,
          statsSource: "verified",
        });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyBusy(false);
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


  const creatorForEdit = getCreator(currentCreatorId);

  // Keep edit form in sync with loaded creator profile
  useEffect(() => {
    if (!creatorForEdit) return;
    setEditName(creatorForEdit.name || "");
    setEditUsername(creatorForEdit.username || "");
    setEditBio(creatorForEdit.bio || "");
    setEditLocation(creatorForEdit.location || "");
    setEditNiches((creatorForEdit.niches || []).join(", "));
    setBasicsHydrated(true);
  }, [
    creatorForEdit?.id,
    creatorForEdit?.name,
    creatorForEdit?.username,
    creatorForEdit?.bio,
    creatorForEdit?.location,
    // niches array identity
    (creatorForEdit?.niches || []).join(","),
  ]);

  // Deep-link from "Complete profile"
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#complete") return;
    const timer = window.setTimeout(() => {
      document.getElementById("complete")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [creatorForEdit?.id, role]);


  const saveBasics = async () => {
    if (profileSaving) return;
    if (!editName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        username: editUsername.trim() || undefined,
        bio: editBio.trim(),
        location: editLocation.trim(),
        niches: editNiches
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast.success("Profile saved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save profile";
      toast.error(msg);
    } finally {
      setProfileSaving(false);
    }
  };

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

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat
              value={(() => {
                const total = (creator?.socials ?? []).reduce(
                  (n, s) => n + (typeof s.followers === "number" ? s.followers : 0),
                  0,
                );
                return total > 0 ? formatFollowers(total) : "—";
              })()}
              label="Followers"
            />
            <Stat
              value={(() => {
                const rates = (creator?.socials ?? [])
                  .map((s) => (typeof s.engagement === "number" ? s.engagement : null))
                  .filter((n): n is number => n != null && Number.isFinite(n));
                if (rates.length) {
                  const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
                  return `${avg.toFixed(1)}%`;
                }
                return "—";
              })()}
              label="Engagement"
            />
            <Stat
              value={
                typeof creator?.rating === "number" && creator.rating > 0
                  ? creator.rating.toFixed(1)
                  : "—"
              }
              label="Rating"
            />
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

      <div id="complete" className="mt-8 scroll-mt-24">
        <SectionHeader
          title="Your details"
          hint="Name, bio and niches brands see when you apply."
        />
        <div className="mt-3 space-y-3 rounded-3xl border border-border bg-card p-4">
          <div>
            <Label htmlFor="pf-name">Display name</Label>
            <Input
              id="pf-name"
              className="mt-1.5 h-11"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="pf-username">Username</Label>
            <Input
              id="pf-username"
              className="mt-1.5 h-11"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              placeholder="yourname"
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="pf-location">Location</Label>
            <Input
              id="pf-location"
              className="mt-1.5 h-11"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              placeholder="Kathmandu, Nepal"
            />
          </div>
          <div>
            <Label htmlFor="pf-bio">Bio</Label>
            <textarea
              id="pf-bio"
              className="mt-1.5 min-h-[88px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell brands what you create"
              maxLength={500}
            />
          </div>
          <div>
            <Label htmlFor="pf-niches">Niches (comma separated)</Label>
            <Input
              id="pf-niches"
              className="mt-1.5 h-11"
              value={editNiches}
              onChange={(e) => setEditNiches(e.target.value)}
              placeholder="Lifestyle, Food, Travel"
            />
          </div>
          <Button
            type="button"
            className="h-11 w-full rounded-full"
            disabled={profileSaving || !basicsHydrated}
            onClick={() => void saveBasics()}
          >
            {profileSaving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          title="Social accounts"
          hint="Paste your public profile URL — we fetch live followers. Verify ownership with a bio code."
        />

        {(creator?.socials.length ?? 0) > 0 ? (
          <>
            {/* Total reach summary */}
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Total reach
                </p>
                <p className="mt-1 text-[20px] font-bold tracking-tight">
                  {(() => {
                    const total = creator!.socials.reduce(
                      (n, s) => n + (typeof s.followers === "number" ? s.followers : 0),
                      0,
                    );
                    return total > 0 ? formatFollowers(total) : "—";
                  })()}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Platforms
                </p>
                <p className="mt-1 text-[20px] font-bold tracking-tight">
                  {creator!.socials.length}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Verified
                </p>
                <p className="mt-1 text-[20px] font-bold tracking-tight">
                  {creator!.socials.filter((s) => s.verified || s.statsSource === "verified").length}
                  <span className="text-[13px] font-medium text-muted-foreground">
                    /{creator!.socials.length}
                  </span>
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Live stats
                </p>
                <p className="mt-1 text-[20px] font-bold tracking-tight">
                  {
                    creator!.socials.filter(
                      (s) =>
                        s.statsSource === "brightdata" ||
                        s.statsSource === "verified" ||
                        s.statsSource === "public",
                    ).length
                  }
                </p>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {creator!.socials.map((s) => (
                <span
                  key={`chip-${s.platform}-${s.username}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11.5px] font-medium"
                >
                  {s.platform}
                  {typeof s.followers === "number" && s.followers > 0 ? (
                    <span className="text-muted-foreground">
                      · {formatFollowers(s.followers)}
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
          </>
        ) : null}

        {(creator?.socials.length ?? 0) === 0 ? (
          <EmptyState
            title="No social accounts yet"
            body="Add Instagram, TikTok, YouTube or Facebook so brands can see your real reach."
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
              const isVerified = s.verified || s.statsSource === "verified";
              const sourceLabel = isVerified
                ? "Verified owner"
                : s.statsSource === "brightdata" || s.statsSource === "public"
                  ? "Live stats"
                  : s.statsSource === "self_reported"
                    ? "Self-reported"
                    : typeof s.followers === "number" && s.followers > 0
                      ? "Connected"
                      : "Stats pending";
              const showVerifyPanel =
                activeVerify?.platform === s.platform ||
                (!!s.verifyCode && !isVerified);

              return (
                <li
                  key={`${s.platform}-${s.username}-${s.id ?? ""}`}
                  className="rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[14px] font-semibold">{s.platform}</p>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-signal/15 px-1.5 py-0.5 text-[10px] font-semibold text-signal">
                            <BadgeCheck className="size-3" /> Verified
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-[13px] text-muted-foreground">@{s.username}</p>
                      {s.displayName ? (
                        <p className="truncate text-[12px] text-muted-foreground">{s.displayName}</p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
                        <span className="font-semibold">
                          {typeof s.followers === "number" && s.followers > 0 ? formatFollowers(s.followers) : "—"}{" "}
                          <span className="font-normal text-muted-foreground">
                            {s.platform === "YouTube" ? "subscribers" : "followers"}
                          </span>
                        </span>
                        {typeof s.followingCount === "number" && s.followingCount > 0 ? (
                          <span className="text-muted-foreground">
                            {formatFollowers(s.followingCount)} following
                          </span>
                        ) : null}
                        {typeof s.postCount === "number" && s.postCount > 0 ? (
                          <span className="text-muted-foreground">
                            {formatFollowers(s.postCount)} posts
                          </span>
                        ) : null}
                        {typeof s.videoCount === "number" && s.videoCount > 0 ? (
                          <span className="text-muted-foreground">
                            {formatFollowers(s.videoCount)} videos
                          </span>
                        ) : null}
                        {s.engagement > 0 ? (
                          <span className="text-muted-foreground">
                            {s.engagement.toFixed(1)}% eng.
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {sourceLabel}
                        {formatUpdatedAt(s.lastSyncedAt)
                          ? ` · ${formatUpdatedAt(s.lastSyncedAt)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
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
                        disabled={socialBusy || verifyBusy}
                        className="h-8 text-[12px] font-semibold"
                        onClick={() => void refreshSocial(s)}
                      >
                        Refresh
                      </Button>
                      {!isVerified ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={socialBusy || verifyBusy}
                          className="h-8 text-[12px] font-semibold text-signal"
                          onClick={() => void startVerify(s.platform)}
                        >
                          Verify
                        </Button>
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

                  {showVerifyPanel ? (
                    <div className="mt-3 rounded-xl border border-signal/30 bg-accent/40 px-3 py-2.5">
                      <p className="text-[12.5px] font-semibold text-signal">
                        Prove it&apos;s yours (30 seconds)
                      </p>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        1. Open {s.platform} and edit your bio
                        <br />
                        2. Add this code anywhere in the bio:{" "}
                        <span className="font-mono font-bold text-foreground">
                          {activeVerify?.code || s.verifyCode}
                        </span>
                        <br />
                        3. Save, wait ~1 minute, then tap below
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="h-9 rounded-full bg-signal text-signal-foreground hover:bg-signal/90"
                          disabled={verifyBusy}
                          onClick={() => void confirmVerify(s.platform)}
                        >
                          {verifyBusy ? "Checking…" : "I've added it — Verify"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-9"
                          disabled={verifyBusy}
                          onClick={() => setActiveVerify(null)}
                        >
                          Later
                        </Button>
                      </div>
                      <p className="mt-2 text-[10.5px] text-muted-foreground">
                        You can remove the code after verification. We only read public profile info.
                      </p>
                    </div>
                  ) : null}
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
            resetSocialForm();
            setSocialOpen(true);
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
              onClick={() => {
                setSocialOpen(false);
                resetSocialForm();
              }}
            />
            <form
              onSubmit={(e) => void addSocial(e)}
              className="relative z-10 w-full max-w-md rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl"
            >
              <p className="text-[15px] font-bold tracking-tight">Add Social Account</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Paste your public profile URL. We fetch followers and other public stats automatically —
                no manual entry.
              </p>

              <div className="mt-4">
                <Label htmlFor="social-url">Profile URL</Label>
                <Input
                  id="social-url"
                  className="mt-1.5 h-12"
                  autoFocus
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="url"
                  placeholder="https://instagram.com/username"
                  value={profileUrlInput}
                  onChange={(e) => onUrlChange(e.target.value)}
                  disabled={socialBusy}
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Instagram or Facebook profile links work best. TikTok and YouTube are also supported.
                </p>
                {urlError ? (
                  <p className="mt-1.5 text-[12px] text-destructive">{urlError}</p>
                ) : null}
                {lookupFailed && !urlError ? (
                  <p className="mt-1.5 text-[12px] text-destructive">
                    We couldn&apos;t fetch a public profile at this URL. Make sure it is public and try again.
                  </p>
                ) : null}
              </div>

              {parsed ? (
                <div className="mt-3 rounded-2xl border border-signal/30 bg-accent/40 px-3 py-2.5">
                  <p className="text-[12px] font-semibold text-signal">{parsed.platform} detected ✓</p>
                  <p className="mt-0.5 text-[13px] font-medium">@{parsed.username}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{parsed.profileUrl}</p>
                </div>
              ) : null}

              {lastFetchPreview ? (
                <div className="mt-3 rounded-2xl border border-border bg-background px-3 py-3">
                  <p className="text-[12px] font-semibold text-emerald-600">Profile fetched successfully</p>
                  <p className="mt-1 text-[13px] font-medium">
                    {lastFetchPreview.displayName || lastFetchPreview.username}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    @{lastFetchPreview.username} · {lastFetchPreview.platform}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                    {typeof lastFetchPreview.followers === "number" ? (
                      <span>
                        <strong>{formatFollowerCount(lastFetchPreview.followers)}</strong> followers
                      </span>
                    ) : null}
                    {typeof lastFetchPreview.following === "number" ? (
                      <span>
                        <strong>{formatFollowerCount(lastFetchPreview.following)}</strong> following
                      </span>
                    ) : null}
                    {typeof lastFetchPreview.posts === "number" ? (
                      <span>
                        <strong>{formatFollowerCount(lastFetchPreview.posts)}</strong> posts
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-full"
                  disabled={socialBusy}
                  onClick={() => {
                    setSocialOpen(false);
                    resetSocialForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 flex-1 rounded-full bg-signal text-signal-foreground hover:bg-signal/90"
                  disabled={socialBusy || !parsed}
                >
                  {socialBusy
                    ? "Fetching profile…"
                    : parsed
                      ? `Fetch ${parsed.platform} Profile`
                      : "Fetch Profile"}
                </Button>
              </div>
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
