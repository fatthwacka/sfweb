# 🎥 Video Upload (Production) — Debug Handoff

**Created:** 2026-06-23
**Status:** 🔴 UNRESOLVED — video uploads fail in production, work in development
**Severity:** Non-critical (live public site unaffected; admin-only feature)
**Next action owner:** continue on another device

---

## 1. Symptom

- Uploading videos in the **production** admin dashboard (`https://slyfox.co.za/admin` → gallery / video albums) **fails**.
- The same flow **works in development** (`http://localhost:3000`).
- This persisted even after a full, verified production deployment on 2026-06-23 (latest dev code is live — see §6).

## 2. Root cause (HIGH CONFIDENCE)

**The `upload.slyfox.co.za` DNS record does not exist (NXDOMAIN).**

Large video uploads are deliberately routed to a dedicated subdomain to bypass Cloudflare's 100 MB request limit (commit `dd2f95e` "Bypass Cloudflare 100MB limit for large video uploads"). The frontend builds the upload URL from `VITE_UPLOAD_URL`, **but only when not on localhost**:

[`client/src/lib/supabase-operations.ts:558-575`](../client/src/lib/supabase-operations.ts#L558-L575):
```js
// Use upload subdomain for videos to bypass Cloudflare's 100MB limit
// Auto-detect localhost for local development (use relative paths)
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const uploadBaseUrl = !isLocalhost ? (import.meta.env.VITE_UPLOAD_URL || '') : '';
const endpoint = `${uploadBaseUrl}/api/videos/upload`;
```

Same pattern in [`client/src/components/admin/enhanced-gallery-editor.tsx:228`](../client/src/components/admin/enhanced-gallery-editor.tsx#L228).

**Why dev works, prod fails:**
| Environment | `isLocalhost` | `uploadBaseUrl` | Upload endpoint | Result |
|---|---|---|---|---|
| Dev (localhost) | `true` | `''` (empty) | `/api/videos/upload` (relative → local server) | ✅ works |
| Prod (slyfox.co.za) | `false` | `https://upload.slyfox.co.za` | `https://upload.slyfox.co.za/api/videos/upload` | ❌ NXDOMAIN → fetch fails |

## 3. Evidence collected (2026-06-23)

```
# VITE_UPLOAD_URL is set correctly in BOTH envs and embedded in the prod bundle:
local .env:  VITE_UPLOAD_URL=https://upload.slyfox.co.za
prod  .env:  VITE_UPLOAD_URL=https://upload.slyfox.co.za
prod bundle (dist/public/assets/index-*.js) contains: upload.slyfox.co.za  ✅

# But the subdomain does not resolve:
$ nslookup upload.slyfox.co.za     →  ** can't find upload.slyfox.co.za: NXDOMAIN
$ curl -I https://upload.slyfox.co.za   →  HTTP 000 (no response)

# Main domain resolves to Cloudflare (proxied / orange cloud):
$ nslookup slyfox.co.za            →  104.21.32.8, 172.67.182.29 (Cloudflare)

# VPS direct IP: 168.231.86.89
```

**Traefik is already configured for the subdomain** (so once DNS exists, routing + TLS should "just work"). See [`docker-compose.prod.yml`](../docker-compose.prod.yml) labels:
```yaml
# DNS: upload.slyfox.co.za → 168.231.86.89 (DNS only, grey cloud - NOT proxied)
- "traefik.http.routers.slyfox-upload-https.rule=Host(`upload.slyfox.co.za`)"
- "traefik.http.routers.slyfox-upload-https.entrypoints=websecure"
- "traefik.http.routers.slyfox-upload-https.tls=true"
- "traefik.http.routers.slyfox-upload-https.tls.certresolver=mytlschallenge"
- "traefik.http.routers.slyfox-upload-https.service=slyfox"
```

The compose comment itself documents the intended DNS record that is missing.

## 4. Recommended fix (try first)

**Create the DNS record in Cloudflare:**
- Type: `A`
- Name: `upload`  (→ `upload.slyfox.co.za`)
- Value: `168.231.86.89`
- Proxy status: **DNS only (grey cloud)** — MUST be unproxied, otherwise Cloudflare re-imposes the 100 MB limit and defeats the entire purpose.

Then verify (allow a few minutes for DNS + Let's Encrypt cert issuance via Traefik):
```bash
nslookup upload.slyfox.co.za                       # should now return 168.231.86.89
curl -I https://upload.slyfox.co.za                # expect a response (200/404 from app, NOT 000)
ssh slyfox-vps "docker logs root-traefik-1 --tail 50 | grep -i upload"   # cert issuance / acme
# then test an actual upload in the admin dashboard with a real video file
```

If Traefik does not auto-issue the cert, check the `mytlschallenge` certresolver and that ports 80/443 reach the VPS for the ACME challenge (note: subdomain must be grey-cloud so ACME hits the VPS directly).

## 5. Open questions / alternative hypotheses (verify, don't assume)

1. **Was the DNS record ever created?** It may have been deleted, never added, or added as proxied (orange cloud). Check Cloudflare DNS dashboard history.
2. **Backend route exists?** Confirm `POST /api/videos/upload` is registered and works when hit directly on the VPS:
   `ssh slyfox-vps "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/videos/upload"` (expect 4xx for empty body, NOT connection refused — proves the route exists).
3. **Body-size limits:** even with DNS fixed, confirm the upload path (Traefik + Express `prod-index.ts`) allows large bodies. See `server/prod-index.ts:52` ("bypasses Cloudflare's 100MB upload limit") and the `express.json({ limit: '10mb' })` note — video uploads use `multipart/form-data` (multer), not json, so check the multer limits too.
4. **Error surface:** capture the ACTUAL browser console / network error on a failed prod upload (status code, CORS error, DNS error). This was not captured this session — get it next time; it will confirm NXDOMAIN vs CORS vs 413 vs timeout.
5. **CORS:** uploads go cross-origin (slyfox.co.za → upload.slyfox.co.za). Verify the `/api/videos/upload` response sets appropriate CORS headers, or the browser will block it even once DNS resolves.

## 6. Environment state as of this handoff

- **Production deployed 2026-06-23** with the full current dev codebase. All verified green (live site 200, admin 200, new bundle `index-B3qsA4oM.js`, VITE vars embedded, Node 22). So prod is NOT running stale code — the failure is infrastructure (DNS), not a missing deploy.
- **Prod now runs Node 22** (was Node 20) — required by current `@supabase/supabase-js`. See [Node 22 requirement](#).
- **Dev/prod share ONE Supabase project** (`dwkjfuhykdjtzvrzdnrr`) — DB schema is identical for both; not a factor here.
- **Rollback available** if needed (does NOT fix uploads, just reverts code):
  ```bash
  ssh slyfox-vps "cd /opt/sfweb && docker tag sfweb-app:rollback-20260623-143254 sfweb-app:latest && \
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate"
  ```
- Full backup: `/opt/sfweb-fullbackup-20260623-143254.tar.gz` (includes `.env`).

## 7. Quick-start for the next session

```bash
# 1. Reproduce: log into https://slyfox.co.za/admin, try a video upload, capture the
#    browser Network tab error on POST to upload.slyfox.co.za/api/videos/upload
# 2. Confirm DNS still missing:
nslookup upload.slyfox.co.za
# 3. Apply fix in §4 (Cloudflare A record, grey cloud)
# 4. Verify per §4, then re-test upload
# 5. If still failing, work through §5 open questions (backend route, CORS, body limits)
```

---

*See also: [VPS_DEPLOYMENT.md](../VPS_DEPLOYMENT.md) (deploy mechanics + 2026-06-23 deploy entry), [DEV_SERVER_STARTUP.md](../DEV_SERVER_STARTUP.md) (Node 22).*
