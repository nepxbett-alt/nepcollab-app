# NepCollab

Nepal creator × brand collaboration platform.

**Live:** https://nepcollab.vercel.app

## Stack

- TanStack Start + Vite + React
- Supabase (Auth, Postgres, RLS)
- Vercel

## Develop

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

## Environment

Set in Vercel (never commit secrets):

- `VITE_SUPABASE_URL` / `SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` (server only)
- `BRIGHTDATA_API_TOKEN` (server only)

## Roles

- **Creator** — discover campaigns, apply, deliver, social profiles
- **Brand** — post campaigns, review applicants, collaborate
- **Admin** — `/admin` operations console
