/** Parse Instagram / TikTok / YouTube / Facebook profile URLs for V1 social accounts. */

export type SocialPlatform = "Instagram" | "TikTok" | "YouTube" | "Facebook";

export type ParsedSocialUrl = {
  platform: SocialPlatform;
  username: string;
  profileUrl: string;
};

function strip(url: string): string {
  return url.trim().replace(/\s+/g, "");
}

function ensureHttps(raw: string): string {
  let u = strip(raw);
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
}

export function parseSocialProfileUrl(input: string): ParsedSocialUrl | null {
  if (!input || !input.trim()) return null;
  let href: string;
  try {
    href = ensureHttps(input);
    // eslint-disable-next-line no-new
    new URL(href);
  } catch {
    return null;
  }

  let host: string;
  let path: string;
  try {
    const u = new URL(href);
    host = u.hostname.replace(/^www\./i, "").toLowerCase();
    path = u.pathname.replace(/\/+$/, "");
  } catch {
    return null;
  }

  // Instagram
  if (host === "instagram.com" || host === "instagr.am" || host.endsWith(".instagram.com")) {
    const m = path.match(/^\/([A-Za-z0-9._]+)/);
    if (!m || /^(p|reel|reels|stories|explore|tv)\b/i.test(m[1])) return null;
    const username = m[1];
    return {
      platform: "Instagram",
      username,
      profileUrl: `https://www.instagram.com/${username}/`,
    };
  }

  // TikTok
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    const m = path.match(/^\/@([A-Za-z0-9._]+)/) || path.match(/^\/([A-Za-z0-9._]+)/);
    if (!m) return null;
    const username = m[1].replace(/^@/, "");
    if (/^(foryou|following|video|music|tag)\b/i.test(username)) return null;
    return {
      platform: "TikTok",
      username,
      profileUrl: `https://www.tiktok.com/@${username}`,
    };
  }

  // YouTube
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be" ||
    host.endsWith(".youtube.com")
  ) {
    let username = "";
    const at = path.match(/^\/@([A-Za-z0-9._-]+)/);
    const channel = path.match(/^\/channel\/([A-Za-z0-9_-]+)/);
    const c = path.match(/^\/c\/([A-Za-z0-9._-]+)/);
    const user = path.match(/^\/user\/([A-Za-z0-9._-]+)/);
    if (at) username = at[1];
    else if (channel) username = channel[1];
    else if (c) username = c[1];
    else if (user) username = user[1];
    else return null;
    const profileUrl = at
      ? `https://www.youtube.com/@${username}`
      : channel
        ? `https://www.youtube.com/channel/${username}`
        : c
          ? `https://www.youtube.com/c/${username}`
          : `https://www.youtube.com/user/${username}`;
    return { platform: "YouTube", username, profileUrl };
  }

  // Facebook
  if (host === "facebook.com" || host === "fb.com" || host === "m.facebook.com" || host.endsWith(".facebook.com")) {
    if (/^\/(groups|events|watch|marketplace|reel|photo)\b/i.test(path)) return null;
    const m = path.match(/^\/(profile\.php)/) ? null : path.match(/^\/([A-Za-z0-9.]+)/);
    if (!m) return null;
    const username = m[1];
    if (/^(pages|people|public)\b/i.test(username)) return null;
    return {
      platform: "Facebook",
      username,
      profileUrl: `https://www.facebook.com/${username}`,
    };
  }

  return null;
}

export function formatFollowerCount(n: number): string {
  if (!n || n <= 0) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

export function parseFollowerInput(raw: string): number {
  const s = raw.trim().toLowerCase().replace(/,/g, "").replace(/\s/g, "");
  if (!s) return 0;
  const m = s.match(/^([\d.]+)\s*([km])?$/i);
  if (!m) {
    const n = Number(s.replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  const base = Number(m[1]);
  if (!Number.isFinite(base)) return 0;
  if (m[2] === "k") return Math.round(base * 1_000);
  if (m[2] === "m") return Math.round(base * 1_000_000);
  return Math.round(base);
}
