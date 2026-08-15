# NepCollab Launch Checklist

## Repo
https://github.com/nepxbett-alt/nepcollab-app

## Supabase (existing project)

Project ref: `ntnbhnazqncszasmwjyw`  
Dashboard: https://supabase.com/dashboard/project/ntnbhnazqncszasmwjyw

### 1. Schema
Migration file is in `supabase/migrations/`.  
If tables already exist (profiles OK), skip.  
Otherwise: SQL Editor → paste full migration → Run.

### 2. Auth
Authentication → Providers → **Email** → Enable (magic link / OTP).

Authentication → URL Configuration:
- **Site URL**: your production URL (e.g. `https://nepcollab-app.vercel.app`)
- **Redirect URLs** (add all):
  - `https://YOUR-PRODUCTION-DOMAIN/**`
  - `http://localhost:5173/**`
  - `http://localhost:3000/**`

### 3. Storage buckets
Create if missing (Storage → New bucket):
| Bucket | Public |
|--------|--------|
| avatars | yes |
| campaign-assets | yes |
| submissions | no (private) |

### 4. Env vars (Netlify / Vercel)
```
VITE_SUPABASE_URL=https://ntnbhnazqncszasmwjyw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_uV9hlMwM-4s9eS4CQAJhkA_J1fZG3Cs
VITE_SUPABASE_PROJECT_ID=ntnbhnazqncszasmwjyw
```

Also set without `VITE_` prefix if needed for SSR:
```
SUPABASE_URL=https://ntnbhnazqncszasmwjyw.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_uV9hlMwM-4s9eS4CQAJhkA_J1fZG3Cs
SUPABASE_PROJECT_ID=ntnbhnazqncszasmwjyw
```

## Deploy

### Vercel (recommended)
1. vercel.com → New Project → import `nepxbett-alt/nepcollab-app`
2. Framework: Other
3. Add env vars above
4. Deploy
5. Copy production URL → Supabase Site URL + Redirect URLs

### Netlify
1. New site from Git → `nepcollab-app`
2. Build: `npm run build`
3. Publish: `.output/public`
4. Add env vars
5. Update Supabase URLs

## Smoke test
1. Open production URL
2. Auth → magic link → dashboard
3. Onboard as Brand → create + publish campaign
4. New session as Creator → apply
5. Brand accepts application

## Local dev
```bash
cp .env.example .env
# put publishable key in .env
npm install
npm run dev
```

## Critical notes (post-polish)

- App data layer is aligned with the **live** production schema (`user_id`, `full_name`, `business_name`, `spots`, `deadline`, `campaign_start`/`campaign_end`, `image_url`, application status `pending`/`accepted`, campaign status `active`/`draft`).
- Storage buckets must exist before avatar/campaign uploads work.
- After first deploy, magic-link emails only work if the production URL is in Supabase Redirect URLs.
- Run `supabase/migrations/20260815180000_align_handle_new_user.sql` in the SQL Editor so new auth users get `profiles.full_name` (not legacy `display_name`) and optional role from metadata.
- Run `supabase/migrations/20260815160000_harden_accept_application.sql` if not already applied — brands must accept applicants via the secure RPC.

## Admin console

1. Run SQL migration `supabase/migrations/20260815120000_admin_console.sql` in Supabase SQL Editor.
2. Bootstrap first admin (your user id from Authentication → Users):

```sql
SELECT public.bootstrap_first_admin('YOUR_USER_UUID'::uuid);
```

3. Sign in → open `/admin`.

Admin can: view platform stats, manage users (verify / role), moderate campaigns,
applications & collaborations, resolve reports, edit platform settings, audit log.
