<!-- Copied into the repo 2026-08-21 from ~/.claude/plans/wise-wondering-dragonfly.md (the approved plan). Phases 0, 1 and 1b are DONE (see SUPABASE_OFFBOARDING.md); Phase 2a/2b are the next session's work. Keep this file as the reference plan; update status in SUPABASE_OFFBOARDING.md, not here. -->

# Supabase Offboarding Plan — sfweb (Slyfox / Netfox)

## Context

Slyfox photography is being paused; album growth no longer justifies Supabase Pro. Supabase is currently the DB (Postgres via pooler), the media store (4 public buckets) and the auth provider for sfweb **and** for several sibling apps on the same project (`dwkjfuhykdjtzvrzdnrr`): open_thwack dashboards (Google OAuth, OTP, reset), the Next.js Monday.com app (`monday_proj_*`), the client-report dashboard (`wh_agency_*` tables + `wh-agency-snapshots` bucket), dubailink registrations, bot_army. Dev and prod share the one project.

Goal: move sfweb's media to **Google Cloud Storage** (decided) and sfweb's DB to a **self-hosted Postgres on the VPS**, keep **Supabase Auth on the Free plan** for every app (decided), archive unreferenced files off-VPS, and downgrade Pro→Free as soon as media is out (decided).

## What the investigation found (measured, not from docs)

| Item | Value |
|---|---|
| Supabase Storage total | **19.9 GB / 7,065 objects** — `gallery-videos` 10.8 GB (676 obj; 460 mp4 + 216 jpg thumbs; max 980 MB), `gallery-images` 9.1 GB (6,287 obj; `shoots/` 9.14 GB, `previews/` 140 MB, `blog/` 21 MB, `heroes/` 6 MB), `preview-images` 18 MB, `brand-assets` 2 MB, `wh-agency-snapshots` 3 MB (not ours) |
| Referenced by `images`/`videos` rows | 7.2 GB images (1,678 obj) + 8.4 GB videos (573 obj) ≈ **15.5 GB**. ≈4.3 GB / 4,700 obj unreferenced by those two tables (some are referenced by blog/heroes/previews/site-config — the inventory script computes the true set) |
| Database | **37 MB** total; sfweb tables tiny (largest `leads` 1.2 MB). 159 RLS policies, `auth.uid()` used by ~9 SQL files + functions `get_user_role/is_admin_or_staff/is_super_admin/check_tool_access/handle_new_user`; trigger `on_auth_user_created` on `auth.users`; one RPC `check_title_similarity` (pg_trgm); extensions pg_trgm, pgcrypto, uuid-ossp. No realtime, edge functions or pg_cron |
| Auth | 68 users (65 email, 5 Google — Google logins come from the sibling apps), 13 active in 90 days; `profiles.role` = super_admin 3 / staff 5 / client 37 / user 25 |
| Code | ~250 supabase-js `.from()` call sites (client 74 in `client/src/lib/supabase-operations.ts` + `stories.tsx`/`story.tsx`/`article-editor-supabase.tsx`; server 179 across `server/routes.ts` (45, with 20 inline `createClient`), `routes/social-content.ts` 37, `routes/content-management/brand-intelligence.ts` 25, content-studio/*, gradients/category-heroes/ai-prompt-overrides/youtube/content-types, `pricing-packages-api.ts`, services/*). 71 `supabase.storage` sites, all **server-side** (no browser→Supabase uploads, no signed URLs, all buckets public). ~105 Drizzle calls in `server/supabase-storage.ts` already DB-agnostic. ~16 live tables have no Drizzle definition. `server/db.ts` = drizzle + postgres-js on `DATABASE_URL` |
| Auth code | Browser: `client/src/hooks/use-auth.tsx` (getSession/onAuthStateChange/signInWithPassword/signUp/signOut) + role via `GET /api/user/profile/:userId`. Server: **no JWT verification anywhere** (`server/routes.ts:6003-6010` accepts any Bearer); `server/supabase-auth.ts` uses `auth.admin.createUser/listUsers`. Email+password only in this repo |
| Media URLs | Stored **absolute**: `https://dwkjfuhykdjtzvrzdnrr.supabase.co/storage/v1/object/public/<bucket>/<key>` in `images.storage_path`, `videos.{storage_path,optimized_path,thumbnail_path}`, `preview_images.supabase_url`, `blog_posts.{cover_image,post_image_1,post_image_2,featured_section}`, `category_heroes.image_url`, `client_brand_assets.{image_url,thumbnail_url}`, `client_brand_profiles.logo_url`, `profiles.*_image_url`, plus `server/data/site-config-overrides.json` (2) and hardcoded `client/src/pages/videography-category.tsx:431`. Variants `_optimized/_thumbnail` derived by suffix in `client/src/lib/image-utils.ts` (guard at line 32 requires `supabase` in URL). 4 sites still use Supabase `/render/image/` transforms (`server/routes.ts:460,474,1092,1318`) — a **Pro feature that dies on downgrade** |
| GCS already in place | `@google-cloud/storage ^7.18` + `google-auth-library` installed; service account `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_PROJECT_ID` (slyfox-media-engine); bucket `netfox-veo-generations` used by Veo/Imagen + `/api/cloud-storage/*` (`server/routes.ts:7131-7150` shows the `new Storage({credentials})` pattern; objects made public per-object via `makePublic()`/ACL, `cacheControl: 'public, max-age=31536000'`) |
| VPS (live, docs are stale) | 168.231.86.89, **96 GB disk / 34 GB used / 62 GB free**, 7.8 GB RAM (2.2 used), 2 vCPU, no swap. Containers: sfweb-app, traefik, n8n, ot_postgres(pg15)/redis/vault (open_thwack), 2 nginx sites. Unused volume `sfweb_postgres_data` (47 MB). Reclaimable: 2.5 GB docker images, ~1.3 GB `/opt/*.tar.gz` |
| Supabase Free plan | 500 MB DB, 1 GB storage, 5 GB egress, 50k MAU, unlimited users, OAuth + custom SMTP included, 2 active projects/org, **paused after 1 week of inactivity**, no managed backups |

**Answer to the auth question:** yes — once the ~20 GB of sfweb media is gone, the entire project (37 MB DB, <10 MB of other buckets, 68 users, all sibling apps) fits the Free plan. Nothing breaks for the other apps. Two conditions: (1) a weekly keepalive so the project is never idle 7 days, (2) we take over backups ourselves. Self-hosting auth is **not** required; it is documented as a future option only.

## Target architecture

```
Browser ──(Supabase Auth JWT, Free plan)──► sfweb Express API ──► Postgres container (VPS)
                                                 │
                                                 └──► GCS bucket sfweb-media (public, Standard)   ← all gallery images, videos, previews, brand assets
                                                      GCS bucket sfweb-media-archive (Archive)    ← unreferenced/orphan files, cold
Other apps (open_thwack, Monday, wh_agency, dubailink) ──► Supabase Free (auth + their own tables) — untouched
```

- Media URLs become `https://storage.googleapis.com/sfweb-media/<supabase-bucket>/<key>` — same tail as today so the `_optimized/_thumbnail` suffix logic keeps working. (Custom domain `media.slyfox.co.za` via Cloudflare is optional later; the rewrite tool is re-runnable.)
- VPS disk is used only transiently (ffmpeg/sharp temp) + Postgres (<1 GB) + DB dumps. Post-migration free space ≈ **64 GB** (after reclaiming stale images/tarballs).
- Server is the only DB client (one Postgres role) → RLS and `auth.uid()` policies are dropped; authorization moves to Express middleware.

## Phases

### Phase 0 — Prep (≈1 day)
1. Full `pg_dump -Fc` of the Supabase `public` schema now (run via `docker run postgres:17-alpine` since no local psql; use the **session pooler :5432** URL). Store in `/opt/sfweb-backups/db/` on the VPS + Dropbox.
2. GCS: create buckets `sfweb-media` (Standard, region `africa-south1` or `us-central1`, **uniform bucket-level access**, `allUsers: roles/storage.objectViewer`, CORS `GET/HEAD *`, soft-delete 7d) and `sfweb-media-archive` (Archive class, private). Grant the existing service account `roles/storage.objectAdmin` on both. Create via console or a one-off `scripts/gcs/create-buckets.ts` using the existing credentials pattern.
3. `npx drizzle-kit pull` against Supabase → merge the ~16 missing tables into `shared/schema.ts` (drop the `profiles→auth.users` FK).
4. Env hygiene: add `GCS_MEDIA_BUCKET=sfweb-media`, `GCS_ARCHIVE_BUCKET`, `MEDIA_PUBLIC_BASE=https://storage.googleapis.com/sfweb-media`, `SUPABASE_JWT_SECRET`, `DATABASE_SSL`; normalise the drifted names (`SUPABASE_URL`→`VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`→`SUPABASE_SECRET_KEY`, `*_ANON_KEY`→`*_PUBLISHABLE_KEY`); add every new var to both compose files (VITE vars are build-baked). Fix `.env.example`.
5. Build `scripts/supabase-audit.ts` (see Tooling) and commit its first report as the migration checklist.
6. VPS housekeeping: `docker image prune`, remove `/opt/sfweb-backup-*.tar.gz` after copying to Dropbox; back up `/root/docker-compose.yml` (Traefik, lives outside the repo).

### Phase 1 — Media → GCS (≈3–4 days) — independent of the DB move
Code (deploy first, so new uploads already land in GCS):
- New `server/media/media-store.ts` (single backend = GCS via `@google-cloud/storage`, one shared `Storage` instance, credentials from the existing env pattern): `put(bucketPrefix, key, bufferOrPath, {contentType})` (resumable for large files, `cacheControl: public, max-age=31536000, immutable`), `remove(keys[])`, `list(prefix)`, `publicUrl(key)`, `parseMediaUrl(url) → {bucket,key}|null` accepting **both** legacy Supabase URLs and the new GCS URLs (so deletes/ZIP work for rows not yet rewritten), `download(key) → stream`.
- Replace every `supabase.storage` site with it: `server/routes.ts` image upload (~1962), preview batch-upload (~2225), video upload (~2564), `/api/upload` (~3504), category-hero (~3624), blog image list (~3571), replace-on-upload deletes (2114/2271/2839), ZIP download (~585, stream from GCS, drop the 65-file cap), `server/supabase-storage.ts` deleteImage/deleteVideo (437-533, 694-795), `server/routes/content-management/brand-intelligence.ts:645-736`, `server/services/image-migration-service.ts`; delete the test/bucket-inspection endpoints (~5083-5291).
- Video: switch multer to `diskStorage` in `os.tmpdir()`/`/app/tmp` (kills the 1.5 GB RAM buffer), make `server/video-processing.ts` path-based, upload the 3 outputs to GCS, clean temp. Keep `upload.slyfox.co.za`, Traefik readTimeout and `server.requestTimeout` unchanged.
- The 4 `/render/image/` transform sites → use the existing `_thumbnail` (300×300 case) / `_optimized` (600×400 card case) variants. No new infra.
- `client/src/lib/image-utils.ts:32` guard → `isManagedMediaUrl()` accepting `/storage/v1/object/public/` **or** `storage.googleapis.com/<GCS_MEDIA_BUCKET>/`; fix `videography-category.tsx:431` and the 2 URLs in the `site-config-overrides.json` on the `config_data` volume.
- `image-migration-service.ts` / `scripts/migrate-images-to-preprocessed.ts`: repoint or retire.

Data (scripts in `scripts/migrate-storage/`, run on the VPS inside `docker run node:22-alpine` with the prod `.env`, or locally — network path is Supabase→GCS streaming, VPS disk untouched):
1. `00-inventory.ts` — reads `storage.objects` (bucket, name, size, eTag) over `DATABASE_URL`; builds the **reference set** by regex-scanning every text/jsonb column of the sfweb tables + `site-config-overrides.json` for the Supabase host (also expands `_optimized/_thumbnail` siblings of each image). Writes `manifest.json` with `referenced: true|false` per object and a summary; `--scope referenced|all`.
2. `01-copy.ts` — streams each object `fetch(publicUrl)` → `bucket.file(key).createWriteStream({resumable:true, metadata:{contentType, cacheControl}})`; referenced → `sfweb-media`, unreferenced → `sfweb-media-archive`; concurrency 8–16, retry ×5, verify size (and md5 vs eTag where single-part), idempotent (skip if exists with same size), `--dry-run`, resumable via manifest status, `failed.json`. Expect ~30–60 min for 20 GB. Alternative if it misbehaves: Google **Storage Transfer Service "URL list"** job (TSV of public URLs + sizes).
3. `02-rewrite-sql.ts` — emits and applies `rewrite.sql` + `rollback.sql` in one transaction: backup old values into `_media_url_backup(tbl, pk, col, old, new, at)`, then `regexp_replace(col, '^https://dwkjfuhykdjtzvrzdnrr\.supabase\.co/storage/v1/(object|render/image)/public/', 'https://storage.googleapis.com/sfweb-media/')` for every URL column listed above (jsonb via `::text` round-trip); plus a JSON rewrite of `site-config-overrides.json` (with `.bak`). Applied with the `postgres` package (no psql needed).
4. `03-verify.ts` — HTTP HEAD every rewritten URL (concurrency 32), compare Content-Length to manifest; non-zero exit blocks cut-over. Also `grep`-style SQL check that no sfweb column still contains `supabase.co/storage`.

Cut-over: deploy code → run copy → final delta copy → rewrite SQL → verify → smoke test. Rollback: `rollback.sql` + redeploy previous image tag; Supabase objects untouched.

### Phase 1b — Downgrade Supabase (after a 2–4 week hold)
Empty the four sfweb buckets (keep `wh-agency-snapshots`), confirm dashboard storage < 1 GB and DB < 500 MB, confirm org has ≤ 2 active projects, set up the **keepalive** (n8n on the VPS: daily `GET https://dwkjfuhykdjtzvrzdnrr.supabase.co/rest/v1/?apikey=<publishable>`), start a nightly `pg_dump` of the Supabase DB from the VPS (`scripts/ops/backup-db.sh` + cron, copies to Dropbox/GCS archive bucket), then downgrade Pro→Free. Interim risk accepted: Free DB is shared-CPU with 5 GB/mo egress — Phase 2 follows within weeks.

### Phase 2a — Code: API layer + auth middleware + Drizzle everywhere (≈5–8 days, still on Supabase DB)
- `server/middleware/auth.ts` (add `jose`): verify Supabase JWT via JWKS (`/auth/v1/.well-known/jwks.json`) with HS256 `SUPABASE_JWT_SECRET` fallback; check `iss`/`aud=authenticated`; `req.user={id,email}`; role from local `profiles` (60 s cache); `ensureProfile()` lazily upserts the profile row (replaces the `on_auth_user_created` trigger); export `requireAuth`, `requireRole(...)`, `optionalAuth`. Apply to all mutating/admin routes (today they are open). Keep `supabaseAdmin.auth.admin.*` in `server/supabase-auth.ts`; `use-auth.tsx` `register` → existing `POST /api/auth/register` then `signInWithPassword`.
- `client/src/lib/api.ts` `apiFetch` adding `Authorization: Bearer <session.access_token>`; patch `client/src/lib/queryClient.ts` `apiRequest/getQueryFn` likewise.
- **Keep `supabase-operations.ts` public signatures**, reimplement internals over `/api/*` so the 19 importers don't change. ~85 % of endpoints already exist (`/api/clients*`, `/api/shoots*`, `/api/images*`, `/api/videos*`, `/api/profiles`, `/api/user/profile/:id`, `/api/staff*`, blog router, `/api/client-selections*`, `/api/selections/*`, preview-settings, `/api/preview-images/*`, `/api/portfolio/groups`, site-config API). New (~10): `GET /api/images?ids=`, bulk `DELETE /api/images`, `GET /api/videos?shootId(s)=`, `PATCH /api/videos/bulk-classification|bulk-assignment`, `GET /api/profiles/by-email/:email`, generalised `PATCH /api/profiles/:id`, `GET /api/blog/posts/slug/:slug`, `GET /api/blog/posts?q=`, `DELETE /api/blog/categories/:id`, `GET /api/tools/articles/:id`; selections-by-email variants derive the client from `req.user`. Port `stories.tsx`, `story.tsx`, `article-editor-supabase.tsx` (remove its private client).
- Server: convert the 179 supabase-js table calls to Drizzle file-by-file (`routes.ts` incl. purging the 20 inline `createClient`; `social-content.ts`; `brand-intelligence.ts`; content-studio/*; gradients/category-heroes/ai-prompt-overrides/youtube/content-types; `pricing-packages-api.ts`; services/*; `static-generator.ts`); `rpc('check_title_similarity')` → `sql\`similarity()\``. After this, `@supabase/supabase-js` remains only in `server/supabase-auth.ts` (admin API) and `client/src/lib/supabase.ts` (auth session).
- Run `scripts/supabase-audit.ts` until the only remaining hits are auth.

### Phase 2b — DB → VPS Postgres (≈1–2 days)
- `docker-compose.prod.yml` (+ dev `docker-compose.yml`, already has a vestigial `postgres:15-alpine` — bump): service `postgres: postgres:17-alpine`, `container_name: sfweb-postgres`, volume `sfweb_postgres_data`, internal network only, `shm_size 256m`, `-c shared_buffers=512MB -c effective_cache_size=2GB -c max_connections=50`, memory limit 1 GB, healthcheck; app `depends_on: service_healthy`.
- `scripts/db/prep-vps-db.sql`: extensions (pg_trgm, pgcrypto, uuid-ossp), stub `auth.uid()/auth.role()/auth.jwt()` returning NULL so the dump restores cleanly.
- `scripts/db/dump-supabase.sh` (allowlist `scripts/db/sfweb-tables.txt`, `--schema=public -Fc --no-owner --no-privileges`, session pooler) and `restore-vps.sh` (`pg_restore -l` → drop `profiles_id_fkey`/any `auth.users` FK and all `POLICY` entries → restore → `DISABLE ROW LEVEL SECURITY` everywhere → `ANALYZE`). Rehearse into the VPS container while the app is still on Supabase.
- `server/db.ts`: `ssl` from `DATABASE_SSL` (keep `DOCKER_ENV` fallback), drop `prepare:false` (pooler-only requirement), `max:10`.
- Backups before cut-over: nightly `pg_dump -Fc` → `/opt/sfweb-backups/db/` (keep 14) + `rclone`/`gcloud storage cp` to `sfweb-media-archive/db/`; weekly restore test.
- Cut-over (~15 min, low-traffic): write-freeze → final dump → restore → swap `DATABASE_URL` → `compose up -d` → parity `count(*)` per table → smoke. Rollback = swap `DATABASE_URL` back. Keep Supabase sfweb tables 2–4 weeks, then drop **only** sfweb tables (verify sibling apps don't read `public.profiles` first).
- Dev: `npm run db:seed-from-prod` restores the latest dump into the dev container; dev uses the same GCS bucket (optional `MEDIA_KEY_PREFIX=dev/`); delete `@neondatabase/serverless`, `server/pg-storage.ts`, `server/auth.ts`, `scripts/seed-supabase.sql` once unused.

### Phase 3 — Self-hosted auth (NOT now; documented trigger only)
Needed only if: the Free project gets paused/deleted unnoticed, MAU > 50k, or Supabase breaks JWT verification for legacy secrets. Path: Better Auth / passport-local (already in deps) with bcrypt import of `auth.users.encrypted_password` (`$2a$` hashes export fine via the service role), users keep passwords; sibling apps stay on Supabase.

## Tooling to build (all under `scripts/`)
- `supabase-audit.ts` (ts-morph dev-dep): inventories every `createClient`, `.from('t')`, `.storage.from('b')`, `.auth.*`, `.rpc(` in `server/**` + `client/src/**` → `SUPABASE_AUDIT.md` + CSV (file:line, kind, table/bucket, chain, simple|complex, status). `--fix` auto-rewrites only the mechanical classes: Supabase storage URL literals, env-var names, inline `createClient` removal in `routes.ts`. `--codemod-drizzle` rewrites *simple* chains (select/eq/order/limit/single/insert/update/delete) to Drizzle and marks the rest `// TODO(supabase-migration)`. Honest expectation: mechanical classes ≈100 %, ~50–60 % of the 179 server table calls codemod-able (still type-checked + eyeballed), embedded selects/`or`/`in`/count/upsert/rpc manual; client internals faster to hand-write (~1 day). Net ≈45 % automated, ~130 manual sites ≈3 days.
- `migrate-storage/00-inventory.ts`, `01-copy.ts`, `02-rewrite-sql.ts`, `03-verify.ts` (above).
- `gcs/create-buckets.ts`, `db/dump-supabase.sh`, `db/restore-vps.sh`, `db/prep-vps-db.sql`, `ops/backup-db.sh`, `ops/supabase-keepalive` (n8n workflow or cron curl).

## Capacity & cost
- VPS after migration: ≈34 GB used − 3.8 GB reclaimed + <1.5 GB (Postgres + dumps) → **≈64 GB free**; media never lands on disk except transient ffmpeg/sharp temp (budget 3 GB headroom for the largest wedding upload). No need for R2/extra disk.
- GCS: ~16 GB Standard ≈ $0.35–0.45/mo + archive 4 GB ≈ $0.01/mo + egress $0.12/GB (likely < $3/mo at current traffic; Cloudflare-fronted custom domain can cut it later). Supabase: Pro (~$25+/mo) → $0.
- Order matters: copy the 20 GB **before** downgrading (Free egress is 5 GB).

## Verification
- Phase 1: `curl -I https://storage.googleapis.com/sfweb-media/gallery-images/shoots/<id>/<file>.jpg` → 200 + immutable cache; `curl -r 0-1023 …-optimized.mp4` → 206; `03-verify.ts` 0 failures; SQL shows 0 `supabase.co/storage` refs; browse home/portfolio groups (cover transforms), `/gallery/:slug`, client gallery + selections + ZIP download, blog list/post, category heroes, brand assets, admin image upload (3 variants appear in GCS), video upload via `upload.slyfox.co.za` (container RAM flat), delete image/video removes objects; Supabase dashboard egress flat for a week before emptying buckets.
- Phase 2a: login/logout/register; role gating via curl (client token on staff endpoint → 403, no token → 401); every admin page shows only `/api/*` calls (no `rest/v1`); content studio, social content, pipeline run, brand intelligence, pricing packages, gradients, visitor stats, tools usage; `npm run check` clean; audit report = auth-only hits.
- Phase 2b: per-table `count(*)` parity; same smoke list; backup cron ran and a restore test passed; `docker stats` for Postgres memory; dev `db:seed-from-prod` works.

## Risks / open items
- `client/src/lib/supabase.ts` throws at import if `VITE_SUPABASE_*` vanish — those vars stay (auth), so no change; still rebuild with `--no-cache` for any VITE change.
- Sibling apps may read `public.profiles`/`handle_new_user` — confirm before dropping sfweb tables from Supabase (Phase 2b tail). Client-report dashboard (`wh_agency_*`) code was not found locally; its data stays on Supabase regardless.
- Supabase JWT signing: check Dashboard → JWT keys (ECC JWKS vs legacy HS256) before writing the middleware.
- Traefik config + readTimeout live in `/root/docker-compose.yml` on the VPS — back up before any compose work.
- Effort: Phase 0 ≈1 d, Phase 1 ≈3–4 d, Phase 2a ≈5–8 d, Phase 2b ≈1–2 d → ≈2.5–3 weeks focused. Phase 1 alone unlocks the downgrade.
