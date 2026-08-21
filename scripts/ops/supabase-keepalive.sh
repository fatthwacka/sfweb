#!/bin/sh
# Supabase Free-plan keepalive — projects are paused after 7 days without API activity.
# Makes one authenticated REST call + one Auth health call. Installed by scripts/ops/install-cron.sh (daily).
set -u
ENV_FILE="${ENV_FILE:-/opt/sfweb/.env}"
URL=$(grep '^VITE_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d '\r')
KEY=$(grep '^VITE_SUPABASE_PUBLISHABLE_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d '\r')
[ -n "$URL" ] && [ -n "$KEY" ] || { echo "$(date -Is) keepalive: missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY in $ENV_FILE"; exit 1; }
REST=$(curl -s -o /dev/null -w '%{http_code}' -H "apikey: $KEY" -H "Authorization: Bearer $KEY" "$URL/rest/v1/site_config?select=key&limit=1")
AUTH=$(curl -s -o /dev/null -w '%{http_code}' -H "apikey: $KEY" "$URL/auth/v1/health")
echo "$(date -Is) keepalive: rest=$REST auth=$AUTH"
[ "$REST" = "200" ] || [ "$AUTH" = "200" ]
