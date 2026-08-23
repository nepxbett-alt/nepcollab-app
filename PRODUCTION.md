# NepCollab — production readiness

## Live
- App: https://nepcollab.vercel.app
- Supabase project: ntnbhnazqncszasmwjyw

## Must configure (operator)
1. **Auth URLs** — Site URL + redirect `https://nepcollab.vercel.app/auth/callback`
2. **Magic-link email** — default mailer or valid SMTP; test with real inbox
3. **Storage** — run `supabase/migrations/20260817120000_storage_public_avatars.sql`
4. **Vercel env** — `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SITE_URL=https://nepcollab.vercel.app`
5. **Admin** — at least one profile `role = admin`

## Security posture
- Publishable key only in browser
- Admin mutations via RPCs + `is_admin`
- RLS on tables
- Suspended users blocked on apply/publish
- Security headers on Vercel

## Launch smoke test
- [ ] Guest: home, campaigns, creators
- [ ] Magic link login
- [ ] Onboarding creator + brand
- [ ] Apply → accept → message
- [ ] Admin `/admin` denied for non-admin
