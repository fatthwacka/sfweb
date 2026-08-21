# 🎥 Video Upload (Production) — Debug Handoff

**Created:** 2026-06-23
**Status:** ✅ RESOLVED 2026-07-08 — see §0 below
**Severity:** Non-critical (live public site unaffected; admin-only feature)

---

## 0. Resolution (2026-07-08)

Root cause confirmed and fixed. The missing `upload.slyfox.co.za` A record was recreated via the
Cloudflare API (record id `aa2b4fe8a9d0824911ea9088e7b6f154`, A `upload` → `168.231.86.89`,
**DNS-only / grey cloud**). The sfweb `.env` token only has cache-purge scope; the DNS-capable
token from the WHITEHOUSE migration project was used
(`node scripts/cloudflare-dns.js add slyfox.co.za A upload 168.231.86.89 "" false`) and is now
also stored in sfweb `.env` as `CLOUDFLARE_DNS_API_TOKEN`.

Additional findings while verifying:
- **The record existed before and was deleted**: Traefik held a real LE cert for the subdomain
  issued 2026-03-05, expired 2026-06-03 — issuance requires DNS, so the record was live in March.
- **Expired cert fixed**: restarted `root-traefik-1`; TLS-ALPN renewal succeeded immediately.
  New cert valid to 2026-10-06. Renewals will now keep working as long as the DNS record stays
  grey-cloud.
- **Backend route verified**: empty `POST /api/videos/upload` on the VPS returns 400 (route
  registered) — §5 Q2 answered.
- **CORS verified**: responses carry `access-control-allow-origin: https://slyfox.co.za` etc. —
  §5 Q5 answered.
- **⚠️ NEW open issue found**: LE renewal for the MAIN domain (`slyfox.co.za`/`www`) fails
  (TLS-ALPN can't pass through the orange-cloud Cloudflare proxy); the origin cert expired
  2026-03-31. Live site is unaffected (Cloudflare edge cert + "Full" SSL mode tolerates it), but
  if SSL mode is ever set to "Full (strict)" the site breaks. Fix later via Cloudflare Origin
  Certificate or DNS-01 challenge.

**Next action owner:** none (resolved) — apart from the main-domain origin-cert issue above.

### Round 2 (same day): multi-video uploads still 502'd — Traefik 60s readTimeout

After the DNS fix, a single short video uploaded fine but multiple videos failed with
`502 Bad Gateway` (browser showed a misleading CORS error — Traefik's 502 page has no CORS
headers). VPS logs showed multer `Error: Request aborted` — the request was severed
mid-transfer. Root cause: **Traefik v3 (3.5.3) defaults `readTimeout` to 60s** on entrypoints
(v2 had no timeout), so any upload whose body took >60s to transmit was killed. Dev has no
Traefik in front of Express, which is why localhost multi-upload always worked.

**Fixes applied 2026-07-08:**
1. **VPS (live now, no deploy needed):** added
   `--entrypoints.websecure.transport.respondingTimeouts.readTimeout=3600s` to the traefik
   service in `/root/docker-compose.yml` (backup: `docker-compose.yml.bak-20260708`) and
   recreated the container. Verified with a rate-limited 106-second 10MB upload → HTTP 200.
2. **Code (needs next deploy):** `server.requestTimeout = 3600000` in `server/index.ts` and
   `server/prod-index.ts` — Node 22 defaults to a 5-minute requestTimeout, which becomes the
   next ceiling for very large uploads (1.5GB at ~20Mbps ≈ 10 min). Until deployed, uploads
   transferring in under ~5 min work; longer ones will still abort.
3. **Code (cosmetic, needs next deploy):** `shoot_previews` lookup in
   `client/src/lib/supabase-operations.ts` switched `.single()` → `.maybeSingle()` — shoots
   without preview settings caused a harmless-but-noisy 406 in the console on every gallery load.

### Round 3 (same day): main-domain origin cert — fixed via DNS-01, not Origin CA

The Origin CA API route was abandoned: it is a **user-level** endpoint and rejects
account-owned API tokens with error 1016 regardless of scope (the "site-migrations" token is
account-owned). Instead, the main domain now uses **Let's Encrypt DNS-01 via the Cloudflare
API**, which works behind the orange-cloud proxy and auto-renews:

1. `/root/.env` (VPS): added `CF_DNS_API_TOKEN` (the "site-migrations" account token — it has
   DNS edit on the slyfox.co.za zone). ⚠️ That file's last line had no trailing newline; a
   blind `>>` append corrupted `SSL_EMAIL` and had to be repaired.
2. `/root/docker-compose.yml` (backup `.bak2-20260708`): new `cfdns` certresolver
   (`dnschallenge.provider=cloudflare`, storage `/letsencrypt/acme-cfdns.json`) + the token
   passed via `environment:` on the traefik service.
3. `docker-compose.prod.yml` (repo AND `/opt/sfweb`, backup `.bak-20260708`): router
   `slyfox-https` switched `certresolver: mytlschallenge → cfdns`. The **upload** router stays
   on `mytlschallenge` (grey cloud, TLS-ALPN works fine there). App container recreated with
   the standard overlay invocation (same image, labels only).
4. **Gotcha:** cfdns initially logged "No ACME certificate generation required" — the expired
   slyfox.co.za cert still in `mytlschallenge`'s `acme.json` made the store consider the
   domain covered. Removed that entry (backup `/root/acme.json.bak-20260708`), restarted
   Traefik → cert issued immediately.

Verified: origin serves a fresh LE cert for slyfox.co.za+www (valid to 2026-10-06,
auto-renews), site + www return 200 through Cloudflare, upload subdomain untouched. It is now
SAFE to set Cloudflare SSL mode to **Full (strict)**. The staged origin-cert key/CSR were
removed (unused). Remaining acme noise in Traefik logs: stale `n8n.srv825597.hstgr.cloud`
renewal failures (NXDOMAIN) — harmless, clean up by removing its acme.json entry if it grates.

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
