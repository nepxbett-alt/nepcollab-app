import { createServerFn } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildSocialFromHandle,
  isSocialPlatform,
  parseSocialProfileUrl,
} from "@/lib/social-url";
import { fetchSocialProfileFromBrightData } from "@/lib/brightdata-social.server";

const REFRESH_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_LOOKUPS_PER_DAY = 8;

type LookupInput = {
  /** Preferred: platform + username (server builds the profile URL). */
  platform?: string;
  username?: string;
  /** Fallback: full profile URL. */
  profileUrl?: string;
  fallbackFollowers?: number;
  forceRefresh?: boolean;
};

export type SocialLookupResult = {
  success: boolean;
  message: string;
  account?: {
    id: string;
    platform: string;
    username: string;
    profileUrl: string | null;
    displayName: string | null;
    followers: number | null;
    subscriberCount: number | null;
    statsSource: string | null;
    lastSyncedAt: string | null;
    syncStatus: string | null;
  };
};


function g(obj: Record<string, unknown>, key: string): unknown {
  return obj[key];
}

type PackedMeta = {
  v: 1;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  followers?: number | null;
  following_count?: number | null;
  subscriber_count?: number | null;
  post_count?: number | null;
  video_count?: number | null;
  view_count?: number | null;
  like_count?: number | null;
  engagement_rate?: number | null;
  stats_source?: string | null;
  last_synced_at?: string | null;
  sync_status?: string | null;
  sync_error?: string | null;
  verified?: boolean | null;
  verify_code?: string | null;
  verify_expires_at?: string | null;
};

function isMissingColumnError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = String(error.message || "").toLowerCase();
  return (
    error.code === "42703" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find the")
  );
}

async function upsertSocialRow(
  supabase: any,
  userId: string,
  existingId: string | undefined,
  fullPayload: Record<string, unknown>,
): Promise<{ id: string; error?: string }> {
  const tryWrite = async (payload: Record<string, unknown>) => {
    if (existingId) {
      const { error } = await supabase
        .from("social_accounts")
        .update(payload)
        .eq("id", existingId)
        .eq("user_id", userId);
      return { id: existingId as string, error };
    }
    const { data, error } = await supabase
      .from("social_accounts")
      .insert(payload)
      .select("id")
      .single();
    if (!error && data?.id) return { id: data.id as string, error: null };
    if (error && (error.code === "23505" || String(error.message).includes("duplicate"))) {
      const { data: again, error: upErr } = await supabase
        .from("social_accounts")
        .update(payload)
        .eq("user_id", userId)
        .eq("platform", (fullPayload as any)["platform"])
        .select("id")
        .single();
      return { id: (again?.id as string) || existingId || "", error: upErr };
    }
    return { id: "", error };
  };

  const first = await tryWrite(fullPayload);
  if (!first.error) return { id: first.id };
  if (!isMissingColumnError(first.error)) {
    return { id: first.id, error: first.error.message };
  }

  const fp = fullPayload as Record<string, any>;
  // Preserve prior packed fields when new value is null (partial provider response)
  let prev: Record<string, any> = {};
  try {
    const raw = fp["access_token_encrypted"];
    if (typeof raw === "string" && raw.startsWith("{")) {
      const j = JSON.parse(raw);
      if (j?.v === 1) prev = j;
    }
  } catch { /* */ }
  const keep = <T,>(next: T | null | undefined, key: string): T | null => {
    if (next != null && next !== "") return next as T;
    const p = prev[key];
    return p != null && p !== "" ? (p as T) : null;
  };
  const meta: PackedMeta = {
    v: 1,
    display_name: keep(fp["display_name"] as string, "display_name"),
    bio: keep(fp["bio"] as string, "bio"),
    avatar_url: keep(fp["avatar_url"] as string, "avatar_url"),
    followers: keep(fp["followers"] as number, "followers"),
    following_count: keep(fp["following_count"] as number, "following_count"),
    subscriber_count: keep(fp["subscriber_count"] as number, "subscriber_count"),
    post_count: keep(fp["post_count"] as number, "post_count"),
    video_count: keep(fp["video_count"] as number, "video_count"),
    view_count: keep(fp["view_count"] as number, "view_count"),
    like_count: keep(fp["like_count"] as number, "like_count"),
    engagement_rate: keep(fp["engagement_rate"] as number, "engagement_rate"),
    stats_source: keep(fp["stats_source"] as string, "stats_source"),
    last_synced_at: keep(fp["last_synced_at"] as string, "last_synced_at"),
    sync_status: (fp["sync_status"] as string) ?? keep(null, "sync_status"),
    sync_error: (fp["sync_error"] as string) ?? null,
    verified: keep(fp["verified"] as boolean, "verified"),
    verify_code: keep(fp["verify_code"] as string, "verify_code"),
    verify_expires_at: keep(fp["verify_expires_at"] as string, "verify_expires_at"),
  };

  const corePayload: Record<string, unknown> = {
    user_id: fp["user_id"],
    platform: fp["platform"],
    handle: fp["handle"],
    profile_url: fp["profile_url"],
    followers: fp["followers"],
    engagement_rate: fp["engagement_rate"] ?? null,
    verified: false,
    access_token_encrypted: JSON.stringify(meta),
  };

  const second = await tryWrite(corePayload);
  if (second.error) return { id: second.id, error: second.error.message };
  return { id: second.id };
}

async function logSync(
  supabase: any,
  userId: string,
  platform: string,
  success: boolean,
  errorCategory?: string,
) {
  try {
    await supabase.from("social_sync_log").insert({
      user_id: userId,
      platform,
      action: "lookup",
      success,
      error_category: errorCategory ?? null,
    });
  } catch {
    /* optional table */
  }
}

async function countRecentLookups(supabase: any, userId: string): Promise<number> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  try {
    const { count, error } = await supabase
      .from("social_sync_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", dayAgo);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function unpackExistingMeta(row: Record<string, any>) {
  if (row["stats_source"] || row["last_synced_at"]) {
    return {
      lastSyncedAt: row["last_synced_at"] ?? null,
      statsSource: row["stats_source"] ?? null,
      syncStatus: row["sync_status"] ?? null,
      subscriberCount: row["subscriber_count"] ?? null,
      displayName: row["display_name"] ?? null,
    };
  }
  try {
    const raw = row["access_token_encrypted"];
    if (!raw || typeof raw !== "string" || !raw.startsWith("{")) {
      return {
        lastSyncedAt: null,
        statsSource: null,
        syncStatus: null,
        subscriberCount: null,
        displayName: null,
      };
    }
    const meta = JSON.parse(raw) as PackedMeta;
    if (meta?.v !== 1) {
      return {
        lastSyncedAt: null,
        statsSource: null,
        syncStatus: null,
        subscriberCount: null,
        displayName: null,
      };
    }
    return {
      lastSyncedAt: meta.last_synced_at ?? null,
      statsSource: meta.stats_source ?? null,
      syncStatus: meta.sync_status ?? null,
      subscriberCount: meta.subscriber_count ?? null,
      displayName: meta.display_name ?? null,
    };
  } catch {
    return {
      lastSyncedAt: null,
      statsSource: null,
      syncStatus: null,
      subscriberCount: null,
      displayName: null,
    };
  }
}

export const lookupSocialProfile = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: LookupInput) => {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid input");
    }
    const platform =
      typeof data.platform === "string" ? data.platform.trim() : undefined;
    const username =
      typeof data.username === "string" ? data.username.trim() : undefined;
    const profileUrl =
      typeof data.profileUrl === "string" ? data.profileUrl.trim() : undefined;
    if (!username && !profileUrl) {
      throw new Error("username or profileUrl is required");
    }
    if (username && !platform) {
      throw new Error("platform is required with username");
    }
    return {
      platform,
      username,
      profileUrl,
      fallbackFollowers:
        typeof data.fallbackFollowers === "number" && data.fallbackFollowers > 0
          ? data.fallbackFollowers
          : undefined,
      forceRefresh: Boolean(data.forceRefresh),
    };
  })
  .handler(async ({ data, context }): Promise<SocialLookupResult> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    let parsed = null as ReturnType<typeof parseSocialProfileUrl>;
    if (data.username && data.platform) {
      if (!isSocialPlatform(data.platform)) {
        return {
          success: false,
          message: "Unsupported platform. Choose Instagram, TikTok, YouTube or Facebook.",
        };
      }
      parsed = buildSocialFromHandle(data.platform, data.username);
      if (!parsed) {
        return {
          success: false,
          message: "Invalid username for this platform. Check the handle and try again.",
        };
      }
    } else if (data.profileUrl) {
      parsed = parseSocialProfileUrl(data.profileUrl);
      if (!parsed) {
        return {
          success: false,
          message:
            "Unsupported or invalid profile URL. Use Instagram, TikTok, YouTube or Facebook.",
        };
      }
    } else {
      return {
        success: false,
        message: "Enter a username or paste a profile link.",
      };
    }

    if ((await countRecentLookups(supabase, userId)) >= MAX_LOOKUPS_PER_DAY) {
      return {
        success: false,
        message: "Daily social lookup limit reached. Try again tomorrow.",
      };
    }

    let row: any = null;
    {
      const { data: existing, error } = await supabase
        .from("social_accounts")
        .select(
          "id, last_synced_at, followers, handle, profile_url, stats_source, sync_status, display_name, subscriber_count, access_token_encrypted",
        )
        .eq("user_id", userId)
        .eq("platform", parsed.platform)
        .maybeSingle();
      if (!error) row = existing;
      else {
        const { data: core } = await supabase
          .from("social_accounts")
          .select("id, followers, handle, profile_url, access_token_encrypted")
          .eq("user_id", userId)
          .eq("platform", parsed.platform)
          .maybeSingle();
        row = core;
      }
    }

    const meta = row ? unpackExistingMeta(row) : null;
    const lastSynced = meta?.lastSyncedAt || row?.last_synced_at || null;
    const syncStatus = meta?.syncStatus || row?.sync_status || null;

    if (lastSynced && !data.forceRefresh) {
      const last = new Date(lastSynced).getTime();
      if (Date.now() - last < REFRESH_COOLDOWN_MS && syncStatus === "ok") {
        return {
          success: true,
          message: "Using cached stats (refresh available after 24 hours).",
          account: {
            id: row.id,
            platform: parsed.platform,
            username: row.handle,
            profileUrl: row.profile_url,
            displayName: meta?.displayName ?? null,
            followers: row.followers,
            subscriberCount: meta?.subscriberCount ?? null,
            statsSource: meta?.statsSource ?? null,
            lastSyncedAt: lastSynced,
            syncStatus,
          },
        };
      }
    }

    if (
      lastSynced &&
      data.forceRefresh &&
      Date.now() - new Date(lastSynced).getTime() < REFRESH_COOLDOWN_MS
    ) {
      return {
        success: false,
        message: "Please wait 24 hours between refreshes for this account.",
      };
    }

    const bd = await fetchSocialProfileFromBrightData(
      parsed.platform,
      parsed.profileUrl,
      parsed.username,
    );
    const now = new Date().toISOString();
    let rowPayload: Record<string, unknown>;

    if (bd.ok) {
      const d = bd.data;
      const audience = d.platform === "YouTube" ? d.subscriberCount : d.followerCount;
      rowPayload = {
        user_id: userId,
        platform: d.platform,
        handle: d.username,
        profile_url: d.profileUrl,
        display_name: d.displayName,
        bio: d.bio,
        avatar_url: d.avatarUrl,
        followers: audience,
        following_count: d.followingCount,
        subscriber_count: d.subscriberCount,
        post_count: d.postCount,
        video_count: d.videoCount,
        view_count: d.viewCount,
        like_count: d.likeCount,
        engagement_rate: d.engagementRate,
        verified: false,
        stats_source: "brightdata",
        last_synced_at: now,
        sync_status: "ok",
        sync_error: null,
        updated_at: now,
      };
      await logSync(supabase, userId, parsed.platform, true);
    } else {
      rowPayload = {
        user_id: userId,
        platform: parsed.platform,
        handle: parsed.username,
        profile_url: parsed.profileUrl,
        followers: data.fallbackFollowers ?? row?.followers ?? null,
        verified: false,
        stats_source: data.fallbackFollowers ? "self_reported" : meta?.statsSource ?? null,
        last_synced_at: lastSynced,
        sync_status: "error",
        sync_error: bd.error.slice(0, 300),
        updated_at: now,
      };
      await logSync(supabase, userId, parsed.platform, false, bd.category);
    }

    // Carry prior packed meta so dual-mode upsert can merge
    if (row?.access_token_encrypted && typeof row.access_token_encrypted === "string") {
      rowPayload["access_token_encrypted"] = row.access_token_encrypted;
    }
    // Prefer non-null followers: never overwrite real count with null on partial fail
    if (rowPayload["followers"] == null && row?.followers != null) {
      rowPayload["followers"] = row.followers;
    }

    const written = await upsertSocialRow(supabase, userId, row?.id, rowPayload);
    if (written.error || !written.id) {
      return { success: false, message: written.error || "Could not save social account." };
    }

    if (bd.ok) {
      const d = bd.data;
      const audience = d.platform === "YouTube" ? d.subscriberCount : d.followerCount;
      try {
        const { data: allSocials } = await supabase
          .from("social_accounts")
          .select("followers")
          .eq("user_id", userId);
        const total = (allSocials ?? []).reduce(
          (n: number, r: any) => n + (Number(r.followers) || 0),
          0,
        );
        if (total > 0) {
          await supabase.from("creator_profiles").update({ followers: total }).eq("user_id", userId);
        }
      } catch {
        /* ignore */
      }
      return {
        success: true,
        message: row?.id ? `${parsed.platform} stats updated.` : `${parsed.platform} connected.`,
        account: {
          id: written.id,
          platform: d.platform,
          username: d.username,
          profileUrl: d.profileUrl,
          displayName: d.displayName,
          followers: audience,
          subscriberCount: d.subscriberCount,
          statsSource: "brightdata",
          lastSyncedAt: now,
          syncStatus: "ok",
        },
      };
    }

    return {
      success: true,
      message: `Account connected. Stats unavailable right now (${bd.error}). Try Refresh later.`,
      account: {
        id: written.id,
        platform: parsed.platform,
        username: parsed.username,
        profileUrl: parsed.profileUrl,
        displayName: null,
        followers: (rowPayload["followers"] as number) ?? null,
        subscriberCount: null,
        statsSource: (rowPayload["stats_source"] as string) ?? null,
        lastSyncedAt: lastSynced,
        syncStatus: "error",
      },
    };
  });


function randomVerifyCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `NC-${out}`;
}

function readPacked(row: Record<string, any>): PackedMeta {
  try {
    const raw = row["access_token_encrypted"];
    if (typeof raw === "string" && raw.startsWith("{")) {
      const p = JSON.parse(raw);
      if (p?.v === 1) return p as PackedMeta;
    }
  } catch {
    /* ignore */
  }
  return { v: 1 };
}

/** Start ownership verification — creator adds a short code to their public bio. */
export const startSocialVerification = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: { platform: string }) => {
    if (!data?.platform || typeof data.platform !== "string") {
      throw new Error("platform is required");
    }
    return { platform: data.platform.trim() };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: row, error } = await supabase
      .from("social_accounts")
      .select("id, platform, handle, profile_url, followers, verified, access_token_encrypted")
      .eq("user_id", userId)
      .eq("platform", data.platform)
      .maybeSingle();
    if (error || !row) {
      return { success: false, message: "Connect this social account first." };
    }
    if (row.verified) {
      return { success: true, message: "Already verified.", code: null, alreadyVerified: true };
    }
    const code = randomVerifyCode();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const meta = {
      ...readPacked(row),
      v: 1 as const,
      verify_code: code,
      verify_expires_at: expires,
      followers: row.followers ?? null,
    };
    const { error: upErr } = await supabase
      .from("social_accounts")
      .update({ access_token_encrypted: JSON.stringify(meta) })
      .eq("id", row.id)
      .eq("user_id", userId);
    if (upErr) return { success: false, message: upErr.message };
    return {
      success: true,
      message: "Add this code to your bio, then tap Verify.",
      code,
      handle: row.handle,
      platform: row.platform,
      expiresAt: expires,
      alreadyVerified: false,
    };
  });

/**
 * Confirm ownership: re-fetch public profile via Bright Data and check bio contains the code.
 * Easiest V1 method — no OAuth, no passwords.
 */
export const confirmSocialVerification = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: { platform: string }) => {
    if (!data?.platform || typeof data.platform !== "string") {
      throw new Error("platform is required");
    }
    return { platform: data.platform.trim() };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: row, error } = await supabase
      .from("social_accounts")
      .select("id, platform, handle, profile_url, followers, verified, access_token_encrypted")
      .eq("user_id", userId)
      .eq("platform", data.platform)
      .maybeSingle();
    if (error || !row) {
      return { success: false, message: "Account not found." };
    }
    if (row.verified) {
      return { success: true, message: "Already verified." };
    }
    const meta = readPacked(row);
    const code = meta.verify_code;
    const expires = meta.verify_expires_at;
    if (!code) {
      return { success: false, message: "Start verification first to get your code." };
    }
    if (expires && new Date(expires).getTime() < Date.now()) {
      return { success: false, message: "Code expired. Start verification again." };
    }
    if (!isSocialPlatform(row.platform)) {
      return { success: false, message: "Unsupported platform." };
    }
    const profileUrl =
      row.profile_url ||
      buildSocialFromHandle(row.platform, row.handle)?.profileUrl ||
      "";
    if (!profileUrl) {
      return { success: false, message: "Missing profile URL." };
    }

    const bd = await fetchSocialProfileFromBrightData(row.platform, profileUrl, row.handle);
    if (!bd.ok) {
      return {
        success: false,
        message: `Could not read public profile (${bd.error}). Try again in a minute.`,
      };
    }
    const bio = (bd.data.bio || "").toLowerCase();
    const codeLc = code.toLowerCase();
    if (!bio.includes(codeLc)) {
      return {
        success: false,
        message: `We couldn't find ${code} in your ${row.platform} bio yet. Add it, wait a minute, then try again.`,
      };
    }

    const audience =
      bd.data.platform === "YouTube" ? bd.data.subscriberCount : bd.data.followerCount;
    const now = new Date().toISOString();
    const nextMeta: PackedMeta = {
      ...meta,
      v: 1,
      verified: true,
      verify_code: null,
      verify_expires_at: null,
      display_name: bd.data.displayName,
      bio: bd.data.bio,
      avatar_url: bd.data.avatarUrl,
      followers: audience,
      following_count: bd.data.followingCount,
      subscriber_count: bd.data.subscriberCount,
      post_count: bd.data.postCount,
      video_count: bd.data.videoCount,
      view_count: bd.data.viewCount,
      like_count: bd.data.likeCount,
      engagement_rate: bd.data.engagementRate,
      stats_source: "verified",
      last_synced_at: now,
      sync_status: "ok",
      sync_error: null,
    };

    const payload = {
      handle: bd.data.username || row.handle,
      profile_url: bd.data.profileUrl || profileUrl,
      followers: audience ?? row.followers,
      engagement_rate: bd.data.engagementRate ?? null,
      verified: true,
      access_token_encrypted: JSON.stringify(nextMeta),
    };
    const { error: upErr } = await supabase
      .from("social_accounts")
      .update(payload)
      .eq("id", row.id)
      .eq("user_id", userId);
    if (upErr) return { success: false, message: upErr.message };

    try {
      const { data: allSocials } = await supabase
        .from("social_accounts")
        .select("followers")
        .eq("user_id", userId);
      const total = (allSocials ?? []).reduce(
        (n: number, r: any) => n + (Number(r.followers) || 0),
        0,
      );
      if (total > 0) {
        await supabase.from("creator_profiles").update({ followers: total }).eq("user_id", userId);
      }
    } catch {
      /* ignore */
    }

    return {
      success: true,
      message: `${row.platform} verified · ownership confirmed.`,
      followers: audience ?? null,
    };
  });


/** Admin marks a social account as ownership-verified after reviewing the creator's public code. */
export const adminMarkSocialVerified = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: { accountId: string; verified?: boolean }) => {
    if (!data?.accountId) throw new Error("accountId required");
    return { accountId: String(data.accountId), verified: data.verified !== false };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (me?.role !== "admin") {
      return { success: false, message: "Admin only." };
    }
    const { data: row, error } = await supabase
      .from("social_accounts")
      .select("id, user_id, platform, handle, followers, engagement_rate, access_token_encrypted, verified")
      .eq("id", data.accountId)
      .maybeSingle();
    if (error || !row) return { success: false, message: "Account not found." };

    let meta: PackedMeta = { v: 1 };
    try {
      if (typeof row.access_token_encrypted === "string" && row.access_token_encrypted.startsWith("{")) {
        const j = JSON.parse(row.access_token_encrypted);
        if (j?.v === 1) meta = j;
      }
    } catch { /* */ }

    const now = new Date().toISOString();
    const next: PackedMeta = {
      ...meta,
      v: 1,
      verified: data.verified,
      verify_code: null,
      verify_expires_at: null,
      stats_source: data.verified ? "verified" : meta.stats_source || "brightdata",
      last_synced_at: now,
      sync_status: "ok",
      sync_error: null,
    };

    const { error: upErr } = await supabase
      .from("social_accounts")
      .update({
        verified: data.verified,
        access_token_encrypted: JSON.stringify(next),
      })
      .eq("id", row.id);
    if (upErr) return { success: false, message: upErr.message };

    try {
      await supabase.from("notifications").insert({
        user_id: row.user_id,
        title: data.verified ? "Social account verified ✓" : "Social verification updated",
        body: data.verified
          ? `Your ${row.platform} @${row.handle} was verified by NepCollab admin.`
          : `Your ${row.platform} verification was updated.`,
      });
    } catch { /* */ }

    return {
      success: true,
      message: data.verified
        ? `${row.platform} @${row.handle} marked verified.`
        : "Verification cleared.",
    };
  });

/** Admin: list social accounts pending ownership (have a code or unverified with stats). */
export const adminListSocialAccounts = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (me?.role !== "admin") {
      return { success: false, message: "Admin only.", accounts: [] as any[] };
    }
    const { data, error } = await supabase
      .from("social_accounts")
      .select("id, user_id, platform, handle, profile_url, followers, engagement_rate, verified, access_token_encrypted, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { success: false, message: error.message, accounts: [] };

    const accounts = (data || []).map((r: any) => {
      let packed: any = {};
      try {
        if (typeof r.access_token_encrypted === "string" && r.access_token_encrypted.startsWith("{")) {
          const j = JSON.parse(r.access_token_encrypted);
          if (j?.v === 1) packed = j;
        }
      } catch { /* */ }
      return {
        id: r.id,
        userId: r.user_id,
        platform: r.platform,
        handle: r.handle,
        profileUrl: r.profile_url,
        followers: r.followers ?? packed.followers ?? null,
        engagement: r.engagement_rate ?? packed.engagement_rate ?? null,
        verified: Boolean(r.verified || packed.verified),
        verifyCode: packed.verify_code || null,
        verifyExpiresAt: packed.verify_expires_at || null,
        statsSource: packed.stats_source || null,
        lastSyncedAt: packed.last_synced_at || null,
      };
    });
    return { success: true, accounts };
  });
