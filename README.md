# NepCollab

Nepal-first creator × brand collaboration marketplace (PWA).

**Model:** Brands post campaigns → Creators discover & apply → Brands select → Collaborate → Submit work → Complete.  
No payment processing on the platform.

## Stack

- TanStack Start (Vite + React 19)
- Supabase (Auth, Postgres, Storage, Realtime)
- Tailwind CSS 4 + shadcn/ui

## Existing Supabase

Project: `ntnbhnazqncszasmwjyw`  
URL: `https://ntnbhnazqncszasmwjyw.supabase.co`

## Quick start

```bash
cp .env.example .env
# paste your publishable key into .env

bun install   # or npm install
bun run dev   # or npm run dev
```

## Environment

```env
VITE_SUPABASE_URL=https://ntnbhnazqncszasmwjyw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_PROJECT_ID=ntnbhnazqncszasmwjyw
```

Never commit `.env`. Use `.env.example` only.

## Supabase setup (one-time)

1. Confirm the migration in `supabase/migrations/` has been applied.
2. **Authentication → URL Configuration**
   - Site URL: your production domain
   - Redirect URLs: production origin + local dev origins
3. Enable **Email** (magic link) provider.
4. Confirm storage buckets exist.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Local development |
| `bun run build` | Production build |
| `bun run preview` | Preview production build |

## Deploy

Connect this repo to **Netlify** or **Vercel**. Set the `VITE_*` env vars. After deploy, update Supabase Auth redirect URLs to the live domain.

## Core flows to test before public launch

1. Magic-link sign-in → choose Creator / Brand → onboarding  
2. Brand: create + publish campaign  
3. Creator: discover → apply  
4. Brand: review applicants → accept  
5. Collaboration + messaging  

## License

Private / all rights reserved unless otherwise stated.
