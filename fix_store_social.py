#!/usr/bin/env python3
from pathlib import Path

store = Path("src/lib/store.tsx")
st = store.read_text()

if "upsertSocialAccount" in st:
    print("already has social methods")
else:
    old_iface = """  completeOnboarding: (input?: {
    name?: string;
    username?: string;
    bio?: string;
    location?: string;
    website?: string;
  }) => Promise<void>;"""
    new_iface = """  completeOnboarding: (input?: {
    name?: string;
    username?: string;
    bio?: string;
    location?: string;
    website?: string;
    niches?: string[];
    languages?: string[];
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
  }) => Promise<void>;"""
    if old_iface not in st:
        raise SystemExit("iface not found")
    st = st.replace(old_iface, new_iface, 1)
    print("iface updated")

    methods = """      upsertSocialAccount: async (input) => {
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
"""
    needle = "      uploadFile: async (bucket, path, file) => {\n        const { data, error } = await supabase.storage"
    if "upsertSocialAccount: async" not in st:
        if needle not in st:
            raise SystemExit("uploadFile needle not found")
        st = st.replace(needle, methods + needle, 1)
        print("methods added")
    else:
        print("methods already present")

path.write_text(st)
print("has upsertSocialAccount:", "upsertSocialAccount" in Path("src/lib/store.tsx").read_text())
print("has select*:", 'select("*")' in Path("src/lib/store.tsx").read_text())
PY