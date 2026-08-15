# NepCollab

Nepal-first creator × brand collaboration marketplace (PWA).

**Model:** Brands post campaigns → Creators discover & apply → Brands select → Collaborate → Submit work → Complete.  
No payment processing on the platform.

**Repo:** https://github.com/nepxbett-alt/nepcollab-app  

See **[LAUNCH.md](./LAUNCH.md)** for the full production checklist.

## Stack

- TanStack Start (Vite + React 19)
- Supabase Auth / Postgres / Storage / Realtime
- Tailwind CSS 4 + shadcn/ui

## Supabase

Project: `ntnbhnazqncszasmwjyw`  
URL: `https://ntnbhnazqncszasmwjyw.supabase.co`

## Quick start

```bash
cp .env.example .env
# set VITE_SUPABASE_PUBLISHABLE_KEY in .env

npm install
npm run dev
```

## Environment

```env
VITE_SUPABASE_URL=https://ntnbhnazqncszasmwjyw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_PROJECT_ID=ntnbhnazqncszasmwjyw
```

Never commit `.env`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Deploy

Import on **Vercel** or **Netlify**, set the `VITE_*` env vars, deploy, then update Supabase Auth redirect URLs. Details in [LAUNCH.md](./LAUNCH.md).
