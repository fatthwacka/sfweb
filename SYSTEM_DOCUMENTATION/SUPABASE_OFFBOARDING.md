# Supabase Offboarding — status, architecture and runbook

**Started:** 2026-08-21 · **Plan:** `~/.claude/plans/wise-wondering-dragonfly.md` (approved) · **Owner:** Dax

## Why
Slyfox photography is paused; ~20 GB of gallery media was the only thing keeping the shared Supabase
project (`dwkjfuhykdjtzvrzdnrr`) on the Pro plan. Decision: move sfweb **media → Google Cloud Storage**,
sfweb **DB → self-hosted Postgres on the VPS** (Phase 2), keep **Supabase Auth on the Free plan** for
sfweb *and* the sibling apps that share the project (open_thwack dashboards, Monday.com app
`monday_proj_*`, client-report dashboard `wh_agency_*`, dubailink). Self-hosted auth is NOT planned.

## Measured baseline (2026-08-21)
| | |
|---|---|
| Supabase Storage | 19.9 GB / 7,054 objects — `gallery-videos` 10.8 GB, `gallery-images` 9.1 GB, `preview-images` 18 MB, `brand-assets` 2 MB |
| Referenced by DB / site-config | 16.4 GB / 5,869 objects → **media bucket**; 3.5 GB / 1,185 unreferenced → **archive bucket** |
| Database | 37 MB, 72 tables (53 are sfweb's — `scripts/db/sfweb-tables.txt`) |
| Auth | 68 users (13 active / 90 d) |
| VPS | 96 GB disk / 62 GB free, 7.8 GB RAM, 2 vCPU (docs quoting 48 GB / 3.8 GB are stale) |

## Phase status
| Phase | Status | Notes |
|---|---|---|
| 0 Prep | ✅ done | pg_dump baseline on VPS `/opt/sfweb-backups/db/supabase-public-20260821-1246.dump` (+`.schema.sql`); `drizzle-introspected/` snapshot; GCS buckets created; audit + migration tooling written |
| 1 Media → GCS | ✅ **cut over 2026-08-21 13:40 SAST** | 7,054 objects copied (0 failed); `rewrite.sql` applied (2,528 values backed up in `public._media_url_backup`); config JSON rewritten; deployed bundle `index-GZLzNBjn.js`; rollback image `sfweb-app:rollback-20260821-134003`; `03-verify` → VERIFY OK (5,869 HEAD 200, 0 Supabase URLs left); smoke: portfolio covers, 40×3 image variants, video Range 206, ZIP download, blog image list all green. **Supabase buckets left untouched (read-only hold) until Phase 1b.** |
| 1b Downgrade Supabase Pro→Free | ✅ **done 2026-08-21** — project is on the Free plan | Reconcile OK, artefacts archived to `gs://sfweb-media-archive/_migration/2026-08-21/`, VPS cron (keepalive + nightly pg_dump) installed, four sfweb buckets emptied (DB 39 MB, storage 2.8 MB, 68 users). Downgrade was initially blocked by the **per-user Free project limit** (2 active Free projects per user across all orgs where they are owner/admin — not per organisation); resolved by deleting an unused Netfox Free project (chat-history). |
| 2a API layer + JWT middleware + Drizzle | ⏳ | still on Supabase DB; see plan |
| 2b DB → VPS Postgres | ⏳ | |

## New architecture (Phase 1)
```
Browser ──► Express API ──► Supabase (tables + auth, until Phase 2)
                 │
                 └──► GCS bucket sfweb-media  (public-read, Standard, africa-south1)
                      keys keep the old Supabase layout: <supabase-bucket>/<key>
                      e.g. gallery-images/shoots/<shootId>/<ts>_<rand>.jpg  (+ _optimized/_thumbnail)
                           gallery-videos/<shootId>/<ts>-<name>.mp4 (+ -optimized.mp4, -thumbnail.jpg)
                      public URL: https://storage.googleapis.com/sfweb-media/<bucket>/<key>
      GCS bucket sfweb-media-archive (Archive class, private): unreferenced/orphan objects
```
- **`server/media/media-store.ts`** — the only module that talks to object storage (`put`, `remove`,
  `removeUrls`, `list`, `getMetadata`, `download`, `publicUrl`, `parseMediaUrl`, `imageVariantKeys`,
  `imageVariantUrl`). `parseMediaUrl()` accepts new GCS URLs **and** legacy Supabase URLs, so
  deletes/ZIP/metadata work for rows that have not been rewritten.
- **`server/media/supabase-compat.ts`** — transitional `createHybridClient()`: `.from()/.auth/.rpc` go
  to the real supabase-js service-role client, `.storage` is redirected to media-store with the same
  `{ data, error }` shapes. Used by `server/routes.ts` (19 former inline `createClient` sites). Delete
  it in Phase 2a when the table queries move to Drizzle.
- Uploads: images (`POST /api/images/upload`, `/api/upload`, `/api/upload/category-hero`,
  `/api/images/batch-upload`), videos (`POST /api/videos/upload` — now **multer diskStorage** in
  `os.tmpdir()`, `processVideo({ inputPath })`, no more 1.5 GB RAM buffer; temp files removed on
  response close), brand assets (`brand-intelligence.ts`), preview re-processing
  (`image-migration-service.ts`).
- Deletes: `supabase-storage.ts` `deleteImage`/`deleteVideo` → `mediaStore.remove`/`removeUrls`.
- The 4 Supabase `/render/image/` transform sites (portfolio covers) now use the stored
  `_optimized` / `_thumbnail` variants via `imageVariantUrl()` — no on-the-fly resizing (Pro feature).
- Client: `client/src/lib/image-utils.ts` `isManagedMediaUrl()` (uses `VITE_MEDIA_BASE_URL`, default
  the sfweb-media bucket) gates the variant-suffix logic; `videography-category.tsx` hard-coded URL fixed.
- Env (all have defaults; wired in both compose files + Dockerfile ARG/ENV):
  `GCS_MEDIA_BUCKET=sfweb-media`, `GCS_ARCHIVE_BUCKET=sfweb-media-archive`,
  `MEDIA_PUBLIC_BASE=https://storage.googleapis.com/sfweb-media`, `VITE_MEDIA_BASE_URL=<same>`.
  Credentials = existing `GOOGLE_PROJECT_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`.
- Unchanged: `upload.slyfox.co.za` grey-cloud route + Traefik `readTimeout` + `server.requestTimeout`
  (large uploads still hit our origin first), GCS `netfox-veo-generations` (AI tools), ImgBB, YouTube.

## Tooling (`node scripts/…` — Node ≥ 22.18 strips types; on the Mac `tsx` fails because
`node_modules/esbuild` is Linux-built, so use `node` directly or the VPS runner below)
| Script | Purpose |
|---|---|
| `scripts/supabase-audit.ts` | Inventory of every supabase-js call site → `SUPABASE_AUDIT.md` + CSV. Re-run until only `auth` rows remain |
| `scripts/gcs/create-buckets.ts` | Create/verify the two buckets (IAM public read, CORS, write probe) |
| `scripts/migrate-storage/00-inventory.ts` | `storage.objects` + reference scan of all text/jsonb columns in sfweb tables + site-config JSON → `out/manifest.json`, `out/url-columns.json`, `out/referenced-missing.json` |
| `scripts/migrate-storage/01-copy.ts` | Stream Supabase → GCS (referenced → media, rest → archive), resumable, size-verified, `--dry-run/--only/--limit/--retry-failed` |
| `scripts/migrate-storage/02-rewrite-sql.ts` | Generates `out/rewrite.sql` + `out/rollback.sql`; `--apply` runs it in one transaction after backing every old value up to `public._media_url_backup`; `--json <path>` rewrites `site-config-overrides.json` (backup alongside) |
| `scripts/migrate-storage/03-verify.ts` | HEAD every media URL + confirm no `supabase.co/storage` URLs remain. Cut-over gate |
| `scripts/migrate-storage/04-reconcile.ts` | Every Supabase object present in GCS (media or archive) with matching size — gate before emptying buckets |
| `scripts/migrate-storage/05-empty-supabase-buckets.ts --yes` | Empties the 4 sfweb buckets via the Storage API (never touches other buckets) |
| `scripts/ops/*` | `supabase-keepalive.sh`, `backup-supabase-db.sh`, `gcs-upload.ts`, `install-cron.sh` (VPS cron) |

**VPS runner** (the app container's stale node_modules break GCS auth — use a fresh image):
```bash
# deps live in /opt/sfweb-migration/node_modules (npm i @google-cloud/storage postgres dotenv)
docker run --rm -e NODE_OPTIONS=--dns-result-order=ipv4first \
  -v /opt/sfweb-migration/node_modules:/app/node_modules -v /opt/sfweb/scripts:/app/scripts \
  -v /opt/sfweb/.env:/app/.env:ro -v sfweb_config_data:/config -w /app node:22-alpine \
  node scripts/migrate-storage/<script>.ts [flags]
# bulk copy ran detached as container `sfweb-migrate` (docker logs -f sfweb-migrate)
```
⚠️ `deploy-production.sh` does `rm -rf /opt/sfweb/*` — copy `scripts/migrate-storage/out/` back to
the repo (scp) before deploying so the manifest is not lost.

## Phase 1 cut-over runbook (executed 2026-08-21 — kept for reference / re-runs)
1. Copy finishes (`docker logs sfweb-migrate` → "All objects copied"); `scp` the VPS
   `scripts/migrate-storage/out/manifest.json` back into the repo.
2. Deploy code per `VPS_DEPLOYMENT.md` (tag rollback image first; `rsync` → `build` → `down` →
   rewrite JSON in the config volume → `up -d` → chmod fix → verify → Cloudflare purge).
3. Delta copy (`01-copy.ts`, picks up objects uploaded since) then `02-rewrite-sql.ts --apply --json /config/site-config-overrides.json`
   (app must be restarted after the JSON rewrite, or rewrite while it is down — the config is cached in memory).
4. `03-verify.ts` must print `VERIFY OK`. Smoke: home/portfolio covers, `/gallery/:slug`, client gallery
   + ZIP download, blog images, category heroes, brand assets, admin image upload (3 variants appear in
   GCS), video upload via upload.slyfox.co.za, delete image/video removes objects.
5. Rollback: `out/rollback.sql` (restores from `_media_url_backup`) + `docker tag sfweb-app:rollback-<ts>` redeploy.
   Supabase objects are untouched until Phase 1b.

## Phase 1b checklist (downgrade) — status 2026-08-21: all automated items done, only the dashboard downgrade is left
- [x] (waived — non-critical clients) verification green on cut-over day; `04-reconcile.ts` OK
- [x] Keepalive: VPS root cron daily 06:10 `scripts/ops/supabase-keepalive.sh` (REST + auth health; log `/var/log/sfweb/supabase-keepalive.log`)
- [x] Nightly `pg_dump` 02:30 `scripts/ops/backup-supabase-db.sh` → `/opt/sfweb-backups/db/` (14-day retention) + `gs://sfweb-media-archive/db/` (log `/var/log/sfweb/backup-supabase-db.log`)
- [ ] Org has ≤ 2 active projects
- [x] Four sfweb buckets emptied 2026-08-21 (`05-empty-supabase-buckets.ts --yes`); storage 2.8 MB, DB 39 MB
- [x] Dashboard → Billing → Pro → Free done 2026-08-21 (after deleting an unused Netfox Free project to free a per-user slot). Watch `/var/log/sfweb/supabase-keepalive.log` for 200s; if the project ever shows as paused, restore it in the dashboard.

## Phase 2 pointers
See the plan file: `server/middleware/auth.ts` (jose + JWKS), `client/src/lib/api.ts`, keep
`supabase-operations.ts` signatures but call `/api/*`, convert 179 server supabase-js calls to Drizzle
(use `drizzle-introspected/schema.ts` for the ~16 missing tables), Postgres 17 container,
`scripts/db/dump-supabase.sh` / `restore-vps.sh` with the `scripts/db/sfweb-tables.txt` allowlist.

## Gotchas found on the way (2026-08-21)
- **Supabase Free project limit is per USER, not per organisation**: 2 active Free projects per account counted across every org where that account is Owner/Admin. `fatthwacka` owned two Netfox Free projects, so the Slyfox project could not become a third; pausing or deleting one (or making a different account the org owner) is required. Org-level Free limits do not exist.
- `package.json` `prepare` → `hooks:install` runs `git config …`; the Docker image has no git, so every
  `npm install` inside the build failed (exit 127). Made tolerant with `|| echo …`. Any future
  lifecycle script must not assume git.
- `@google-cloud/storage` inside the **running app container** fails the OAuth token POST with
  `ERR_STREAM_PREMATURE_CLOSE` (stale nested gaxios in that node_modules volume); a fresh
  `node:22-alpine` runner with fresh deps works. If the app itself ever shows that error on upload,
  rebuild the image with `--no-cache` (fresh node_modules).
- `02-rewrite-sql.ts` must run while the app is down (or restart the app afterwards) because
  `site-config-overrides.json` is cached in memory and re-saved by the admin UI.
- `deploy-production.sh` wipes `/opt/sfweb/*` — sync `scripts/migrate-storage/out/` back to the repo first.
