# NepCollab

Nepal brand × creator collaboration platform.

**Create. Connect. Grow.**

Brands post opportunities. Creators apply. Brands select. Both collaborate.

## Stack

- TanStack Start + Vite + React
- Supabase (Auth, Postgres, RLS)
- Vercel (Nitro `vercel` preset)

## Local

```bash
cp .env.example .env
npm ci
npm run dev
```

## Production deploy

Git pushes do **not** trigger Vercel builds (remote npm was unreliable).

Deploy with prebuilt artifacts only:

```bash
export VERCEL_TOKEN=...
./scripts/deploy-prod.sh
```

Or:

```bash
npm ci && npm run build
vercel deploy --prebuilt --prod
```

## Product rules (V1)

- Campaign-first collaboration (not Fiverr/Upwork)
- No wallet / escrow / platform payouts
- Creators are not a public directory
