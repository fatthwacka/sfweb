#!/bin/sh
# Nightly pg_dump of the Supabase `public` schema (the Free plan has no managed backups) +
# copy to the GCS archive bucket. Runs on the VPS via cron (see install-cron.sh).
# Uses postgres:17-alpine for pg_dump (no psql on the host) and the node:22 runner for the GCS upload.
set -eu
ENV_FILE="${ENV_FILE:-/opt/sfweb/.env}"
BACKUP_DIR="${BACKUP_DIR:-/opt/sfweb-backups/db}"
KEEP_DAYS="${KEEP_DAYS:-14}"
URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d '\r')
URL=$(printf "%s" "$URL" | sed "s#:6543/#:5432/#")   # session pooler for pg_dump
mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d-%H%M)
FILE="supabase-public-$TS.dump"
docker run --rm -e PGURL="$URL" -v "$BACKUP_DIR":/b postgres:17-alpine \
  sh -c "pg_dump \"\$PGURL\" --schema=public --no-owner --no-privileges -Fc -f /b/$FILE" 
SIZE=$(stat -c %s "$BACKUP_DIR/$FILE")
echo "$(date -Is) backup: $BACKUP_DIR/$FILE ($SIZE bytes)"
# Off-box copy → gs://sfweb-media-archive/db/
docker run --rm -e NODE_OPTIONS=--dns-result-order=ipv4first \
  -v /opt/sfweb-migration/node_modules:/app/node_modules -v /opt/sfweb/scripts:/app/scripts \
  -v "$ENV_FILE":/app/.env:ro -v "$BACKUP_DIR":/backups:ro -w /app node:22-alpine \
  node scripts/ops/gcs-upload.ts "/backups/$FILE" "db/$FILE"
# Retention (local). The archive bucket keeps everything (Archive class, ~$0.0012/GB/month).
find "$BACKUP_DIR" -name 'supabase-public-*.dump' -mtime +"$KEEP_DAYS" -print -delete | sed 's/^/  pruned /'
