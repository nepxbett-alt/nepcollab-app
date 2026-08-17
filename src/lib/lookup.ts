import type { Brand, Campaign, Creator } from "@/data/types";

let brandMap = new Map<string, Brand>();
let creatorMap = new Map<string, Creator>();

export function setLookupData(brands: Brand[], creators: Creator[]) {
  brandMap = new Map(brands.map((b) => [b.id, b]));
  creatorMap = new Map(creators.map((c) => [c.id, c]));
}

export const getBrand = (id: string) => brandMap.get(id);
export const getCreator = (id: string) => creatorMap.get(id);
export const listCreators = () => [...creatorMap.values()];
export const listBrands = () => [...brandMap.values()];

export function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function daysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export function totalFollowers(creatorId: string) {
  return getCreator(creatorId)?.socials.reduce((sum, s) => sum + s.followers, 0) ?? 0;
}

export function matchScore(campaign: Campaign, creatorId: string) {
  const creator = getCreator(creatorId);
  if (!creator) return 0;
  let score = 28;
  const loc = (creator.location || "").toLowerCase();
  const campLoc = (campaign.location || "").toLowerCase();
  if (campaign.remote || (loc && campLoc && (loc.includes(campLoc) || campLoc.includes(loc)))) {
    score += 18;
  }
  const niches = creator.niches || [];
  const reqNiches = campaign.requirements?.niches || [];
  if (niches.some((n) => reqNiches.some((r) => r.toLowerCase() === n.toLowerCase()))) {
    score += 22;
  } else if (niches.length && reqNiches.length) {
    score += 4;
  }
  if (creator.socials?.some((s) => campaign.platforms?.includes(s.platform))) {
    score += 16;
  }
  const minF = campaign.requirements?.minFollowers ?? 0;
  const followers = totalFollowers(creatorId);
  if (minF <= 0 || followers >= minF) score += 12;
  else if (followers >= minF * 0.6) score += 5;
  return Math.min(Math.max(score, 0), 96);
}

/** Only show match when it is meaningful for a signed-in creator. */
export function displayMatch(score: number | undefined | null) {
  if (score == null || score < 50) return null;
  return score;
}
