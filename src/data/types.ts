export type Role = "creator" | "brand";

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "APPLICATIONS_OPEN",
  "SELECTION",
  "COLLABORATION_ACTIVE",
  "SUBMISSION_REVIEW",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "PAUSED",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const APPLICATION_STATUSES = [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const COLLABORATION_STATUSES = [
  "SELECTED",
  "ACCEPTED",
  "ACTIVE",
  "WORK_SUBMITTED",
  "REVIEWING",
  "REVISION_REQUESTED",
  "COMPLETED",
] as const;
export type CollaborationStatus = (typeof COLLABORATION_STATUSES)[number];

export type DeliverableStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "REVISION_REQUESTED";

export type Platform = "Instagram" | "TikTok" | "YouTube" | "Facebook" | "X";

export interface SocialAccount {
  platform: Platform;
  username: string;
  followers: number;
  engagement: number;
  verified: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  brand: string;
  platform: Platform;
  image: string;
  category: string;
  date: string;
}

export interface Review {
  id: string;
  author: string;
  authorAvatar: string;
  rating: number;
  text: string;
  date: string;
}

export interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  languages: string[];
  niches: string[];
  socials: SocialAccount[];
  portfolio: PortfolioItem[];
  reviews: Review[];
  rating: number;
  completedCollaborations: number;
  verified: boolean;
  available: boolean;
  preferredTypes: string[];
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  category: string;
  description: string;
  location: string;
  website: string;
  verified: boolean;
  rating: number;
  completedCampaigns: number;
  responseRate: number;
}

export interface Deliverable {
  id: string;
  title: string;
  platform: Platform | "Other";
  contentType: string;
  dueDate: string;
  instructions: string;
  status: DeliverableStatus;
  submission?: {
    note: string;
    link: string;
    submittedAt: string;
  };
}

export interface Campaign {
  id: string;
  title: string;
  brandId: string;
  description: string;
  category: string;
  types: string[];
  platforms: Platform[];
  perks: string[];
  giftValue?: string;
  location: string;
  remote: boolean;
  startDate: string;
  endDate: string;
  deadline: string;
  creatorsNeeded: number;
  status: CampaignStatus;
  cover: string;
  requirements: {
    minFollowers: number;
    maxFollowers?: number;
    minEngagement?: number;
    niches: string[];
    languages: string[];
    experience: string;
  };
  deliverables: Deliverable[];
  createdAt: string;
  views: number;
}

export interface Application {
  id: string;
  campaignId: string;
  creatorId: string;
  status: ApplicationStatus;
  message: string;
  contentIdea: string;
  availability: string;
  appliedAt: string;
  note?: string;
}

export interface Collaboration {
  id: string;
  campaignId: string;
  creatorId: string;
  status: CollaborationStatus;
  startedAt: string;
  deliverables: Deliverable[];
  timeline: { id: string; label: string; date: string }[];
}

export interface Message {
  id: string;
  threadId: string;
  from: "brand" | "creator" | "system";
  text: string;
  at: string;
}

export interface Thread {
  id: string;
  campaignId: string;
  creatorId: string;
  messages: Message[];
}

export interface Invitation {
  id: string;
  campaignId: string;
  creatorId: string;
  status: "SENT" | "ACCEPTED" | "DECLINED";
  sentAt: string;
}

export interface AppNotification {
  id: string;
  audience: Role;
  title: string;
  body: string;
  at: string;
  read: boolean;
}

export const NICHES = [
  "Food",
  "Travel",
  "Fashion",
  "Beauty",
  "Tech",
  "Fitness",
  "Lifestyle",
  "Music",
  "Comedy",
  "Education",
];

export const CAMPAIGN_TYPES = [
  "Instagram Reel",
  "Instagram Post",
  "Instagram Story",
  "TikTok Video",
  "YouTube Video",
  "YouTube Short",
  "Product Review",
  "Unboxing",
  "Restaurant Visit",
  "Hotel Stay",
  "Event Promotion",
  "UGC Creation",
  "Photography",
  "Brand Ambassador",
  "Giveaway Collaboration",
];

export const PERK_OPTIONS = [
  "Free meal",
  "Free product",
  "Free hotel stay",
  "Free service",
  "Gift hamper",
  "Event access",
  "VIP access",
  "Discount",
  "Brand merchandise",
  "Experience",
  "Exposure",
  "Cash arranged directly",
  "Negotiable",
];

export const LOCATIONS = [
  "Kathmandu",
  "Pokhara",
  "Lalitpur",
  "Bhaktapur",
  "Chitwan",
  "Butwal",
  "Biratnagar",
  "Remote",
];

export const PLATFORMS: Platform[] = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
  "X",
];
