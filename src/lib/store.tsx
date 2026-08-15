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
  signIn: (role?: Role) => void;
  requestMagicLink: (email: string, role: Role, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (input?: {
    name?: string;
    username?: string;
    bio?: string;
    location?: string;
    website?: string;
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
      APPLIED: "applied",
      UNDER_REVIEW: "applied",
      SHORTLISTED: "shortlisted",
      SELECTED: "accepted",
      REJECTED: "rejected",
      WITHDRAWN: "withdrawn",
      EXPIRED: "completed",
    } as any
  )[s] ?? "applied";

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
  const deadline =
    r.application_deadline ?? r.deadline ?? r.campaign_end_date ?? today();
  return {
    id: r.id,
    title: r.title,
    brandId: r.brand_id,
    description: r.description ?? "",
    category: r.category ?? "General",
    types: types.length ? types : deliverableTitles.length ? deliverableTitles : ["Collaboration"],
    platforms,
    perks: arr<string>(r.perks),
    giftValue: r.budget ? `${r.currency ?? "NPR"} ${r.budget}` : undefined,
    location: r.location ?? "Remote",
    remote: Boolean(r.remote || r.location === "Remote"),
    startDate: r.campaign_start_date ?? r.campaign_start ?? today(),
    endDate: r.campaign_end_date ?? r.campaign_end ?? deadline,
    deadline,
    creatorsNeeded: r.creators_needed ?? r.spots ?? 1,
    status: campaignStatus(r.status),
    cover: r.cover_image ?? r.image_url ?? "/app-icon.png",
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
      dueDate: r.campaign_end_date ?? deadline,
      instructions: "Follow the campaign brief.",
      status: "PENDING" as const,
    })),
    createdAt: r.created_at?.slice(0, 10) ?? today(),
    views: r.views ?? 0,
  };
}

const mapBrand = (p: any, b: any): Brand => ({
  id: p.id ?? b?.profile_id,
  name: b?.company_name ?? b?.business_name ?? p.display_name ?? p.full_name ?? "Brand",
  logo: b?.logo_url ?? p.avatar_url ?? avatarFor(p.id ?? b?.profile_id ?? "brand"),
  category: b?.industry ?? b?.category ?? "Brand",
  description: b?.description ?? p.bio ?? "",
  location: b?.location ?? p.location ?? "Nepal",
  website: b?.website ?? p.website ?? "",
  verified: Boolean(b?.verified ?? p.verified),
  rating: Number(p.rating ?? 0),
  completedCampaigns: 0,
  responseRate: Number(p.response_rate ?? 0),
});

const mapCreator = (p: any, c: any, socials: any[] = []): Creator => {
  const builtSocials = [
    ...(c?.instagram_url
      ? [
          {
            platform: "Instagram" as const,
            username: c.instagram_url,
            followers: c?.audience_size ?? 0,
            engagement: Number(c?.engagement_rate ?? 0),
            verified: Boolean(c?.verified),
          },
        ]
      : []),
    ...(c?.tiktok_url
      ? [{ platform: "TikTok" as const, username: c.tiktok_url, followers: 0, engagement: 0, verified: false }]
      : []),
    ...(c?.youtube_url
      ? [{ platform: "YouTube" as const, username: c.youtube_url, followers: 0, engagement: 0, verified: false }]
      : []),
    ...socials.map((s: any) => ({
      platform: s.platform,
      username: s.handle,
      followers: s.followers ?? 0,
      engagement: Number(s.engagement_rate ?? 0),
      verified: Boolean(s.verified),
    })),
  ];
  return {
    id: p.id ?? c?.profile_id,
    name: p.display_name ?? p.full_name ?? "Creator",
    username: p.username ?? (p.id ? String(p.id).slice(0, 8) : "creator"),
    avatar: p.avatar_url ?? avatarFor(p.id ?? "creator"),
    bio: p.bio ?? c?.headline ?? "",
    location: p.location ?? "Nepal",
    languages: arr<string>(c?.languages).length ? arr<string>(c?.languages) : ["Nepali"],
    niches: arr<string>(c?.niches),
    socials: builtSocials as any,
    portfolio: [],
    reviews: [],
    rating: 0,
    completedCollaborations: 0,
    verified: Boolean(c?.verified),
    available: c?.available !== false,
    preferredTypes: arr<string>(c?.platforms),
  };
};

const StoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [userId, setUserId] = useState("");

  const load = useCallback(async (forcedId?: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = forcedId ?? sessionData.session?.user?.id ?? "";
    if (!uid) {
      setUserId("");
      setState({ ...initial, loading: false });
      return;
    }
    setUserId(uid);

    // Apply role/display_name from auth metadata on first login if profile incomplete
    try {
      const meta = sessionData.session?.user?.user_metadata ?? {};
      if (meta.role || meta.display_name) {
        const patch: Record<string, unknown> = {};
        if (meta.role) patch.role = meta.role;
        if (meta.display_name) patch.display_name = meta.display_name;
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
      { data: messageRows },
    ] = await Promise.all([
      db.from("profiles").select("*").eq("id", uid).maybeSingle(),
      db.from("campaigns").select("*").order("created_at", { ascending: false }),
      db.from("applications").select("*").order("applied_at", { ascending: false }),
      db.from("collaborations").select("*").order("created_at", { ascending: false }),
      Promise.resolve({ data: [] as any[] }), // no campaign_invites table in V1
      db.from("saved_campaigns").select("campaign_id").eq("creator_id", uid),
      db.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      db
        .from("conversations")
        .select("*")
        .or("brand_id.eq." + uid + ",creator_id.eq." + uid),
      db.from("messages").select("*").order("created_at", { ascending: true }),
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
      note: a.brand_note ?? a.note ?? undefined,
    }));

    const collaborations: Collaboration[] = (collabRows ?? []).map((c: any) => ({
      id: c.id,
      campaignId: c.campaign_id,
      creatorId: c.creator_id,
      status: collabStatus(c.status),
      startedAt: c.created_at?.slice(0, 10) ?? today(),
      deliverables: [],
      timeline: [
        {
          id: "created-" + c.id,
          label: "Collaboration started",
          date: c.created_at?.slice(0, 10) ?? today(),
        },
      ],
    }));

    const threads: Thread[] = (conversationRows ?? []).map((c: any) => ({
      id: c.id,
      campaignId: c.campaign_id,
      creatorId: c.creator_id,
      messages: (messageRows ?? [])
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

    const [{ data: brandRows }, { data: creatorRows }] = await Promise.all([
      db.from("brand_profiles").select("*").limit(1000),
      db.from("creator_profiles").select("*").limit(1000),
    ]);

    const ids = [
      ...new Set<string>([
        ...(campaignRows ?? []).map((r: any) => r.brand_id),
        ...(appRows ?? []).map((r: any) => r.creator_id),
        ...(collabRows ?? []).map((r: any) => r.creator_id),
        ...(brandRows ?? []).map((r: any) => r.profile_id ?? r.user_id),
        ...(creatorRows ?? []).map((r: any) => r.profile_id ?? r.user_id),
        uid,
      ].filter(Boolean)),
    ];

    const { data: profiles } = ids.length
      ? await db.from("profiles").select("*").in("id", ids)
      : { data: [] };

    const pm = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const bm = new Map((brandRows ?? []).map((b: any) => [b.profile_id ?? b.user_id, b]));
    const cm = new Map((creatorRows ?? []).map((c: any) => [c.profile_id ?? c.user_id, c]));

    setLookupData(
      [...bm.keys()].map((id) => mapBrand(pm.get(id) ?? { id }, bm.get(id))),
      [...cm.keys()].map((id) => mapCreator(pm.get(id) ?? { id }, cm.get(id), [])),
    );

    setState({
      role: me?.role === "brand" ? "brand" : me?.role === "creator" ? "creator" : null,
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
  }, []);

  useEffect(() => {
    void load();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUserId("");
        setState({ ...initial, loading: false });
      } else if (session?.user?.id) {
        void load(session.user.id);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
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
        () => void load(userId),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => void load(userId),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collaborations" },
        () => void load(userId),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => void load(userId),
      )
      .subscribe();
    return () => {
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
      setRole: (role) => setState((s) => ({ ...s, role })),
      signIn: (role) => setState((s) => ({ ...s, signedIn: true, role })),
      requestMagicLink: async (email, role, name) => {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: {
              role,
              display_name: name,
            },
          },
        });
        if (error) throw error;
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      completeOnboarding: async (input) => {
        if (!userId) return;
        const role = state.role ?? "creator";
        const { error } = await db
          .from("profiles")
          .update({
            role,
            display_name: input?.name,
            username: input?.username || null,
            bio: input?.bio || null,
            location: input?.location || null,
            website: input?.website || null,
            onboarded: true,
          })
          .eq("id", userId);
        if (error) throw error;
        if (role === "brand") {
          const { error: e } = await db.from("brand_profiles").upsert(
            {
              profile_id: userId,
              company_name: input?.name ?? "My Brand",
              website: input?.website ?? null,
              location: input?.location ?? null,
            },
            { onConflict: "profile_id" },
          );
          if (e) throw e;
        } else {
          const { error: e } = await db.from("creator_profiles").upsert(
            {
              profile_id: userId,
              languages: ["Nepali"],
              niches: [],
              platforms: [],
            },
            { onConflict: "profile_id" },
          );
          if (e) throw e;
        }
        await refresh();
      },
      toggleSaved: async (campaignId) => {
        if (state.saved.includes(campaignId)) {
          await db
            .from("saved_campaigns")
            .delete()
            .eq("creator_id", userId)
            .eq("campaign_id", campaignId);
        } else {
          await db
            .from("saved_campaigns")
            .upsert(
              { creator_id: userId, campaign_id: campaignId },
              { onConflict: "creator_id,campaign_id" },
            );
        }
        await refresh();
      },
      addCampaign: async (campaign) => {
        const { error } = await db
          .from("campaigns")
          .insert({
            brand_id: userId,
            title: campaign.title,
            description: campaign.description,
            category: campaign.category,
            location: campaign.location,
            remote: campaign.remote,
            perks: campaign.perks ?? [],
            platforms: campaign.platforms ?? [],
            deliverables: (campaign.deliverables ?? []).map((d: any) => d.title ?? d),
            requirements:
              typeof campaign.requirements === "string"
                ? campaign.requirements
                : JSON.stringify(campaign.requirements ?? {}),
            min_followers: campaign.requirements?.minFollowers ?? 0,
            creators_needed: campaign.creatorsNeeded ?? 1,
            application_deadline: campaign.deadline || null,
            campaign_start_date: campaign.startDate || null,
            campaign_end_date: campaign.endDate || null,
            status: "published",
            cover_image: campaign.cover || null,
          })
          .select()
          .single();
        if (error) throw error;
        await refresh();
      },
      applyToCampaign: async ({ campaignId, message, contentIdea, availability }) => {
        const { error } = await db.from("applications").insert({
          campaign_id: campaignId,
          creator_id: userId,
          message,
          content_idea: contentIdea,
          availability,
          status: "applied",
        });
        if (error) throw error;
        await refresh();
      },
      withdrawApplication: async (id) => {
        const { error } = await db
          .from("applications")
          .update({ status: "withdrawn" })
          .eq("id", id)
          .eq("creator_id", userId);
        if (error) throw error;
        await refresh();
      },
      setApplicationStatus: async (id, status) => {
        if (status === "SELECTED") {
          const { error } = await db.rpc("accept_application", {
            _application_id: id,
          });
          if (error) throw error;
        } else {
          const { error } = await db
            .from("applications")
            .update({ status: dbAppStatus(status) })
            .eq("id", id);
          if (error) throw error;
        }
        await refresh();
      },
      setApplicantNote: async (id, note) => {
        const { error } = await db
          .from("applications")
          .update({ brand_note: note })
          .eq("id", id);
        if (error) throw error;
        await refresh();
      },
      inviteCreator: async (campaignId, creatorId) => {
        // V1 schema has no campaign_invites table — record as a shortlisted application if present
        const { data: existing } = await db
          .from("applications")
          .select("id")
          .eq("campaign_id", campaignId)
          .eq("creator_id", creatorId)
          .maybeSingle();
        if (existing?.id) {
          await db.from("applications").update({ status: "shortlisted" }).eq("id", existing.id);
        }
        await refresh();
      },
      submitDeliverable: async (collaborationId, deliverableId, submission) => {
        const collab = state.collaborations.find((c) => c.id === collaborationId);
        if (!collab) throw new Error("Collaboration not found");
        // Store submission on collaboration notes (V1 has no deliverables/submissions tables)
        const note = [submission.note, submission.link].filter(Boolean).join(" — ");
        const { error } = await db
          .from("collaborations")
          .update({
            status: "work_submitted",
            notes: note || null,
          })
          .eq("id", collaborationId);
        if (error) throw error;
        await refresh();
      },
      reviewDeliverable: async (collaborationId, deliverableId, status) => {
        const collabStatusDb =
          status === "APPROVED"
            ? "completed"
            : status === "REVISION_REQUESTED"
              ? "revision_requested"
              : status === "SUBMITTED"
                ? "work_submitted"
                : "active";
        const { error } = await db
          .from("collaborations")
          .update({ status: collabStatusDb })
          .eq("id", collaborationId);
        if (error) throw error;
        await refresh();
      },
      sendMessage: async (threadId, text) => {
        if (!text.trim()) return;
        const { error } = await db.from("messages").insert({
          conversation_id: threadId,
          sender_id: userId,
          body: text.trim(),
        });
        if (error) throw error;
        await refresh();
      },
      markNotificationsRead: async () => {
        const { error } = await db
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("user_id", userId)
          .is("read_at", null);
        if (error) throw error;
        await refresh();
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
