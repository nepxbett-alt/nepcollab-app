/**
 * Server-only Bright Data Dataset API client for public social profiles.
 * Token: process.env.BRIGHTDATA_API_TOKEN (never VITE_ / client).
 */
export type SocialPlatform = "Instagram" | "TikTok" | "YouTube" | "Facebook";

export type NormalizedSocialProfile = {
  platform: SocialPlatform;
  profileUrl: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  followerCount: number | null;
  followingCount: number | null;
  subscriberCount: number | null;
  postCount: number | null;
  videoCount: number | null;
  viewCount: number | null;
  likeCount: number | null;
  engagementRate: number | null;
  platformVerified: boolean | null;
  statsSource: "brightdata";
};

const DATASET_IDS: Record<SocialPlatform, string> = {
  Instagram: "gd_l1vikfch901nx3by4",
  TikTok: "gd_l1villgoiiidt09ci",
  YouTube: "gd_lk538t2k2p1k3oos71",
  Facebook: "gd_mf124a0511bauquyow",
};

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}
function bool(v: unknown): boolean | null {
  if (v == null) return null;
  if (typeof v === "boolean") return v;
  if (v === "true" || v === 1) return true;
  if (v === "false" || v === 0) return false;
  return null;
}
function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== "") return obj[k];
  }
  return null;
}

export function normalizeBrightDataResponse(
  platform: SocialPlatform,
  profileUrl: string,
  fallbackUsername: string,
  raw: Record<string, unknown>,
): NormalizedSocialProfile {
  if (platform === "Instagram") {
    return {
      platform,
      profileUrl,
      username: str(pick(raw, ["user_name", "username", "account", "handle"])) || fallbackUsername,
      displayName: str(pick(raw, ["full_name", "profile_name", "name"])),
      bio: str(pick(raw, ["biography", "bio", "description"])),
      avatarUrl: str(pick(raw, ["profile_pic_url", "profile_image_link", "profile_pic_url_hd", "avatar"])),
      followerCount: num(pick(raw, ["followers", "follower_count", "followers_count"])),
      followingCount: num(pick(raw, ["following", "following_count"])),
      subscriberCount: null,
      postCount: num(pick(raw, ["posts_count", "media_count", "posts"])),
      videoCount: null,
      viewCount: null,
      likeCount: null,
      engagementRate: num(pick(raw, ["avg_engagement", "engagement_rate", "awg_engagement_rate"])),
      platformVerified: bool(pick(raw, ["is_verified", "verified"])),
      statsSource: "brightdata",
    };
  }
  if (platform === "TikTok") {
    return {
      platform,
      profileUrl,
      username:
        str(pick(raw, ["account_id", "unique_id", "username", "user_name", "nickname"])) ||
        fallbackUsername,
      displayName: str(pick(raw, ["nickname", "name", "display_name"])),
      bio: str(pick(raw, ["biography", "bio", "signature"])),
      avatarUrl: str(pick(raw, ["profile_pic_url_hd", "profile_pic_url", "avatar"])),
      followerCount: num(pick(raw, ["followers", "follower_count"])),
      followingCount: num(pick(raw, ["following", "following_count"])),
      subscriberCount: null,
      postCount: null,
      videoCount: num(pick(raw, ["videos_count", "video_count", "aweme_count"])),
      viewCount: null,
      likeCount: num(pick(raw, ["likes", "heart_count", "total_favorited"])),
      engagementRate: num(pick(raw, ["awg_engagement_rate", "engagement_rate"])),
      platformVerified: bool(pick(raw, ["is_verified", "verified"])),
      statsSource: "brightdata",
    };
  }
  if (platform === "YouTube") {
    return {
      platform,
      profileUrl,
      username:
        str(pick(raw, ["channel_name", "handle", "handle_name", "youtuber", "username"])) ||
        fallbackUsername,
      displayName: str(pick(raw, ["channel_name", "handle_name", "name", "title"])),
      bio: str(pick(raw, ["description", "bio", "about"])),
      avatarUrl: str(pick(raw, ["profile_image", "avatar", "avatar_img_channel", "thumbnail"])),
      followerCount: null,
      followingCount: null,
      subscriberCount: num(pick(raw, ["subscribers", "subscriber_count", "subscribers_count"])),
      postCount: null,
      videoCount: num(pick(raw, ["total_videos", "video_count", "videos"])),
      viewCount: num(pick(raw, ["total_views", "view_count", "views"])),
      likeCount: null,
      engagementRate: null,
      platformVerified: bool(pick(raw, ["is_verified", "verified"])),
      statsSource: "brightdata",
    };
  }
  return {
    platform,
    profileUrl,
    username: str(pick(raw, ["username", "page_name", "name", "id"])) || fallbackUsername,
    displayName: str(pick(raw, ["page_name", "name", "title"])),
    bio: str(pick(raw, ["summary_text", "about", "biography", "bio", "description"])),
    avatarUrl: str(pick(raw, ["profile_picture", "avatar", "profile_pic_url", "image"])),
    followerCount: num(pick(raw, ["followers", "follower_count", "likes", "page_likes", "fan_count"])),
    followingCount: null,
    subscriberCount: null,
    postCount: null,
    videoCount: null,
    viewCount: null,
    likeCount: num(pick(raw, ["likes", "page_likes"])),
    engagementRate: null,
    platformVerified: bool(pick(raw, ["is_verified", "verified"])),
    statsSource: "brightdata",
  };
}

function parsePayload(
  platform: SocialPlatform,
  profileUrl: string,
  fallbackUsername: string,
  text: string,
): { ok: true; data: NormalizedSocialProfile } | { ok: false; error: string; category: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Invalid JSON from Bright Data", category: "parse" };
  }
  let row: Record<string, unknown> | null = null;
  if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
    row = parsed[0] as Record<string, unknown>;
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.data) && obj.data[0]) row = obj.data[0] as Record<string, unknown>;
    else if (Array.isArray(obj.results) && obj.results[0]) row = obj.results[0] as Record<string, unknown>;
    else row = obj;
  }
  if (!row) return { ok: false, error: "Empty profile response", category: "empty" };
  if (row.error || row.warning) {
    return { ok: false, error: String(row.error || row.warning), category: "provider" };
  }
  return {
    ok: true,
    data: normalizeBrightDataResponse(platform, profileUrl, fallbackUsername, row),
  };
}

export async function fetchSocialProfileFromBrightData(
  platform: SocialPlatform,
  profileUrl: string,
  fallbackUsername: string,
): Promise<{ ok: true; data: NormalizedSocialProfile } | { ok: false; error: string; category: string }> {
  const token = process.env.BRIGHTDATA_API_TOKEN || process.env.BRIGHT_DATA_API_TOKEN;
  if (!token) {
    return { ok: false, error: "Bright Data is not configured on the server.", category: "config" };
  }
  const datasetId = DATASET_IDS[platform];
  const endpoint = `https://api.brightdata.com/datasets/v3/scrape?dataset_id=${encodeURIComponent(
    datasetId,
  )}&format=json&include_errors=true`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    let response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ input: [{ url: profileUrl }] }),
      signal: AbortSignal.timeout(90_000),
    });
    let text = await response.text();
    if (!response.ok && (response.status === 400 || response.status === 422)) {
      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify([{ url: profileUrl }]),
        signal: AbortSignal.timeout(90_000),
      });
      text = await response.text();
    }
    if (!response.ok) {
      return { ok: false, error: `Bright Data HTTP ${response.status}`, category: "provider" };
    }
    return parsePayload(platform, profileUrl, fallbackUsername, text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: msg, category: "network" };
  }
}
