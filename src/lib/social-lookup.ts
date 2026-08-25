import { createServerFn } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseSocialProfileUrl } from "@/lib/social-url";
import { fetchSocialProfileFromBrightData } from "@/lib/brightdata-social.server";

const REFRESH_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_LOOKUPS_PER_DAY = 8;

type LookupInput = {
  profileUrl: string;
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
  following_count?: number | null;
  subscriber_count?: number | null;
  post_count?: number | null;
  video_count?: number | null;
  view_count?: number | null;
  like_count?: number | null;
  stats_source?: string | null;
  last_synced_at?: string | null;
  sync_status?: string | null;
  sync_error?: string | null;
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
  const meta: PackedMeta = {
    v: 1,
    display_name: (fp["display_name"] as string) ?? null,
    bio: (fp["bio"] as string) ?? null,
    avatar_url: (fp["avatar_url"] as string) ?? null,
    following_count: (fp["following_count"] as number) ?? null,
    subscriber_count: (fp["subscriber_count"] as number) ?? null,
    post_count: (fp["post_count"] as number) ?? null,
    video_count: (fp["video_count"] as number) ?? null,
    view_count: (fp["view_count"] as number) ?? null,
    like_count: (fp["like_count"] as number) ?? null,
    stats_source: (fp["stats_source"] as string) ?? null,
    last_synced_at: (fp["last_synced_at"] as string) ?? null,
    sync_status: (fp["sync_status"] as string) ?? null,
    sync_error: (fp["sync_error"] as string) ?? null,
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
    if (!data || typeof data.profileUrl !== "string") {
      throw new Error("profileUrl is required");
    }
    return {
      profileUrl: data.profileUrl.trim(),
      fallbackFollowers:
        typeof data.fallbackFollowers === "number" && data.fallbackFollowers > 0
          ? data.fallbackFollowers
          : undefined,
      forceRefresh: Boolean(data.forceRefresh),
    };
  })
  .handler(async ({ data, context }): Promise<SocialLookupResult> => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const parsed = parseSocialProfileUrl(data.profileUrl);
    if (!parsed) {
      return {
        success: false,
        message: "Please enter a valid Instagram, TikTok, YouTube or Facebook profile link.",
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

    const written = await upsertSocialRow(supabase, userId, row?.id, rowPayload);
    if (written.error || !written.id) {
      return { success: false, message: written.error || "Could not save social account." };
    }

    if (bd.ok) {
      const d = bd.data;
      const audience = d.platform === "YouTube" ? d.subscriberCount : d.followerCount;
      if (typeof audience === "number" && audience > 0) {
        try {
          await supabase.from("creator_profiles").update({ followers: audience }).eq("user_id", userId);
        } catch {
          /* ignore */
        }
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
