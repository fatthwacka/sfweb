# Comprehensive Backup & Recovery System

## 🛡️ Backup Architecture Overview

**Implementation Date**: January 1, 2026  
**Database**: Supabase (PostgreSQL) + Site Configuration  
**Storage**: Dropbox via rclone + Supabase Built-in Backups  
**Schedule**: Daily at 2:30 AM UTC  

## 📁 File Locations

### VPS (Production Server)
```bash
~/scripts/config-backup.sh                    # Site configuration backup script
~/backups/config/                            # Local config backup storage (7-day retention)
~/backups/config-backup.log                  # Config backup execution log
~/.config/rclone/rclone.conf                 # rclone authentication config
/opt/sfweb/server/data/site-config-overrides.json  # Source configuration file
```

### Dropbox Storage
```
SlyfoxPro:APPS/Website/sfweb-backups/config/
├── site_config_20260101_093420.json
├── site_config_20260102_023000.json
└── ... (daily config backups with Dropbox 3-month versioning)
```

### Supabase Built-in Backups
```
Supabase Dashboard → Project Settings → Database → Backups
├── Automatic daily backups (7-30+ days retention)
├── Point-in-time recovery (paid plans)
└── Manual backup export capability
```

## 🔄 Backup Process

### 1. Site Configuration Backup (Automated Daily)
**What's Backed Up**: Site-specific settings not stored in Supabase
1. **Trigger**: Cron job at 2:30 AM UTC daily
2. **Source**: `/opt/sfweb/server/data/site-config-overrides.json`
3. **Copy**: Creates timestamped copy to local backup directory
4. **Upload**: rclone copy to Dropbox `config/` folder
5. **Verification**: Confirms upload success
6. **Cleanup**: Removes local files older than 7 days
7. **Logging**: All operations logged to `~/backups/config-backup.log`

### 2. Supabase Database Backup (Built-in)
**What's Backed Up**: All user data, blog posts, gallery metadata, authentication
- **Automatic**: Daily backups managed by Supabase infrastructure
- **Retention**: 7 days (free), 30+ days (paid plans)
- **Access**: Via Supabase Dashboard or CLI
- **Features**: Point-in-time recovery, instant restore, export functionality

### File Naming Convention
```bash
# Config backups
site_config_YYYYMMDD_HHMMSS.json
# Example: site_config_20260101_093420.json

# Supabase backups (via dashboard)
project_backup_YYYY-MM-DD_HH-MM-SS.sql
# Example: project_backup_2026-01-01_09-34-20.sql
```

## 🔧 Manual Operations

### Manual Config Backup
```bash
ssh ubuntu@168.231.86.89 "~/scripts/config-backup.sh"
```

### Check Backup Status
```bash
# View recent config backups in Dropbox
ssh ubuntu@168.231.86.89 "rclone ls SlyfoxPro:APPS/Website/sfweb-backups/config/ | tail -10"

# Check config backup log
ssh ubuntu@168.231.86.89 "tail -20 ~/backups/config-backup.log"

# Verify cron job
ssh ubuntu@168.231.86.89 "crontab -l"
```

### Download Config Backup for Restore
```bash
# List available config backups
rclone ls SlyfoxPro:APPS/Website/sfweb-backups/config/

# Download specific config backup
rclone copy SlyfoxPro:APPS/Website/sfweb-backups/config/site_config_YYYYMMDD_HHMMSS.json ./
```

### Manual Supabase Database Export
**Method 1: Via Supabase Dashboard**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Select project: `dwkjfuhykdjtzvrzdnrr`
3. Settings → Database → Backups
4. Click "Export" on desired backup
5. Download SQL file

**Method 2: Via Supabase CLI**
```bash
# On VPS (requires project linking)
export SUPABASE_ACCESS_TOKEN='$SUPABASE_SECRET_KEY'

# Export current database state
supabase db dump --linked -f backup_$(date +%Y%m%d_%H%M%S).sql

# Export specific schema
supabase db dump --linked -s public -f schema_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Method 3: Direct PostgreSQL Connection**
```bash
# Using pg_dump with Supabase connection details
# Database password available in Supabase Dashboard → Settings → Database
PGPASSWORD='[DB_PASSWORD_FROM_SUPABASE_DASHBOARD]' pg_dump \
  -h db.[PROJECT_REF].supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --no-owner --no-privileges \
  -f supabase_export_$(date +%Y%m%d_%H%M%S).sql
```

## 🔄 Restore Procedures

### 1. Site Configuration Restore
**When to use**: Lost site settings, incorrect configuration, need to rollback changes

```bash
# 1. Stop the application (to prevent file conflicts)
ssh ubuntu@168.231.86.89 "cd /opt/sfweb && sudo docker-compose down"

# 2. Download specific config backup
rclone copy SlyfoxPro:APPS/Website/sfweb-backups/config/site_config_YYYYMMDD_HHMMSS.json ./

# 3. Replace current config file
ssh ubuntu@168.231.86.89 "sudo cp ./site_config_YYYYMMDD_HHMMSS.json /opt/sfweb/server/data/site-config-overrides.json"

# 4. Restart application
ssh ubuntu@168.231.86.89 "cd /opt/sfweb && sudo docker-compose up -d"

# 5. Verify configuration restored
curl -s https://slyfox.co.za/api/site-config | jq .
```

### 2. Supabase Database Restore

#### Method A: Via Supabase Dashboard (Recommended)
**When to use**: Point-in-time recovery, major data loss, corrupted database

1. **Access Dashboard**: Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. **Select Project**: `dwkjfuhykdjtzvrzdnrr`
3. **Navigate**: Settings → Database → Backups
4. **Choose Backup**: Select the backup date/time to restore
5. **Restore**: Click "Restore" (⚠️ This will overwrite current database)
6. **Verify**: Check application functionality after restore completes

#### Method B: Via Supabase CLI
**When to use**: Scripted restore, specific schema recovery

```bash
# On VPS with Supabase CLI
export SUPABASE_ACCESS_TOKEN='$SUPABASE_SECRET_KEY'

# Method 1: Restore from Supabase backup
supabase db reset --linked  # Resets to initial state
# Note: Full backup restore via CLI requires enterprise features

# Method 2: Import from exported SQL file
supabase db push --linked --include-data --file backup_YYYYMMDD_HHMMSS.sql
```

#### Method C: Direct PostgreSQL Restore (Emergency)
**⚠️ Advanced use only - requires database credentials**

```bash
# Import SQL backup directly to Supabase database
# Use database credentials from Supabase Dashboard → Settings → Database
PGPASSWORD='[DB_PASSWORD_FROM_DASHBOARD]' psql \
  -h db.[PROJECT_REF].supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f backup_file.sql
```

### 3. Complete System Restore
**When to use**: VPS failure, complete system rebuild

```bash
# 1. Deploy fresh application from git
git clone https://github.com/yourusername/slyfox-studios.git /opt/sfweb

# 2. Restore environment variables (from PRODUCTION_SECRETS_SETUP.md)
# Create .env file with all production secrets

# 3. Restore site configuration
rclone copy SlyfoxPro:APPS/Website/sfweb-backups/config/site_config_LATEST.json /opt/sfweb/server/data/site-config-overrides.json

# 4. Start application (database restoration not needed - Supabase handles this)
cd /opt/sfweb && sudo docker-compose up -d

# 5. Verify all functionality
curl https://slyfox.co.za
```

## 📊 Backup Monitoring

### Success Indicators
- ✅ Backup log shows successful completion
- ✅ New `.sql.gz` file appears in Dropbox
- ✅ No error messages in `/home/ubuntu/backups/backup.log`
- ✅ File size is reasonable (current: ~368 bytes for minimal data)

### Failure Detection
- ❌ No new backup file in Dropbox after 2:30 AM UTC
- ❌ Error messages in backup log
- ❌ Backup script execution errors
- ❌ rclone authentication failures

### Maintenance Commands
```bash
# Test rclone connection
ssh ubuntu@168.231.86.89 "rclone lsd SlyfoxPro:"

# Manual backup test
ssh ubuntu@168.231.86.89 "~/scripts/db-backup.sh"

# View backup sizes
ssh ubuntu@168.231.86.89 "rclone ls SlyfoxPro:APPS/Website/sfweb-backups/ | awk '{print \$1, \$2}'"
```

## 💾 Retention Policy

### Local VPS Storage
- **Retention**: 3 days
- **Purpose**: Quick restore capability
- **Cleanup**: Automatic via backup script

### Dropbox Storage  
- **Retention**: 3 months (Dropbox automatic versioning)
- **Purpose**: Long-term backup and versioning
- **Features**: Minute-by-minute change tracking, version history
- **Access**: Via Dropbox web interface or rclone

## 🔐 Security Considerations

### Authentication
- **rclone**: OAuth2 token stored in `~/.config/rclone/rclone.conf`
- **Database**: Internal Docker network access only
- **Dropbox**: Private SlyfoxPro account with restricted access

### Data Protection
- **Encryption**: Data encrypted in transit to Dropbox
- **Access Control**: VPS SSH key required for script execution
- **Backup Integrity**: gzip checksums ensure data integrity

## 🚨 Troubleshooting

### Common Issues

**rclone Authentication Expired**
```bash
# Re-copy config from local machine
scp ~/.config/rclone/rclone.conf ubuntu@168.231.86.89:~/.config/rclone/
```

**Docker Container Not Running**
```bash
ssh ubuntu@168.231.86.89 "cd ~/slyfox-studios && sudo docker-compose up -d"
```

**Disk Space Issues**
```bash
# Clean old local backups manually
ssh ubuntu@168.231.86.89 "find ~/backups/db -name '*.sql.gz' -mtime +1 -delete"
```

**Cron Job Not Running**
```bash
# Verify cron service
ssh ubuntu@168.231.86.89 "sudo systemctl status cron"

# Check cron logs
ssh ubuntu@168.231.86.89 "sudo tail -20 /var/log/syslog | grep CRON"
```

## 📈 Performance Metrics

### Current Backup Stats
- **Database Size**: ~368 bytes compressed
- **Backup Duration**: ~5 seconds total
- **Upload Duration**: ~5 seconds to Dropbox
- **Storage Cost**: $0 (using existing Dropbox)
- **Network Usage**: Minimal (~1KB per backup)

### Expected Growth
- As database grows, backup size will increase proportionally
- Compression ratio should remain ~80-90% for text data
- Upload time scales linearly with file size
- Dropbox 3-month retention provides ample version history

---

**Next Review**: February 2026 (monthly backup system health check)