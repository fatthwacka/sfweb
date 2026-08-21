# drizzle-introspected/ — live Supabase schema snapshot (2026-08-21)

Generated with `drizzle-kit pull` against the shared Supabase project (all 72 `public` tables,
159 RLS policies, 5 views). **Reference only** — not imported by the app.

Purpose: source for merging the ~16 tables that are missing from `shared/schema.ts`
(content_clients, client_brand_profiles, client_brand_assets, social_content_history, ai_skills,
skill_evolution_log, platform_rules, generation_limits, content_types, ai_prompt_overrides,
category_heroes, visitor_sessions, visitor_daily_stats, pricing_packages, content_articles,
site_config, …) during Phase 2a of the Supabase offboarding. Sibling-app tables
(`monday_proj_*`, `wh_agency_*`, `dubailink_registrations`, `bot_army_01`) are included in the
snapshot but are NOT sfweb's — see `scripts/db/sfweb-tables.txt`.

Regenerate (isolated install, the repo's drizzle-kit/drizzle-orm pair cannot run `pull`):
```bash
mkdir -p /tmp/dk && cd /tmp/dk && npm init -y && npm i drizzle-kit@latest drizzle-orm@latest pg
npx drizzle-kit pull --dialect postgresql --url "$DATABASE_URL" --out ./out
```
