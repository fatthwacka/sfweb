#!/bin/sh
# Install/refresh the sfweb ops cron jobs on the VPS (idempotent). Run as root on the VPS:
#   sh /opt/sfweb/scripts/ops/install-cron.sh
set -eu
chmod +x /opt/sfweb/scripts/ops/*.sh
mkdir -p /opt/sfweb-backups/db /var/log/sfweb
TMP=$(mktemp)
crontab -l 2>/dev/null | grep -v 'sfweb-ops' > "$TMP" || true
cat >> "$TMP" <<'CRON'
# sfweb-ops: Supabase Free-plan keepalive (daily 06:10) and nightly DB backup (02:30)
10 6 * * * /opt/sfweb/scripts/ops/supabase-keepalive.sh >> /var/log/sfweb/supabase-keepalive.log 2>&1 # sfweb-ops
30 2 * * * /opt/sfweb/scripts/ops/backup-supabase-db.sh >> /var/log/sfweb/backup-supabase-db.log 2>&1 # sfweb-ops
CRON
crontab "$TMP"; rm -f "$TMP"
echo "installed:"; crontab -l | grep sfweb-ops
