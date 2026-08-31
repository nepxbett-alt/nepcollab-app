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

Remote `npm install` on Vercel builders can hang. Preferred path:

```bash
export VERCEL_TOKEN=...
./scripts/deploy-prod.sh
```

Or:

```bash
npm ci && npm run build
vercel deploy --prebuilt --prod
```

Git pushes still build with:

- Node `22.x`
- `npm ci --no-audit --no-fund --maxsockets=3`

## Product rules (V1)

- Campaign-first collaboration (not Fiverr/Upwork)
- No wallet / escrow / platform payouts
- Creators are not a public directory
