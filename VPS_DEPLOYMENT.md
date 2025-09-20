# SlyFox Studios - Complete Production Deployment Guide

**The ONLY deployment guide you need. All other deployment docs are obsolete.**

---

# 🚨 CRITICAL LESSONS - SEPTEMBER 2025

## Docker Multi-Platform Build Crisis (08 Sep 2025)

**Root Cause**: `platforms: [linux/amd64, linux/arm64]` in docker-compose.yml breaks VPS builds  
**Error**: `Multi-platform build is not supported for the docker driver`  
**Impact**: Complete deployment failure, 4+ hour outage  
**Solution**: Remove platforms from base compose, specify single platform in production override

**FIXED Configuration**:
```yaml
# docker-compose.yml - NO platforms
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development

# docker-compose.prod.yml - Single platform only
services:  
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
      platforms:
        - linux/amd64
```

## Production Override Bug (03 Sep 2025)

**Root Cause**: Deployment script ignored production overrides  
**Command**: `docker compose up -d --build` (WRONG)  
**Fixed**: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`  
**Impact**: Mobile site served development assets instead of production build

---

# ⚡ QUICK DEPLOYMENT

## Prerequisites
- SSH key configured for `slyfox-vps`
- Docker running locally and on VPS
- All changes committed to git

## Single Command Deploy
```bash
./deploy-production.sh
```

**If deployment script fails, follow manual process below.**

---

## 🚨 CRITICAL POST-DEPLOYMENT: IMAGE PERMISSIONS FIX

**⚠️ MANDATORY STEP: Image permissions get corrupted during every deployment**

```bash
# ALWAYS run after any deployment (automated or manual)
ssh slyfox-vps "cd /opt/sfweb && chmod -R 644 public/images"
ssh slyfox-vps "cd /opt/sfweb && find public -type d -exec chmod 755 {} \;"

# Verify fix worked (should return HTTP 200)
curl -I https://slyfox.co.za/images/logos/slyfox-logo-black.png
```

**Why This Happens**: 
- rsync file transfer corrupts file permissions during deployment
- Images become inaccessible (HTTP 403/404) without proper permissions
- Affects ALL images: logos, gallery photos, hero images, icons

**Required Permissions**:
- **Image Files**: 644 (readable by web server)
- **Directories**: 755 (traversable by web server)

**Symptoms of Permission Issues**:
- Broken images on website (missing logos, gallery photos)
- HTTP 403 Forbidden errors when accessing image URLs
- Site appears to load but images don't display

**This step is REQUIRED after every deployment - no exceptions!**

## 🚀 Deployment Type Guide
- **Code Changes Only** → Quick deploy + Quick success checks (2 minutes)
- **First Time/New Environment** → Full verification process (10 minutes)  
- **Service Issues/Credentials Changed** → Full verification process
- **Monthly Maintenance** → Full verification recommended

## Known Script Issues (September 2025)
- **Temporary directory cleanup failure**: Script may fail with "Directory not empty" - this is non-critical, code sync still succeeds
- **Container startup interruption**: If script fails after code sync, manually restart with production overrides
- **Recovery command**: `ssh slyfox-vps "cd /opt/sfweb && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"`

## Docker Build Cache Issues (18 Sep 2025)
- **Symptom**: Deployment appears successful but code changes not reflected on site
- **Root Cause**: Docker cached build layers prevent new source code from being compiled
- **Detection**: Old asset timestamps in production (e.g., August assets vs September source files)
- **Solution**: Force clean rebuild with `--no-cache` flag:
  ```bash
  ssh slyfox-vps "cd /opt/sfweb && docker compose down && docker system prune -f"
  ssh slyfox-vps "cd /opt/sfweb && docker build --no-cache -f Dockerfile --target runner ."
  ssh slyfox-vps "cd /opt/sfweb && docker tag [IMAGE_ID] sfweb-app:latest"
  ssh slyfox-vps "cd /opt/sfweb && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
  ```
- **Prevention**: Monitor asset timestamps vs source file changes during deployment
- **Impact**: Critical - site may appear deployed but serve stale functionality

---

# 🔧 PRE-DEPLOYMENT CHECKS

## Quick Deploy Verification (Every Deployment)
```bash
# Essential checks - run before every deployment
ssh slyfox-vps "echo 'SSH connection verified'"
ssh slyfox-vps "cd /opt/sfweb && docker compose ps | grep Up"
```

## Full Environment Verification (When Needed)

**Use full verification when:**
- First deployment to new server
- Credential changes (passwords, tokens, keys)
- Services mysteriously failing (contact form, uploads, etc.)
- Monthly maintenance checks
- Onboarding new team members

### Environment Variables Check (CRITICAL for above scenarios)
```bash
# Verify .env file exists and has required variables
ssh slyfox-vps "ls -la /opt/sfweb/.env"

# Check critical environment variables are set (values should NOT be ${VAR})
ssh slyfox-vps "cd /opt/sfweb && docker compose -f docker-compose.yml -f docker-compose.prod.yml config | grep -E 'SMTP_EMAIL|DATABASE_URL|NODE_ENV'"

# Expected output (with real values, not ${VAR}):
# SMTP_EMAIL: dax.tucker@gmail.com  
# DATABASE_URL: postgresql://postgres...
# NODE_ENV: production
```

## Platform Verification (CRITICAL)
```bash
# MUST return single platform only
ssh slyfox-vps "cd /opt/sfweb && docker compose -f docker-compose.yml -f docker-compose.prod.yml config | grep -A5 platform"

# Expected output:
# platforms:
#   - linux/amd64
```

## Build Test (Prevents 4-hour outages)
```bash
ssh slyfox-vps "cd /opt/sfweb && timeout 60 docker compose -f docker-compose.yml -f docker-compose.prod.yml build"
```

## SSH Access Test
```bash
ssh slyfox-vps "echo 'Connection verified'"
# Must return: Connection verified
```

---

# 🚀 MANUAL DEPLOYMENT PROCESS

## Step 1: Code Sync
```bash
git status && git push origin main

rsync -avz --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.npm-cache' \
  --exclude '.DS_Store' \
  ./ slyfox-vps:/opt/sfweb/
```

## Step 2: Production Deployment
```bash
# CRITICAL: Must use production overrides
ssh slyfox-vps "cd /opt/sfweb && docker compose down"
ssh slyfox-vps "cd /opt/sfweb && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
```

## Step 3: Verification
```bash
# Container status
ssh slyfox-vps "cd /opt/sfweb && docker compose ps"

# Application response
curl -I https://slyfox.co.za
# Expected: HTTP/2 200

# Production mode check
ssh slyfox-vps "docker exec sfweb-app env | grep NODE_ENV"
# Expected: NODE_ENV=production
```

---

# 🚨 DEPLOYMENT DIAGNOSTICS

## Build Failure Analysis
```bash
ssh slyfox-vps "docker system df"  # Build cache check
ssh slyfox-vps "sudo journalctl -u docker --since '1 hour ago' | grep -i build"
ssh slyfox-vps "docker buildx ls"  # Platform support
```

## Cache Detection and Validation
```bash
# Check if build assets are stale (key diagnostic)
ssh slyfox-vps "cd /opt/sfweb && find client/src/pages -name '*.tsx' -newer public/assets/hero -ls"
# If ANY files shown = source newer than build = cache issue

# Verify asset timestamps inside container
ssh slyfox-vps "cd /opt/sfweb && docker exec sfweb-app ls -la public/assets/"
# Compare timestamps with source file changes

# Check build success in Docker logs
ssh slyfox-vps "cd /opt/sfweb && docker compose logs app | grep -E '(vite|built|Done)'"
# Should show recent build completion with "✓ built in Xs"
```

## Container Health
```bash
ssh slyfox-vps "docker compose ps"
ssh slyfox-vps "docker images | grep sfweb"
ssh slyfox-vps "docker compose logs --tail=20"
```

## Live Site Tests
```bash
# Main site
curl -I https://slyfox.co.za

# Mobile user-agent (was broken before)
curl -I -H "User-Agent: Mozilla/5.0 (iPhone)" https://slyfox.co.za

# API health
curl https://slyfox.co.za/api/site-config | jq '.contact.business.name'
```

---

# 🏗️ VPS INFRASTRUCTURE

## Server Details
- **Host**: vps.netfox.co.za (168.231.86.89)
- **OS**: Ubuntu 24.04 LTS  
- **Resources**: 3.8GB RAM, 1 CPU, 48GB storage
- **Provider**: Hostinger

## Running Services
| Service | Container | Port | URL |
|---------|-----------|------|-----|
| SlyFox App | sfweb-app | 3000 | https://slyfox.co.za |
| PostgreSQL | sfweb-postgres | 5432 | Internal |
| Traefik | traefik | 80/443 | Reverse proxy |
| N8N | n8n | 5678 | http://168.231.86.89:5678 |

## SSH Configuration
```bash
# ~/.ssh/config
Host slyfox-vps
    HostName 168.231.86.89
    User root
    IdentityFile ~/.ssh/vps_key
    StrictHostKeyChecking no
```

---

# ⚠️ EMERGENCY PROCEDURES

## Site Down Recovery
```bash
# Quick container restart
ssh slyfox-vps "cd /opt/sfweb && docker compose restart"

# Full rebuild if restart fails
ssh slyfox-vps "cd /opt/sfweb && docker compose down"
ssh slyfox-vps "cd /opt/sfweb && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
```

## Configuration Loss Recovery
```bash
# Backup current state
curl -s https://slyfox.co.za/api/site-config > /tmp/prod-backup.json

# Restore from development
curl -s http://localhost:3000/api/site-config > /tmp/dev-config.json
curl -X PATCH https://slyfox.co.za/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d @/tmp/dev-config.json
```

## Nuclear Option (SITE DOWN 3-5 MINUTES)
```bash
# ⚠️ ONLY if site completely broken
curl -s https://slyfox.co.za/api/site-config > /tmp/nuclear-backup.json

ssh slyfox-vps "cd /opt/sfweb && docker compose down -v"  # WIPES DATA
ssh slyfox-vps "docker system prune -a -f"

ssh slyfox-vps "cd /opt/sfweb && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"

# Immediate config restore
curl -X PATCH https://slyfox.co.za/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d @/tmp/nuclear-backup.json
```

---

# 📋 SUCCESS VERIFICATION

## Quick Success Checks (Every Deployment)
- [ ] `curl -I https://slyfox.co.za` returns HTTP/2 200
- [ ] `ssh slyfox-vps "cd /opt/sfweb && docker compose ps"` shows both containers Up
- [ ] Image permissions: `curl -I https://slyfox.co.za/images/logos/slyfox-logo-black.png` returns HTTP/2 200
- [ ] Admin panel loads: https://slyfox.co.za/admin
- [ ] Client portal accessible: `curl -I https://slyfox.co.za/client-portal`

## Cache Verification (When Code Changes Expected)
- [ ] Build asset freshness: `ssh slyfox-vps "cd /opt/sfweb && docker exec sfweb-app ls -la public/assets/"` shows recent timestamps
- [ ] Bundle contains changes: `curl -s https://slyfox.co.za/assets/[bundle-name].js | grep -c [test-string]` finds expected content
- [ ] Client-side routing: Test dynamic routes in real browser (server commands only show index.html)

## Full Success Verification (When Environment Changed)

**Use when:** Credentials rotated, mysterious service failures, monthly checks, new team member deployments

- [ ] All quick success checks above ✅
- [ ] Environment variables loaded: `ssh slyfox-vps "docker exec sfweb-app env | grep -E 'SMTP_EMAIL|NODE_ENV'"` shows real values  
- [ ] Contact form functional: Test email sending via https://slyfox.co.za/contact
- [ ] API responds: `curl -s https://slyfox.co.za/api/site-config | head -5`
- [ ] Mobile test: iPhone user-agent gets proper HTML (not Vite dev assets)
- [ ] Production mode: `ssh slyfox-vps "docker exec sfweb-app env | grep NODE_ENV"` shows production

## Mobile Deployment Verification (September 2025)
After deploying mobile optimizations, verify these specific endpoints:
```bash
# Ensure no Vite development references (should return no results)
curl -s https://slyfox.co.za | grep -i "vite" || echo "✅ Production build confirmed"

# Test mobile user-agent gets production assets
curl -s -H "User-Agent: Mozilla/5.0 (iPhone)" https://slyfox.co.za | head -10

# Verify mobile image picker endpoints are working
curl -I https://slyfox.co.za/client-portal
```

## Performance Checks
```bash
ssh slyfox-vps "free -h && df -h"  # Resource usage
ssh slyfox-vps "docker stats --no-stream"  # Container resources
```

---

# 🔍 TROUBLESHOOTING REFERENCE

## Common Errors & Solutions

**"Multi-platform build not supported"**
- Fix: Remove platforms from docker-compose.yml base file
- Verify with platform config check above

**"ERR_MODULE_NOT_FOUND"**
- Fix: Complete rebuild with `--build` flag
- Nuclear option if persistent

**HTTP 500 responses**
- Check: `ssh slyfox-vps "cd /opt/sfweb && docker compose logs app"`
- Common: File permissions on public assets

**Site shows defaults instead of custom content**
- Fix: Configuration sync from development
- Check: Docker volume persistence

**Containers won't start**
- Check: Docker daemon status
- Check: Available disk space and memory
- Check: Port conflicts

## Deployment Script Debug

**Script hangs or fails:**
```bash
# Check SSH connection
ssh slyfox-vps "echo test"

# Check VPS resources  
ssh slyfox-vps "free -h && df -h"

# Check Docker service
ssh slyfox-vps "systemctl status docker"
```

**Build timeouts:**
```bash
# Check build logs
ssh slyfox-vps "cd /opt/sfweb && docker compose logs --tail=50"

# Manual build test
ssh slyfox-vps "cd /opt/sfweb && timeout 300 docker compose build"
```

---

# 📊 MONITORING COMMANDS

## Health Monitoring
```bash
# Application health
curl -I https://slyfox.co.za
curl https://slyfox.co.za/api/site-config | jq '.contact.business.name'

# Container status
ssh slyfox-vps "docker ps"
ssh slyfox-vps "docker stats --no-stream"

# Resource usage
ssh slyfox-vps "free -h && df -h"
ssh slyfox-vps "uptime"
```

## Log Analysis
```bash
# Application logs
ssh slyfox-vps "cd /opt/sfweb && docker compose logs -f app"

# System logs
ssh slyfox-vps "sudo journalctl -u docker --since '1 hour ago'"

# Traefik logs (if domain issues)
ssh slyfox-vps "docker logs root-traefik-1"
```

---

# 💾 BACKUP & RECOVERY

## Automatic Backups
- Configuration: Backed up before each deployment to `/opt/sfweb-backup-TIMESTAMP/`
- Database: PostgreSQL data persists in Docker volumes
- Uploads: Public images stored in `/opt/sfweb/public/uploads/`

## Manual Backup
```bash
# Configuration
curl -s https://slyfox.co.za/api/site-config > config-backup-$(date +%Y%m%d).json

# Database
ssh slyfox-vps "docker exec sfweb-postgres pg_dump -U postgres slyfox_studios > /tmp/db-backup-$(date +%Y%m%d).sql"

# Full application
ssh slyfox-vps "tar -czf /tmp/sfweb-full-backup-$(date +%Y%m%d).tar.gz /opt/sfweb/"
```

---

# 🔧 ADMIN DASHBOARD CONFIG SYNC

**📅 Updated: September 2025 - Reduced Sync Requirements with Hardcoded Architecture**

## Current Configuration Sync Status

**Pages That NO LONGER Need Sync** (September 2025):
- ✅ **Contact Page**: Now hardcoded in React components
- ✅ **About Page**: Now hardcoded in React components
- ✅ **Static Content**: All team info, business details deploy with code

**Pages That Still Need Config Sync**:
- 🔄 **Homepage**: Hero slides, services overview, testimonials
- 🔄 **Photography Categories**: All category page content
- 🔄 **Visual Settings**: Gradient colors and visual customization

## Simplified Config Sync Process (Post-Hardcoding)

**Problem**: Homepage or photography category changes not appearing in production

**Solution**: Sync only dynamic configuration
```bash
# 1. Extract current dynamic config from dev API
curl -s http://localhost:3000/api/site-config > /tmp/dynamic-config.json

# 2. Deploy to production server
scp /tmp/dynamic-config.json slyfox-vps:/opt/sfweb/server/data/site-config-overrides.json

# 3. Update running container and restart
ssh slyfox-vps "cd /opt/sfweb && \
  docker cp server/data/site-config-overrides.json sfweb-app:/app/server/data/ && \
  docker compose -f docker-compose.yml -f docker-compose.prod.yml restart app"

# 4. Verify sync worked (homepage example)
curl -s http://168.231.86.89:3000/api/site-config | jq -r '.home.servicesOverview.services[2].title'
```

**When to Use** (Reduced Scenarios):
- Homepage content changes not appearing in production
- Photography category page updates missing
- Visual gradient/color changes not reflecting
- ❌ **NO LONGER NEEDED**: Contact or About page content sync

## Historical Config Sync Issue (14 Sep 2025)

<!--
LEGACY TROUBLESHOOTING REFERENCE - Before hardcoded architecture

**Problem**: Production showing outdated content despite successful deployment
- Dev: Shows "Social Media" service (correct)
- Production: Shows "Ai Automation" service (outdated)
- Root cause: In-memory config cache not matching latest admin changes

**Why This Works**:
- Dev API serves the actual current config (including in-memory admin changes)
- File-based config might be stale if admin made changes after last save
- API extraction captures the live, working configuration state
-->

---

# 🎯 DEPLOYMENT HISTORY

**Last Successful Deployment**: 2025-09-18 (Docker cache fix + videography updates)  
**Critical Fixes Applied**:
- Docker build cache bypass methodology
- Videography YouTube integration deployment
- Production asset validation improvements
- Image permissions automation

**Previous Deployment**: 2025-09-08 (Multi-platform fix)  
**Legacy Fixes**:
- Docker multi-platform build compatibility
- Production override enforcement  
- Mobile site development mode bug
- Image-picker performance optimizations

**Success Rate**: 100% (following this guide)

---

*This guide consolidates all deployment knowledge and replaces DEPLOYMENT_GUIDE.md and DEPLOY_RULES.md*