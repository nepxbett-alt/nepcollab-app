import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setLookupData } from "@/lib/lookup";
import type {
  AppNotification,
  Application,
  ApplicationStatus,
  Brand,
  Campaign,
  Collaboration,
  Creator,
  DeliverableStatus,
  Invitation,
  Role,
  Thread,
} from "@/data/types";

interface State {
  role: Role | null;
  signedIn: boolean;
  onboarded: boolean;
  campaigns: Campaign[];
  applications: Application[];
  collaborations: Collaboration[];
  threads: Thread[];
  invitations: Invitation[];
  notifications: AppNotification[];
  saved: string[];
  loading: boolean;
}

interface Store extends State {
  currentCreatorId: string;
  currentBrandId: string;
  setRole: (role: Role) => void;
  requestMagicLink: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  handleAuthCallback: () => Promise<{ userId: string; onboarded: boolean }>;
  signOut: () => Promise<void>;
  completeOnboarding: (input?: {
    name?: string;
    username?: string;
    bio?: string;
    location?: string;
    website?: string;
    niches?: string[];
    languages?: string[];
    role?: Role;
  }) => Promise<void>;
  upsertSocialAccount: (input: {
    platform: string;
    handle: string;
    followers?: number;
    engagementRate?: number;
    profileUrl?: string;
  }) => Promise<void>;
  removeSocialAccount: (id: string) => Promise<void>;
  updateProfile: (input: {
    name?: string;
    username?: string;
    bio?: string;
    location?: string;
    niches?: string[];
    languages?: string[];
    availability?: string;
  }) => Promise<void>;
  toggleSaved: (campaignId: string) => Promise<void>;
  addCampaign: (campaign: Campaign) => Promise<void>;
  applyToCampaign: (input: {
    campaignId: string;
    message: string;
    contentIdea: string;
    availability: string;
  }) => Promise<void>;
  withdrawApplication: (id: string) => Promise<void>;
  setApplicationStatus: (id: string, status: ApplicationStatus) => Promise<void>;
  setApplicantNote: (id: string, note: string) => Promise<void>;
  inviteCreator: (campaignId: string, creatorId: string) => Promise<void>;
  submitDeliverable: (
    collaborationId: string,
    deliverableId: string,
    submission: { note: string; link: string },
  ) => Promise<void>;
  reviewDeliverable: (
    collaborationId: string,
    deliverableId: string,
    status: DeliverableStatus,
  ) => Promise<void>;
  sendMessage: (threadId: string, text: string) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  uploadFile: (
    bucket: "avatars" | "campaign-assets" | "submissions",
    path: string,
    file: File,
  ) => Promise<string>;
}

const initial: State = {
  role: null,
  signedIn: false,
  onboarded: false,
  campaigns: [],
  applications: [],
  collaborations: [],
  threads: [],
  invitations: [],
  notifications: [],
  saved: [],
  loading: true,
};

const db = supabase as any;
const today = () => new Date().toISOString().slice(0, 10);
const avatarFor = (id: string) =>
  "https://api.dicebear.com/10.x/lorelei/svg?seed=" + encodeURIComponent(id);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const campaignStatus = (s: string): Campaign["status"] =>
  (
    {
      draft: "DRAFT",
      pending_review: "PENDING_REVIEW",
      active: "APPLICATIONS_OPEN",
      published: "APPLICATIONS_OPEN",
      paused: "PAUSED",
      closed: "SELECTION",
      completed: "COMPLETED",
      cancelled: "CANCELLED",
    } as any
  )[s] ?? "DRAFT";

const appStatus = (s: string): ApplicationStatus =>
  (
    {
      pending: "APPLIED",
      applied: "APPLIED",
      under_review: "UNDER_REVIEW",
      shortlisted: "SHORTLISTED",
      accepted: "SELECTED",
      rejected: "REJECTED",
      withdrawn: "WITHDRAWN",
      completed: "EXPIRED",
    } as any
  )[s] ?? "APPLIED";

const dbAppStatus = (s: ApplicationStatus) =>
  (
    {
      APPLIED: "pending",
      UNDER_REVIEW: "under_review",
      SHORTLISTED: "shortlisted",
      SELECTED: "accepted",
      REJECTED: "rejected",
      WITHDRAWN: "withdrawn",
      EXPIRED: "completed",
    } as any
  )[s] ?? "pending";

const collabStatus = (s: string): Collaboration["status"] =>
  (
    {
      active: "ACTIVE",
      submitted: "WORK_SUBMITTED",
      work_submitted: "WORK_SUBMITTED",
      revision_requested: "REVISION_REQUESTED",
      brand_approved: "REVIEWING",
      completed: "COMPLETED",
    } as any
  )[s] ?? "ACTIVE";

function mapCampaign(r: any): Campaign {
  const req =
    typeof r.requirements === "string"
      ? (() => {
          try {
            return JSON.parse(r.requirements);
          } catch {
            return {};
          }
        })()
      : r.requirements && typeof r.requirements === "object"
        ? r.requirements
        : {};
  const platforms = arr<string>(r.platforms) as Campaign["platforms"];
  const deliverableTitles = arr<string>(r.deliverables);
  const types = arr<string>(r.content_types);
  const deadline = r.deadline ?? r.campaign_end ?? today();
  return {
    id: r.id,
    title: r.title,
    brandId: r.brand_id,
    description: r.description ?? r.brief ?? "",
    category: r.category ?? "General",
    types: types.length ? types : deliverableTitles.length ? deliverableTitles : ["Collaboration"],
    platforms,
    perks: arr<string>(r.perks),
    giftValue: r.creator_reward
      ? "NPR " + r.creator_reward
      : r.budget
        ? `${r.currency ?? "NPR"} ${r.budget}`
        : undefined,
    location: r.location ?? "Remote",
    remote: Boolean(r.remote || r.location === "Remote"),
    startDate: r.campaign_start ?? today(),
    endDate: r.campaign_end ?? deadline,
    deadline,
    creatorsNeeded: r.spots ?? 1,
    status: campaignStatus(r.status),
    featured: Boolean(r.featured),
    cover: r.image_url ?? "/app-icon.png",
    requirements: {
      minFollowers: r.min_followers ?? req.minFollowers ?? 0,
      maxFollowers: req.maxFollowers,
      minEngagement: req.minEngagement,
      niches: arr<string>(req.niches),
      languages: arr<string>(req.languages),
      experience: req.experience ?? "No minimum",
    },
    deliverables: deliverableTitles.map((title, i) => ({
      id: r.id + "-" + i,
      title,
      platform: (platforms[0] ?? "Instagram") as any,
      contentType: title,
      dueDate: r.campaign_end ?? deadline,
      instructions: r.brief ?? "Follow the campaign brief.",
      status: "PENDING" as const,
    })),
    createdAt: r.created_at?.slice(0, 10) ?? today(),
    views: r.views ?? 0,
  };
}

const mapBrand = (p: any, b: any): Brand => ({
  id: p.id ?? b?.user_id,
  name: b?.business_name ?? p.full_name ?? "Brand",
  logo: p.avatar_url ?? avatarFor(p.id ?? b?.user_id ?? "brand"),
  category: b?.category ?? "Brand",
  description: p.bio ?? "",
  location: p.location ?? "Nepal",
  website: b?.website ?? "",
  verified: Boolean(p.verified),
  rating: Number(p.rating ?? 0),
  completedCampaigns: 0,
  responseRate: Number(p.response_rate ?? 0),
});

const mapCreator = (
  p: any,
  c: any,
  socials: any[] = [],
  portfolioRows: any[] = [],
  reviewRows: any[] = [],
): Creator => {
  return {
    id: p.id ?? c?.user_id,
    name: p.full_name ?? "Creator",
    username: p.username ?? (p.id ? String(p.id).slice(0, 8) : "creator"),
    avatar: p.avatar_url ?? avatarFor(p.id ?? "creator"),
    bio: p.bio ?? "",
    location: p.location ?? "Nepal",
    languages: arr<string>(c?.languages),
    niches: arr<string>(c?.niches),
    socials: socials.map((s: any) => ({
      id: s.id,
      platform: s.platform,
      username: s.handle ?? s.username ?? "",
      followers: s.followers ?? 0,
      engagement: Number(s.engagement_rate ?? 0),
      verified: Boolean(s.verified),
    })) as any,
    portfolio: portfolioRows.map((item: any) => ({
      id: item.id,
      title: item.title ?? "Work",
      brand: item.category ?? "",
      platform: (item.platform ?? "Instagram") as any,
      image: item.thumbnail_path || item.media_path || item.external_url || "/app-icon.png",
      category: item.category ?? "General",
      date: item.created_at?.slice?.(0, 10) ?? today(),
    })),
    reviews: reviewRows.map((r: any) => ({
      id: r.id,
      author: r.author_name ?? "Reviewer",
      authorAvatar: avatarFor(r.reviewer_id ?? r.id),
      rating: Number(r.rating ?? 0),
      text: r.comment ?? "",
      date: r.created_at?.slice?.(0, 10) ?? today(),
    })),
    rating: Number(p.rating ?? 0),
    completedCollaborations: Number(p.review_count ?? 0),
    completionRate: Number(p.completion_rate ?? 0),
    verified: Boolean(p.verified || c?.social_verified),
    available: String(c?.availability ?? "available").toLowerCase() !== "unavailable",
    preferredTypes: arr<string>(c?.platforms),
  };
};

const StoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [userId, setUserId] = useState("");

  const load = useCallback(async (forcedId?: string) => {
    try {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = forcedId ?? sessionData.session?.user?.id ?? "";
    if (!uid) {
      setUserId("");
      // Public marketplace data still loads for guests
      try {
        // Guests only see publicly discoverable campaigns (active + public visibility).
        const { data: campaignRows } = await db
          .from("campaigns")
          .select(
            "id, brand_id, title, description, category, location, platforms, spots, deadline, deliverables, requirements, status, created_at, brief, image_url, min_followers, views, content_types, perks, remote, campaign_start, campaign_end, featured, creator_reward, budget, currency, visibility",
          )
          .eq("status", "active")
          .eq("visibility", "public")
          .order("created_at", { ascending: false })
          .limit(100);
        const brandIds = [...new Set((campaignRows ?? []).map((r: any) => r.brand_id).filter(Boolean))];
        const [{ data: brandRows }, { data: profiles }] = await Promise.all([
          brandIds.length
            ? db.from("brand_profiles").select("user_id, business_name, category, website").in("user_id", brandIds)
            : Promise.resolve({ data: [] as any[] }),
          brandIds.length
            ? db.from("profiles").select("id, full_name, avatar_url, bio, location, verified, rating, response_rate").in("id", brandIds)
            : Promise.resolve({ data: [] as any[] }),
        ]);
        const pm = new Map((profiles ?? []).map((p: any) => [p.id, p]));
        const bm = new Map((brandRows ?? []).map((b: any) => [b.user_id, b]));
        setLookupData(
          brandIds.map((id) => mapBrand(pm.get(id) ?? { id }, bm.get(id))),
          [],
        );
        setState({
          ...initial,
          campaigns: (campaignRows ?? []).map(mapCampaign),
          loading: false,
        });
      } catch (err) {
        console.error("[NepCollab] public load failed", err);
        setState({ ...initial, loading: false });
      }
      return;
    }
    setUserId(uid);

    // Apply role/display_name from auth metadata on first login if profile incomplete
    try {
      const meta = sessionData.session?.user?.user_metadata ?? {};
      if (meta.role || meta.display_name || meta.full_name) {
        const patch: Record<string, unknown> = {};
        if (meta.role) patch.role = meta.role;
        const name = meta.display_name || meta.full_name;
        if (name) patch.full_name = name;
        if (Object.keys(patch).length) {
          await db.from("profiles").update(patch).eq("id", uid).is("role", null);
        }
      }
    } catch {
      /* non-fatal */
    }

    const [
      { data: me },
      { data: campaignRows },
      { data: appRows },
      { data: collabRows },
      { data: inviteRows },
      { data: saveRows },
      { data: notificationRows },
      { data: conversationRows },
      { data: deliverableRows },
      { data: submissionRows },
    ] = await Promise.all([
      db
        .from("profiles")
        .select(
          "id, role, full_name, username, avatar_url, bio, location, verified, verification_status, rating, review_count, completion_rate, response_rate, onboarded, suspended",
        )
        .eq("id", uid)
        .maybeSingle(),
      db
        .from("campaigns")
        .select(
          "id, brand_id, title, description, category, location, platforms, spots, deadline, deliverables, requirements, status, created_at, brief, image_url, min_followers, views, content_types, perks, remote, campaign_start, campaign_end, featured, creator_reward, budget, currency, visibility",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      // RLS already scopes rows; still limit for client memory.
      db
        .from("applications")
        .select(
          "id, campaign_id, creator_id, pitch, status, brand_remarks, applied_at, message, content_idea, availability, note",
        )
        .order("applied_at", { ascending: false })
        .limit(300),
      db
        .from("collaborations")
        .select("id, application_id, campaign_id, creator_id, brand_id, status, deadline, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      Promise.resolve({ data: [] as any[] }), // invites optional
      db.from("saved_campaigns").select("campaign_id").eq("user_id", uid),
      db
        .from("notifications")
        .select("id, type, title, body, data, read_at, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("conversations")
        .select("id, campaign_id, creator_id, brand_id, application_id, created_at")
        .or("brand_id.eq." + uid + ",creator_id.eq." + uid)
        .limit(100),
      db
        .from("deliverables")
        .select(
          "id, application_id, title, kind, due_at, status, platform, instructions, submission_note, submission_link, submitted_at",
        )
        .limit(500),
      db
        .from("submissions")
        .select(
          "id, collaboration_id, creator_id, content_url, caption, proof_url, status, brand_feedback, submitted_at, application_id, url, feedback, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

    const apps: Application[] = (appRows ?? []).map((a: any) => ({
      id: a.id,
      campaignId: a.campaign_id,
      creatorId: a.creator_id,
      status: appStatus(a.status),
      message: a.message ?? a.pitch ?? "",
      contentIdea: a.content_idea ?? "",
      availability: a.availability ?? "",
      appliedAt: a.applied_at?.slice(0, 10) ?? today(),
      note: a.brand_remarks ?? a.note ?? undefined,
    }));

    const deliverableStatusMap = (s: string): DeliverableStatus =>
      (
        {
          pending: "PENDING",
          submitted: "SUBMITTED",
          approved: "APPROVED",
          revision_requested: "REVISION_REQUESTED",
          changes_requested: "REVISION_REQUESTED",
        } as any
      )[String(s || "").toLowerCase()] ?? "PENDING";

    const delivByApp = new Map<string, any[]>();
    for (const d of deliverableRows ?? []) {
      const key = d.application_id;
      if (!key) continue;
      const list = delivByApp.get(key) ?? [];
      list.push(d);
      delivByApp.set(key, list);
    }
    const subByCollab = new Map<string, any[]>();
    for (const s of submissionRows ?? []) {
      const key = s.collaboration_id;
      if (!key) continue;
      const list = subByCollab.get(key) ?? [];
      list.push(s);
      subByCollab.set(key, list);
    }

    const collaborations: Collaboration[] = (collabRows ?? []).map((c: any) => {
      const appId = c.application_id;
      const rawDelivs = delivByApp.get(appId) ?? [];
      const subs = subByCollab.get(c.id) ?? [];
      const latestSub = subs[0];
      const deliverables = rawDelivs.map((d: any) => ({
        id: d.id,
        title: d.title ?? "Deliverable",
        platform: (d.platform ?? "Instagram") as any,
        contentType: d.kind ?? d.title ?? "Content",
        dueDate: d.due_at?.slice?.(0, 10) ?? c.deadline?.slice?.(0, 10) ?? today(),
        instructions: d.instructions ?? "Follow the campaign brief.",
        status: deliverableStatusMap(d.status),
        submission:
          d.submission_link || d.submission_note
            ? {
                note: d.submission_note ?? "",
                link: d.submission_link ?? "",
                submittedAt: d.submitted_at?.slice?.(0, 10) ?? today(),
              }
            : latestSub
              ? {
                  note: latestSub.caption ?? latestSub.feedback ?? "",
                  link: latestSub.content_url ?? latestSub.url ?? latestSub.proof_url ?? "",
                  submittedAt: latestSub.submitted_at?.slice?.(0, 10) ?? today(),
                }
              : undefined,
      }));
      return {
        id: c.id,
        campaignId: c.campaign_id,
        creatorId: c.creator_id,
        status: collabStatus(c.status),
        startedAt: c.created_at?.slice(0, 10) ?? today(),
        deliverables,
        timeline: [
          {
            id: "created-" + c.id,
            label: "Collaboration started",
            date: c.created_at?.slice(0, 10) ?? today(),
          },
        ],
      };
    });

    // Messages: only for conversations the user belongs to (already filtered),
    // paginate per conversation (last 100) to avoid loading the entire table.
    const convIds = (conversationRows ?? []).map((c: any) => c.id).filter(Boolean);
    let messageRows: any[] = [];
    if (convIds.length) {
      const { data: msgs } = await db
        .from("messages")
        .select("id, conversation_id, sender_id, body, created_at, read_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: true })
        .limit(500);
      messageRows = msgs ?? [];
    }

    const threads: Thread[] = (conversationRows ?? []).map((c: any) => ({
      id: c.id,
      campaignId: c.campaign_id,
      creatorId: c.creator_id,
      messages: messageRows
        .filter((m: any) => m.conversation_id === c.id)
        .map((m: any) => ({
          id: m.id,
          threadId: c.id,
          from: m.sender_id === c.brand_id ? "brand" : "creator",
          text: m.body,
          at: m.created_at,
        })),
    }));

    const notifications: AppNotification[] = (notificationRows ?? []).map((n: any) => ({
      id: n.id,
      audience: me?.role === "brand" ? "brand" : "creator",
      title: n.title,
      body: n.body,
      at: n.created_at?.slice(0, 10) ?? today(),
      read: Boolean(n.read_at),
    }));

    const invitations: Invitation[] = (inviteRows ?? []).map((i: any) => ({
      id: i.id,
      campaignId: i.campaign_id,
      creatorId: i.creator_id,
      status: String(i.status).toUpperCase() as any,
      sentAt: i.created_at?.slice(0, 10) ?? today(),
    }));

    const [
      { data: brandRows },
      { data: creatorRows },
      { data: socialRows },
      { data: portfolioRows },
      { data: reviewRows },
    ] = await Promise.all([
      db.from("brand_profiles").select("user_id, business_name, category, website, social_url, team_size, featured").limit(200),
      db.from("creator_profiles").select("user_id, niches, platforms, followers, engagement_rate, languages, availability, portfolio_urls, media_kit_url, social_verified, featured, starting_rate, average_views").limit(200),
      db.from("social_accounts").select("id, user_id, platform, handle, followers, engagement_rate, verified").limit(200),
      db
        .from("portfolio_items")
        .select("id, creator_id, title, description, media_path, thumbnail_path, external_url, platform, category, created_at")
        .order("sort_order", { ascending: true })
        .limit(500),
      db
        .from("reviews")
        .select("id, collaboration_id, reviewer_id, reviewee_id, rating, comment, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const ids = [
      ...new Set<string>([
        ...(campaignRows ?? []).map((r: any) => r.brand_id),
        ...(appRows ?? []).map((r: any) => r.creator_id),
        ...(collabRows ?? []).map((r: any) => r.creator_id),
        ...(brandRows ?? []).map((r: any) => r.user_id),
        ...(creatorRows ?? []).map((r: any) => r.user_id),
        ...(reviewRows ?? []).map((r: any) => r.reviewer_id),
        uid,
      ].filter(Boolean)),
    ];

    const { data: profiles } = ids.length
      ? await db.from("profiles").select("id, role, full_name, username, avatar_url, bio, location, verified, rating, review_count, completion_rate, response_rate, onboarded").in("id", ids)
      : { data: [] };

    const pm = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const bm = new Map((brandRows ?? []).map((b: any) => [b.user_id, b]));
    const cm = new Map((creatorRows ?? []).map((c: any) => [c.user_id, c]));

    const socialsByUser = new Map<string, any[]>();
    for (const s of socialRows ?? []) {
      if (!s.user_id) continue;
      const list = socialsByUser.get(s.user_id) ?? [];
      list.push(s);
      socialsByUser.set(s.user_id, list);
    }
    const portfolioByCreator = new Map<string, any[]>();
    for (const item of portfolioRows ?? []) {
      if (!item.creator_id) continue;
      const list = portfolioByCreator.get(item.creator_id) ?? [];
      list.push(item);
      portfolioByCreator.set(item.creator_id, list);
    }
    const reviewsByReviewee = new Map<string, any[]>();
    for (const r of reviewRows ?? []) {
      if (!r.reviewee_id) continue;
      const list = reviewsByReviewee.get(r.reviewee_id) ?? [];
      const reviewer = pm.get(r.reviewer_id);
      list.push({ ...r, author_name: reviewer?.full_name ?? "Reviewer" });
      reviewsByReviewee.set(r.reviewee_id, list);
    }

    setLookupData(
      [...bm.keys()].map((id) => mapBrand(pm.get(id) ?? { id }, bm.get(id))),
      [...cm.keys()].map((id) =>
        mapCreator(
          pm.get(id) ?? { id },
          cm.get(id),
          socialsByUser.get(id) ?? [],
          portfolioByCreator.get(id) ?? [],
          reviewsByReviewee.get(id) ?? [],
        ),
      ),
    );

    setState({
      role: me?.role === "admin" ? "admin" : me?.role === "brand" ? "brand" : me?.role === "creator" ? "creator" : null,
      signedIn: true,
      onboarded: Boolean(me?.onboarded),
      campaigns: (campaignRows ?? []).map(mapCampaign),
      applications: apps,
      collaborations,
      threads,
      invitations,
      notifications,
      saved: (saveRows ?? []).map((s: any) => s.campaign_id),
      loading: false,
    });
    } catch (err) {
      console.error("[NepCollab] load failed", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    void load();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUserId("");
        setState({ ...initial, loading: false });
        return;
      }
      // INITIAL_SESSION / SIGNED_IN / TOKEN_REFRESHED — keep session sticky
      if (session?.user?.id) {
        if (event === "TOKEN_REFRESHED") {
          setUserId(session.user.id);
          return;
        }
        void load(session.user.id);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleReload = () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      // Debounce full reloads so bursts of events (e.g. accept_application) do not thrash.
      reloadTimer = setTimeout(() => void load(userId), 400);
    };

    const channel = supabase
      .channel("user:" + userId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: "user_id=eq." + userId,
        },
        scheduleReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        scheduleReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collaborations" },
        scheduleReload,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          const row = payload?.new;
          if (!row?.conversation_id) {
            scheduleReload();
            return;
          }
          // Patch only the affected thread when possible — avoids full reload for chat.
          setState((s) => {
            const thread = s.threads.find((t) => t.id === row.conversation_id);
            if (!thread) {
              scheduleReload();
              return s;
            }
            if (thread.messages.some((m) => m.id === row.id)) return s;
            const from =
              row.sender_id === userId
                ? s.role === "brand"
                  ? "brand"
                  : "creator"
                : s.role === "brand"
                  ? "creator"
                  : "brand";
            return {
              ...s,
              threads: s.threads.map((t) =>
                t.id === row.conversation_id
                  ? {
                      ...t,
                      messages: [
                        ...t.messages,
                        {
                          id: row.id,
                          threadId: row.conversation_id,
                          from: from as "brand" | "creator",
                          text: row.body,
                          at: row.created_at,
                        },
                      ],
                    }
                  : t,
              ),
            };
          });
        },
      )
      .subscribe();
    return () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      void supabase.removeChannel(channel);
    };
  }, [userId, load]);

  const refresh = async () => {
    await load(userId);
  };

  const value = useMemo<Store>(
    () => ({
      ...state,
      currentCreatorId: userId,
      currentBrandId: userId,
      setRole: (role) => {
        // Never allow client to claim admin — only profiles.role from DB can.
        if (role === "admin") return;
        setState((s) => ({ ...s, role }));
      },
      requestMagicLink: async (email) => {
        const normalized = email.trim().toLowerCase();
        if (!normalized.includes("@")) {
          throw new Error("Enter a valid email address.");
        }
        try {
          localStorage.setItem("nepcollab.auth.email", normalized);
        } catch {
          /* ignore */
        }
        const siteUrl =
          (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ||
          (typeof window !== "undefined" ? window.location.origin : "https://nepcollab-app.vercel.app");
        const { error } = await supabase.auth.signInWithOtp({
          email: normalized,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${siteUrl}/auth/callback`,
          },
        });
        if (error) {
          const msg = (error.message || "").toLowerCase();
          if (msg.includes("rate") || msg.includes("limit")) {
            throw new Error("Too many requests. Please wait a minute and try again.");
          }
          throw new Error("We couldn't send the login link. Please try again.");
        }
      },
      handleAuthCallback: async () => {
        // Exchange PKCE code or pick up session from URL hash
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          const errDesc =
            url.searchParams.get("error_description") ||
            url.searchParams.get("error") ||
            "";
          if (errDesc) {
            const lower = errDesc.toLowerCase();
            if (lower.includes("expir")) {
              throw new Error("That link has expired. Request a new one.");
            }
            if (lower.includes("already") || lower.includes("used")) {
              throw new Error("This link has already been used. Request a new one.");
            }
            throw new Error("That login link is invalid. Request a new one.");
          }
          const code = url.searchParams.get("code");
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              throw new Error("That login link is invalid or expired. Request a new one.");
            }
          }
        }
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error("Could not restore your session. Try again.");
        const uid = sessionData.session?.user?.id;
        if (!uid) {
          throw new Error("No active session. Open the link from your email again.");
        }
        await load(uid);
        const { data: profile } = await db
          .from("profiles")
          .select("onboarded, role")
          .eq("id", uid)
          .maybeSingle();
        return {
          userId: uid,
          onboarded: Boolean(profile?.onboarded),
        };
      },
      verifyEmailOtp: async (email, token) => {
        const normalized = email.trim().toLowerCase();
        const code = token.replace(/\s/g, "");
        const { data, error } = await supabase.auth.verifyOtp({
          email: normalized,
          token: code,
          type: "email",
        });
        if (error) throw error;
        if (!data.session?.user?.id) {
          throw new Error("Could not start a session. Try the link in your email.");
        }
        await load(data.session.user.id);
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut({ scope: "local" });
        setUserId("");
        setState({ ...initial, loading: false });
        if (error) throw error;
      },
      completeOnboarding: async (input) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = userId || sessionData.session?.user?.id || "";
        if (!uid) {
          throw new Error("You are not signed in. Please open the magic link again.");
        }
        if (!userId) setUserId(uid);

        const metaRole = sessionData.session?.user?.user_metadata?.role as Role | undefined;
        const inputRole = (input as any)?.role as Role | undefined;
        // Prefer explicit onboarding choice; never invent admin from client
        const role = (
          inputRole === "creator" || inputRole === "brand"
            ? inputRole
            : state.role === "creator" || state.role === "brand"
              ? state.role
              : metaRole === "creator" || metaRole === "brand"
                ? metaRole
                : "creator"
        ) as Role;

        const rawUsername = (input?.username || "").trim().replace(/^@+/, "");
        const username = rawUsername
          ? rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30) || null
          : null;

        const profilePayload: Record<string, unknown> = {
          id: uid,
          role,
          full_name: (input?.name || "").trim() || null,
          username,
          bio: (input?.bio || "").trim() || null,
          location: (input?.location || "").trim() || null,
          onboarded: true,
        };
        const { error } = await db.from("profiles").upsert(profilePayload, { onConflict: "id" });
        if (error) {
          if (error.code === "23505" || /unique|duplicate/i.test(error.message || "")) {
            throw new Error("That username is taken. Try another one.");
          }
          throw new Error(error.message || "Could not save your profile.");
        }

        if (role === "brand") {
          const { error: e } = await db.from("brand_profiles").upsert(
            {
              user_id: uid,
              business_name: (input?.name || "").trim() || "My Brand",
              website: (input?.website || "").trim() || null,
              category: "Brand",
            },
            { onConflict: "user_id" },
          );
          if (e) throw new Error(e.message || "Could not save brand profile.");
        } else {
          const niches = Array.isArray((input as any)?.niches) ? (input as any).niches : [];
          const languages = Array.isArray((input as any)?.languages) ? (input as any).languages : [];
          const { error: e } = await db.from("creator_profiles").upsert(
            {
              user_id: uid,
              languages,
              niches,
              platforms: [],
            },
            { onConflict: "user_id" },
          );
          if (e) throw new Error(e.message || "Could not save creator profile.");
        }

        setState((s) => ({
          ...s,
          role,
          onboarded: true,
          signedIn: true,
        }));
        await load(uid);
      },
      toggleSaved: async (campaignId) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = userId || sessionData.session?.user?.id || "";
        if (!uid) throw new Error("Not signed in");
        if (state.saved.includes(campaignId)) {
          const { error } = await db
            .from("saved_campaigns")
            .delete()
            .eq("user_id", uid)
            .eq("campaign_id", campaignId);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await db
            .from("saved_campaigns")
            .upsert(
              { user_id: uid, campaign_id: campaignId },
              { onConflict: "user_id,campaign_id" },
            );
          if (error) throw new Error(error.message);
        }
        await load(uid);
      },
      addCampaign: async (campaign) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = userId || sessionData.session?.user?.id || "";
        if (!uid) throw new Error("Not signed in");

        const spots = Number(campaign.creatorsNeeded) || 0;
        if (spots < 1) throw new Error("Spots must be at least 1.");
        if (!campaign.title?.trim() || !campaign.description?.trim()) {
          throw new Error("Title and description are required.");
        }
        const deadline = campaign.deadline || null;
        const start = campaign.startDate || null;
        const end = campaign.endDate || null;
        if (start && end && new Date(end) < new Date(start)) {
          throw new Error("Campaign end must be on or after campaign start.");
        }
        if (deadline && new Date(deadline) < new Date(new Date().toDateString())) {
          throw new Error("Application deadline cannot be in the past.");
        }

        // Live schema only allows campaign_type: ugc | barter
        const campaignType =
          Array.isArray(campaign.perks) &&
          campaign.perks.length > 0 &&
          !String(campaign.giftValue || "").toLowerCase().includes("cash")
            ? "barter"
            : "ugc";

        const { error } = await db
          .from("campaigns")
          .insert({
            brand_id: uid,
            title: campaign.title.trim(),
            description: campaign.description.trim(),
            category: campaign.category || "General",
            location: campaign.location || "Remote",
            remote: Boolean(campaign.remote),
            perks: campaign.perks ?? [],
            content_types: campaign.types ?? [],
            platforms: campaign.platforms ?? [],
            deliverables: (campaign.deliverables ?? []).map((d: any) => d.title ?? d),
            requirements:
              typeof campaign.requirements === "string"
                ? campaign.requirements
                : JSON.stringify(campaign.requirements ?? {}),
            min_followers: campaign.requirements?.minFollowers ?? 0,
            spots,
            deadline,
            campaign_start: start,
            campaign_end: end,
            status: "active",
            visibility: "public",
            campaign_type: campaignType,
            image_url:
              campaign.cover &&
              !String(campaign.cover).startsWith("/") &&
              !String(campaign.cover).includes("picsum")
                ? campaign.cover
                : null,
            brief: campaign.description.trim() || null,
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        await load(uid);
      },
      applyToCampaign: async ({ campaignId, message, contentIdea, availability }) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = userId || sessionData.session?.user?.id || "";
        if (!uid) throw new Error("Not signed in");
        const { data: camp, error: campErr } = await db
          .from("campaigns")
          .select("id, status, deadline, visibility")
          .eq("id", campaignId)
          .maybeSingle();
        if (campErr) throw new Error(campErr.message);
        if (!camp) throw new Error("Campaign not found.");
        const st = String(camp.status || "").toLowerCase();
        if (!["active", "published"].includes(st)) {
          throw new Error("This campaign is not accepting applications.");
        }
        if (camp.deadline && new Date(camp.deadline) < new Date()) {
          throw new Error("The application deadline has passed.");
        }
        const { error } = await db.from("applications").insert({
          campaign_id: campaignId,
          creator_id: uid,
          pitch: message,
          message,
          content_idea: contentIdea,
          availability,
          status: "pending",
        });
        if (error) {
          const msg = error.message || "";
          if (msg.toLowerCase().includes("duplicate") || error.code === "23505") {
            throw new Error("You already applied to this campaign.");
          }
          throw new Error(msg || "Could not submit application");
        }
        await load(uid);
      },
      withdrawApplication: async (id) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = userId || sessionData.session?.user?.id || "";
        if (!uid) throw new Error("Not signed in");
        const { error } = await db
          .from("applications")
          .update({ status: "withdrawn" })
          .eq("id", id)
          .eq("creator_id", uid)
          .in("status", ["pending", "shortlisted"]);
        if (error) throw new Error(error.message || "Could not withdraw application.");
        await refresh();
      },
      setApplicationStatus: async (id, status) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = userId || sessionData.session?.user?.id || "";
        if (!uid) throw new Error("Not signed in");

        if (status === "SELECTED") {
          // Only the secure SECURITY DEFINER RPC — creates collaboration,
          // deliverables, conversation, members, and notification atomically.
          const { error: rpcError } = await db.rpc("accept_application", {
            _application_id: id,
          });
          if (rpcError) throw new Error(rpcError.message || "Could not accept application");
        } else {
          const { error } = await db
            .from("applications")
            .update({ status: dbAppStatus(status) })
            .eq("id", id);
          if (error) throw new Error(error.message);
        }
        await load(uid);
      },
      setApplicantNote: async (id, note) => {
        const { error } = await db
          .from("applications")
          .update({ brand_remarks: note })
          .eq("id", id);
        if (error) throw error;
        await refresh();
      },
      inviteCreator: async (campaignId, creatorId) => {
        const { data: existing } = await db
          .from("applications")
          .select("id")
          .eq("campaign_id", campaignId)
          .eq("creator_id", creatorId)
          .maybeSingle();
        if (!existing?.id) {
          throw new Error("No application found for this creator on this campaign.");
        }
        const { error } = await db
          .from("applications")
          .update({ status: "shortlisted" })
          .eq("id", existing.id);
        if (error) throw new Error(error.message);
        await refresh();
      },
      submitDeliverable: async (collaborationId, deliverableId, submission) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = userId || sessionData.session?.user?.id || "";
        if (!uid) throw new Error("Not signed in");

        const { data: collab } = await db
          .from("collaborations")
          .select("id, application_id, campaign_id")
          .eq("id", collaborationId)
          .maybeSingle();
        if (!collab) throw new Error("Collaboration not found");

        // Prefer updating the real deliverable row
        const now = new Date().toISOString();
        if (deliverableId && /^[0-9a-f-]{36}$/i.test(deliverableId)) {
          const { error: dErr } = await db
            .from("deliverables")
            .update({
              status: "submitted",
              submission_note: submission.note || null,
              submission_link: submission.link || null,
              submitted_at: now,
            })
            .eq("id", deliverableId);
          if (dErr) throw new Error(dErr.message);
        }

        // Persist authoritative submission row
        const { error: sErr } = await db.from("submissions").insert({
          collaboration_id: collaborationId,
          application_id: collab.application_id,
          creator_id: uid,
          content_url: submission.link || null,
          url: submission.link || null,
          proof_url: submission.link || null,
          caption: submission.note || null,
          status: "submitted",
          submitted_at: now,
        });
        if (sErr) throw new Error(sErr.message);

        const { error: cErr } = await db
          .from("collaborations")
          .update({ status: "submitted" })
          .eq("id", collaborationId);
        if (cErr) {
          // Do NOT roll status back to active — submission row already exists.
          throw new Error(cErr.message || "Could not mark collaboration as submitted.");
        }
        await refresh();
      },
      reviewDeliverable: async (collaborationId, deliverableId, status) => {
        const now = new Date().toISOString();
        const delivStatus =
          status === "APPROVED"
            ? "approved"
            : status === "REVISION_REQUESTED"
              ? "revision_requested"
              : status === "SUBMITTED"
                ? "submitted"
                : "pending";
        if (deliverableId && /^[0-9a-f-]{36}$/i.test(deliverableId)) {
          const { error: dErr } = await db
            .from("deliverables")
            .update({ status: delivStatus })
            .eq("id", deliverableId);
          if (dErr) throw new Error(dErr.message);
        }
        // Update latest submission for this collab
        const subStatus =
          status === "APPROVED"
            ? "approved"
            : status === "REVISION_REQUESTED"
              ? "changes_requested"
              : "submitted";
        const { error: sErr } = await db
          .from("submissions")
          .update({ status: subStatus, reviewed_at: now })
          .eq("collaboration_id", collaborationId)
          .eq("status", "submitted");
        if (sErr) throw new Error(sErr.message || "Could not update submission.");

        const collabStatusDb =
          status === "APPROVED"
            ? "completed"
            : status === "REVISION_REQUESTED"
              ? "revision_requested"
              : status === "SUBMITTED"
                ? "submitted"
                : "active";
        const { error } = await db
          .from("collaborations")
          .update({ status: collabStatusDb })
          .eq("id", collaborationId);
        if (error) throw new Error(error.message);
        await refresh();
      },
      sendMessage: async (threadId, text) => {
        if (!text.trim()) return;
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = userId || sessionData.session?.user?.id || "";
        if (!uid) throw new Error("Not signed in");
        const body = text.trim();
        const { data: inserted, error } = await db
          .from("messages")
          .insert({
            conversation_id: threadId,
            sender_id: uid,
            body,
          })
          .select("id, conversation_id, sender_id, body, created_at")
          .single();
        if (error) throw new Error(error.message);
        if (!inserted?.id) throw new Error("Message was not saved. Please try again.");
        const from = state.role === "brand" ? "brand" : "creator";
        setState((s) => ({
          ...s,
          threads: s.threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: [
                    ...t.messages,
                    {
                      id: inserted.id,
                      threadId,
                      from: from as "brand" | "creator",
                      text: body,
                      at: inserted.created_at ?? new Date().toISOString(),
                    },
                  ],
                }
              : t,
          ),
        }));
      },
      markNotificationsRead: async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = userId || sessionData.session?.user?.id || "";
        if (!uid) return;
        const { error } = await db
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("user_id", uid)
          .is("read_at", null);
        if (error) throw error;
        await refresh();
      },
      upsertSocialAccount: async (input) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = userId || sessionData.session?.user?.id || "";
        if (!uid) throw new Error("Not signed in");
        const platform = String(input.platform || "").trim();
        const handle = String(input.handle || "").trim().replace(/^@+/, "");
        if (!platform || !handle) throw new Error("Platform and handle are required.");
        const followers = Number(input.followers ?? 0) || 0;
        const engagementRate = Number(input.engagementRate ?? 0) || 0;
        const profileUrl = input.profileUrl || null;
        const { data: existing } = await db
          .from("social_accounts")
          .select("id")
          .eq("user_id", uid)
          .eq("platform", platform)
          .maybeSingle();
        if (existing?.id) {
          const { error } = await db
            .from("social_accounts")
            .update({
              handle,
              followers,
              engagement_rate: engagementRate,
              profile_url: profileUrl,
            })
            .eq("id", existing.id)
            .eq("user_id", uid);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await db.from("social_accounts").insert({
            user_id: uid,
            platform,
            handle,
            followers,
            engagement_rate: engagementRate,
            profile_url: profileUrl,
            verified: false,
          });
          if (error) throw new Error(error.message);
        }
        if (followers > 0) {
          await db.from("creator_profiles").update({ followers }).eq("user_id", uid);
        }
        await load(uid);
      },
      removeSocialAccount: async (id) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = userId || sessionData.session?.user?.id || "";
        if (!uid) throw new Error("Not signed in");
        const { error } = await db
          .from("social_accounts")
          .delete()
          .eq("id", id)
          .eq("user_id", uid);
        if (error) throw new Error(error.message);
        await load(uid);
      },
      updateProfile: async (input) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = userId || sessionData.session?.user?.id || "";
        if (!uid) throw new Error("Not signed in");
        const profilePatch: Record<string, unknown> = {};
        if (input.name !== undefined) profilePatch.full_name = input.name.trim() || null;
        if (input.username !== undefined) {
          const raw = input.username.trim().replace(/^@+/, "");
          profilePatch.username = raw
            ? raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30) || null
            : null;
        }
        if (input.bio !== undefined) profilePatch.bio = input.bio.trim() || null;
        if (input.location !== undefined) profilePatch.location = input.location.trim() || null;
        if (Object.keys(profilePatch).length) {
          const { error } = await db.from("profiles").update(profilePatch).eq("id", uid);
          if (error) throw new Error(error.message);
        }
        const creatorPatch: Record<string, unknown> = {};
        if (input.niches !== undefined) creatorPatch.niches = input.niches;
        if (input.languages !== undefined) creatorPatch.languages = input.languages;
        if (input.availability !== undefined) creatorPatch.availability = input.availability;
        if (Object.keys(creatorPatch).length) {
          const { error } = await db.from("creator_profiles").update(creatorPatch).eq("user_id", uid);
          if (error) throw new Error(error.message);
        }
        await load(uid);
      },
      uploadFile: async (bucket, path, file) => {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: true, cacheControl: "3600" });
        if (error) throw error;
        return bucket === "submissions"
          ? data.path
          : supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
      },
    }),
    [state, userId],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside AppStoreProvider");
  return ctx;
}
