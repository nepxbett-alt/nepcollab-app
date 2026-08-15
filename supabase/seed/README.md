# Nepal marketplace seed (staging)

Idempotent SQL seed for internal QA. Safe to re-run — only deletes/updates fixed seed UUIDs.

## How to run

1. Open https://supabase.com/dashboard/project/ntnbhnazqncszasmwjyw/sql/new
2. Paste full contents of `nepal_marketplace_seed.sql`
3. Run
4. Confirm verification counts at end of script

## Tables touched (seed UUIDs only)

- auth.users / auth.identities
- profiles, brand_profiles, creator_profiles
- campaigns, applications, collaborations
- conversations, messages, notifications
- reviews, portfolio_items, saved_campaigns

## Seed emails (not real logins for magic-link without password flow)

All use domain `@seed.nepcollab.internal`
