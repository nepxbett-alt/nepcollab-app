# Deploy NepCollab (Vercel)

`DEPLOYMENT_NOT_FOUND` means the Vercel project has no active deployment
(project deleted, domain unbound, or build never published).

## Fix in 5 minutes

1. Open https://vercel.com/new
2. Import GitHub repo: `nepxbett-alt/nepcollab-app`
3. Framework: Other (Nitro/TanStack Start)
4. Root directory: `.`
5. Environment variables:

```
VITE_SUPABASE_URL=https://ntnbhnazqncszasmwjyw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your publishable key>
VITE_SUPABASE_PROJECT_ID=ntnbhnazqncszasmwjyw
VITE_SITE_URL=https://nepcollab-app.vercel.app
```

6. Deploy.
7. Project → Settings → Domains: attach `nepcollab-app.vercel.app` (or your custom domain).
8. Supabase → Authentication → URL configuration:
   - Site URL = your live URL
   - Redirect URLs include `https://YOUR-DOMAIN/auth/callback`

## CLI (optional)

```bash
npx vercel login
npx vercel --prod
```

## After deploy

- Open the production URL
- Sign in with magic link only
- Admin: `/admin` (admin role users only)
