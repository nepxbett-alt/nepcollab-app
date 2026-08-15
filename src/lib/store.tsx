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
  const types = arr<string>(r.content_types);
  const platforms = arr<string>(r.platforms) as Campaign["platforms"];
  const deliverableTitles = arr<string>(r.deliverables);
  return {
    id: r.id,
    title: r.title,
    brandId: r.brand_id,
    description: r.description ?? r.brief ?? "",
    category: r.category ?? "General",
    types: types.length ? types : ["Collaboration"],
    platforms,
    perks: arr<string>(r.perks),
    giftValue: r.creator_reward ? "NPR " + r.creator_reward : undefined,
    location: r.location ?? "Remote",
    remote: Boolean(r.remote || r.location === "Remote"),
    startDate: r.campaign_start ?? today(),
    endDate: r.campaign_end ?? r.deadline ?? today(),
    deadline: r.deadline ?? today(),
    creatorsNeeded: r.spots ?? 1,
    status: campaignStatus(r.status),
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
      dueDate: r.campaign_end ?? r.deadline ?? today(),
      instructions: r.brief ?? "Follow the campaign brief.",
      status: "PENDING" as const,
    })),
    createdAt: r.created_at?.slice(0, 10) ?? today(),
    views: r.views ?? 0,
  };
}

const mapBrand = (p: any, b: any): Brand => ({
  id: p.id,
  name: b?.business_name ?? p.full_name ?? "Brand",
  logo: p.avatar_url ?? avatarFor(p.id),
  category: b?.category ?? "Brand",
  description: p.bio ?? "",
  location: p.location ?? "Nepal",
  website: b?.website ?? "",
  verified: Boolean(p.verified),
  rating: Number(p.rating ?? 0),
  completedCampaigns: 0,
  responseRate: Number(p.response_rate ?? 0),
});

const mapCreator = (p: any, c: any, socials: any[]): Creator => ({
  id: p.id,
  name: p.full_name ?? "Creator",
  username: p.username ?? p.id.slice(0, 8),
  avatar: p.avatar_url ?? avatarFor(p.id),
  bio: p.bio ?? "",
  location: p.location ?? "Nepal",
  languages: arr<string>(c?.languages),
  niches: arr<string>(c?.niches),
  socials: socials.map((s) => ({
    platform: s.platform as any,
    username: s.handle,
    followers: s.followers ?? 0,
    engagement: Number(s.engagement_rate ?? 0),
    verified: Boolean(s.verified),
  })),
  portfolio: [],
  reviews: [],
  rating: Number(p.rating ?? 0),
  completedCollaborations: 0,
  verified: Boolean(p.verified),
  available: c?.availability !== "unavailable",
  preferredTypes: [],
});

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
      db.from("campaign_invites").select("*").order("created_at", { ascending: false }),
      db.from("saved_campaigns").select("campaign_id").eq("user_id", uid),
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
      note: a.note ?? a.brand_remarks ?? undefined,
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

    const [{ data: brandRows }, { data: creatorRows }, { data: socialRows }] = await Promise.all([
      db.from("brand_profiles").select("*").limit(1000),
      db.from("creator_profiles").select("*").limit(1000),
      db
        .from("social_accounts")
        .select("user_id,platform,handle,followers,engagement_rate,verified")
        .limit(2000),
    ]);

    const ids = [
      ...new Set<string>([
        ...(campaignRows ?? []).map((r: any) => r.brand_id),
        ...(appRows ?? []).map((r: any) => r.creator_id),
        ...(collabRows ?? []).map((r: any) => r.creator_id),
        ...(brandRows ?? []).map((r: any) => r.user_id),
        ...(creatorRows ?? []).map((r: any) => r.user_id),
      ]),
    ];

    const { data: profiles } = ids.length
      ? await db.from("profiles").select("*").in("id", ids)
      : { data: [] };

    const pm = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const bm = new Map((brandRows ?? []).map((b: any) => [b.user_id, b]));
    const cm = new Map((creatorRows ?? []).map((c: any) => [c.user_id, c]));

    setLookupData(
      [...bm.keys()].map((id) => mapBrand(pm.get(id) ?? { id }, bm.get(id))),
      [...cm.keys()].map((id) =>
        mapCreator(
          pm.get(id) ?? { id },
          cm.get(id),
          (socialRows ?? []).filter((s: any) => s.user_id === id),
        ),
      ),
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
              full_name: name,
              business_name: role === "brand" ? name : undefined,
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
        const { error } = await db
          .from("profiles")
          .update({
            full_name: input?.name,
            username: input?.username,
            bio: input?.bio,
            location: input?.location,
            onboarded: true,
          })
          .eq("id", userId);
        if (error) throw error;
        if (state.role === "brand") {
          const { error: e } = await db.from("brand_profiles").upsert(
            {
              user_id: userId,
              business_name: input?.name ?? "My Brand",
              website: input?.website ?? null,
            },
            { onConflict: "user_id" },
          );
          if (e) throw e;
        } else {
          const { error: e } = await db.from("creator_profiles").upsert(
            {
              user_id: userId,
              languages: ["Nepali"],
              niches: [],
              platforms: [],
            },
            { onConflict: "user_id" },
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
            .eq("user_id", userId)
            .eq("campaign_id", campaignId);
        } else {
          await db
            .from("saved_campaigns")
            .upsert(
              { user_id: userId, campaign_id: campaignId },
              { onConflict: "user_id,campaign_id" },
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
            perks: campaign.perks,
            content_types: campaign.types,
            platforms: campaign.platforms,
            deliverables: campaign.deliverables.map((d) => d.title),
            requirements:
              typeof campaign.requirements === "string"
                ? campaign.requirements
                : JSON.stringify(campaign.requirements ?? {}),
            min_followers: campaign.requirements?.minFollowers ?? 0,
            spots: campaign.creatorsNeeded,
            deadline: campaign.deadline,
            campaign_start: campaign.startDate,
            campaign_end: campaign.endDate,
            status: "active",
            image_url: campaign.cover,
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
          pitch: message,
          message,
          content_idea: contentIdea,
          availability,
          status: "pending",
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
          .update({ brand_remarks: note })
          .eq("id", id);
        if (error) throw error;
        await refresh();
      },
      inviteCreator: async (campaignId, creatorId) => {
        const { error } = await db.from("campaign_invites").insert({
          campaign_id: campaignId,
          creator_id: creatorId,
          status: "sent",
        });
        if (error) throw error;
        await refresh();
      },
      submitDeliverable: async (collaborationId, deliverableId, submission) => {
        const collab = state.collaborations.find((c) => c.id === collaborationId);
        if (!collab) throw new Error("Collaboration not found");
        const app = state.applications.find(
          (a) => a.campaignId === collab.campaignId && a.creatorId === collab.creatorId,
        );
        if (!app) throw new Error("Application not found");
        const { error } = await db
          .from("deliverables")
          .update({
            status: "submitted",
            submission_link: submission.link || null,
            submission_note: submission.note || null,
            submitted_at: new Date().toISOString(),
          })
          .eq("id", deliverableId)
          .eq("application_id", app.id);
        if (error) throw error;
        await db.from("submissions").insert({
          collaboration_id: collaborationId,
          application_id: app.id,
          creator_id: userId,
          url: submission.link || null,
          content_url: submission.link || null,
          feedback: submission.note || null,
          status: "submitted",
        });
        await refresh();
      },
      reviewDeliverable: async (collaborationId, deliverableId, status) => {
        const collab = state.collaborations.find((c) => c.id === collaborationId);
        if (!collab) throw new Error("Collaboration not found");
        const app = state.applications.find(
          (a) => a.campaignId === collab.campaignId && a.creatorId === collab.creatorId,
        );
        if (!app) throw new Error("Application not found");
        const dbStatus =
          status === "APPROVED"
            ? "approved"
            : status === "REVISION_REQUESTED"
              ? "revision"
              : status === "SUBMITTED"
                ? "submitted"
                : "pending";
        const { error } = await db
          .from("deliverables")
          .update({ status: dbStatus })
          .eq("id", deliverableId)
          .eq("application_id", app.id);
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
