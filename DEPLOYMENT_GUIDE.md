# SlyFox Studios - Complete Deployment Guide

This comprehensive guide covers both development and production deployment for the SlyFox Studios photography website.

## 🚀 Quick Reference

| Environment | Command | Access | Purpose |
|-------------|---------|--------|---------|
| **Development** | `npm run docker:dev` | http://localhost:3000 | Local development with hot reload |
| **Production** | `./deploy-production.sh` | https://slyfox.co.za | Live website with SSL and domain |

## 🔴 **CRITICAL: WE'RE LIVE - PRODUCTION SAFETY FIRST** ⭐ **READ THIS FIRST**

**⚠️ LIVE WEBSITE WARNING: https://slyfox.co.za is accessible to real users - NO RISKY OPERATIONS**

### **🛡️ LIVE-SAFE DEPLOYMENT RULES** 

**❌ FORBIDDEN OPERATIONS (Site is live!):**
```bash
# NEVER use these commands - they WIPE LIVE DATA:
docker compose down -v        # ❌ Deletes volumes = SITE BROKEN
docker system prune -a -f     # ❌ Emergency only - corrupts config  
docker volume rm config_data  # ❌ INSTANT SITE BREAKAGE
```

**✅ LIVE-SAFE OPERATIONS ONLY:**
```bash
# SAFE: Preserves all live site data
docker compose down           # Graceful stop only
docker compose up -d --build  # Rebuild preserving data
./deploy-production.sh        # Uses safe methods
```

**🚨 MANDATORY BEFORE ANY CHANGE:**
```bash
# Backup live site state (30 seconds max downtime acceptable)
curl -s https://slyfox.co.za/api/site-config > /tmp/live-backup-$(date +%Y%m%d-%H%M%S).json

# Verify site is responding  
curl -I https://slyfox.co.za  # Must return 200 before proceeding
```

## 🚨 **CRITICAL: CONFIGURATION SYNC PROCESS** ⭐ **ESSENTIAL FOR LIVE SITE**

**⚠️ MANDATORY: Every deployment MUST include configuration sync to prevent LIVE SITE showing defaults**

### **Root Cause of Recurring Issues**
The primary cause of "settings not showing up after deployment" is **configuration data living in development but not being synced to production**. Code deployment alone is insufficient.

### **The Complete Configuration System** 
```
Development Environment:
├── Code changes → Git commits → Deployment script
├── Configuration data → JSON files → MUST BE MANUALLY SYNCED
└── Uploaded images → public/uploads/ → MUST BE MANUALLY SYNCED

Production Environment:
├── Code ✅ (Automated via git/docker)
├── Configuration ❌ (MANUAL SYNC REQUIRED)  
└── Images ❌ (MANUAL SYNC REQUIRED)
```

### **🔧 MANDATORY Pre-Deployment Configuration Sync**

**Before running `./deploy-production.sh`, ALWAYS run these commands:**

```bash
# Step 1: Verify development environment is working
curl -s http://localhost:3000/api/site-config | jq '.about.team.members | length'
# Expected: > 0 (should show number of team members)

# Step 2: Download complete development configuration  
curl -s http://localhost:3000/api/site-config > /tmp/dev-config-sync.json

# Step 3: Verify development config is complete
cat /tmp/dev-config-sync.json | jq 'keys | length'
# Expected: >= 5 (should have contact, home, about, portfolio, etc.)

# Step 4: Push configuration to production (AFTER deployment)
curl -X PATCH https://slyfox.co.za/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d @/tmp/dev-config-sync.json

# Step 5: Verify production config sync success
curl -s https://slyfox.co.za/api/site-config | jq '.about.team.members | length'
# Expected: Should match development count
```

### **🚨 CRITICAL: Docker Volume Sync Issues (TESTED 2025-09-01)**

**⚠️ IMPORTANT**: The above API-based sync method may fail due to Docker volume persistence issues. If configuration changes don't appear after the API sync, use this **MANDATORY fallback process**:

#### **The Container Restart Sync Process (GUARANTEED METHOD)**

**When API sync fails or Docker volumes don't update:**

```bash
# Step 1: Safe container stop (prevents file locking)
ssh slyfox-vps "cd /opt/sfweb && docker compose down"

# Step 2: Update host filesystem config
scp /tmp/dev-config-sync.json slyfox-vps:/tmp/new-config.json
ssh slyfox-vps "cp /tmp/new-config.json /opt/sfweb/server/data/site-config-overrides.json"

# Step 3: Restart containers
ssh slyfox-vps "cd /opt/sfweb && docker compose up -d"

# Step 4: CRITICAL - Force container file sync (MOST IMPORTANT STEP)
ssh slyfox-vps "docker cp /opt/sfweb/server/data/site-config-overrides.json sfweb-app:/app/server/data/site-config-overrides.json"

# Step 5: Final container restart to reload config
ssh slyfox-vps "cd /opt/sfweb && docker compose restart app"

# Step 6: Cache purge wait
echo "Waiting 60 seconds for production cache purge..." && sleep 60

# Step 7: Verify success
curl -s https://slyfox.co.za/api/site-config | jq -r '.about.team.members[] | select(.name=="Kyle Wiesner") | .description'
curl -s -o /dev/null -w '%{http_code}' https://slyfox.co.za && echo " ✅ Site operational"
```

#### **Why This Process is Required**

**Root Cause**: Docker volumes preserve container internal files even when host filesystem files are updated. The container doesn't automatically reload config from host mounts.

**Symptoms of Volume Sync Issues**:
- Host file updated: `/opt/sfweb/server/data/site-config-overrides.json` (new timestamp)
- Container file unchanged: `/app/server/data/site-config-overrides.json` (old timestamp)  
- API serves cached/old data despite "successful" file updates
- Admin dashboard shows outdated content

**Debug Commands**:
```bash
# Compare file timestamps (should be identical after successful sync)
echo "HOST:" && ssh slyfox-vps "ls -la /opt/sfweb/server/data/site-config-overrides.json"
echo "CONTAINER:" && ssh slyfox-vps "docker exec sfweb-app ls -la /app/server/data/site-config-overrides.json"
```

**📋 Complete documentation**: See `SITE-CONFIG-JSON-VPS-RULES.md` for detailed troubleshooting.

### **🗂️ ALL Configuration Files That Must Be Synced**

#### **PRIMARY CONFIGURATION (API-Based)**
- **Data**: Complete admin dashboard settings
- **Source**: Development API endpoint `/api/site-config`
- **Target**: Production API endpoint `/api/site-config/bulk`
- **Sync Method**: cURL PATCH request (shown above)
- **Contains**:
  - Homepage (hero slides, services, testimonials)
  - About page (team members, story, values)  
  - Contact info (business details, hours, response times)
  - Portfolio settings (featured layout, colors)
  - Photography categories (weddings, corporate, etc.)
  - Section colors and gradients

#### **FILE-BASED CONFIGURATION**
```bash
# Alt-text storage
scp "dev/alt-text-storage.json" slyfox-vps:/opt/sfweb/
ssh slyfox-vps "docker cp /opt/sfweb/alt-text-storage.json sfweb-app:/app/"

# Uploaded images directory  
rsync -av "dev/public/uploads/" slyfox-vps:/opt/sfweb/public/uploads/
ssh slyfox-vps "cd /opt/sfweb && docker compose restart app"

# Category configuration fallbacks (if modified)
scp "dev/shared/types/category-config.ts" slyfox-vps:/opt/sfweb/shared/types/
ssh slyfox-vps "docker cp /opt/sfweb/shared/types/category-config.ts sfweb-app:/app/shared/types/"
```

### **🎯 Deployment Order (CRITICAL)**

**WRONG ORDER (Causes Issues):**
1. Deploy code changes → 2. Sync configuration ❌

**CORRECT ORDER:**
1. ✅ **Commit and push code changes**
2. ✅ **Deploy code**: `./deploy-production.sh`  
3. ✅ **Verify containers running**: `docker compose ps`
4. ✅ **Sync configuration**: API + file sync commands above
5. ✅ **Test live site**: Verify changes appear

### **🚨 LIVE SITE EMERGENCY CONFIGURATION RECOVERY** ⚠️ **CRITICAL**

**⚠️ WARNING: WE'RE LIVE - USERS ARE WATCHING! IMMEDIATE RESPONSE REQUIRED**

If production shows defaults/old data after deployment:

```bash
# STEP 1: IMMEDIATE backup of current live state
curl -s https://slyfox.co.za/api/site-config > /tmp/live-emergency-backup-$(date +%Y%m%d-%H%M%S).json

# STEP 2: Quick fix - Re-sync development config
curl -s http://localhost:3000/api/site-config > /tmp/emergency-sync.json
curl -X PATCH https://slyfox.co.za/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d @/tmp/emergency-sync.json

# STEP 3: IMMEDIATE verification (< 30 seconds)
curl -s https://slyfox.co.za/api/site-config | jq '.about.team.members | length'
curl -I https://slyfox.co.za  # Must return 200

# STEP 4: Visual verification in browser
# Open https://slyfox.co.za - check team section shows 5+ members
```

**🚨 LIVE SITE IMPACT**: Configuration loss = visitors see incomplete content

### **✅ Success Verification Checklist**

After every deployment, verify these work:
- [ ] **Main site loads**: https://slyfox.co.za returns HTTP 200
- [ ] **Admin panel works**: https://slyfox.co.za/admin shows admin interface  
- [ ] **API serves data**: `curl https://slyfox.co.za/api/site-config | jq '.about.team.members | length'` shows > 0
- [ ] **About page shows team**: Team section displays 5+ members with photos
- [ ] **Admin panel shows data**: Site Management → About → Meet the Team shows populated team
- [ ] **Recent images load**: New uploaded images accessible at `/uploads/filename`

### **⚡ Why This Process is Required**

**Technical Reason**: The application has two separate data systems:
1. **Code** (React components, API logic) → Deployed via Docker
2. **Configuration Data** (admin dashboard content) → Stored in JSON files + Docker volumes

**Docker deployment rebuilds containers but does NOT sync configuration data between environments.**

---

## 🖥️ Development Environment

### Prerequisites

- **Docker Desktop** - Must be installed and running
- **Node.js 20+** - For npm commands
- **Dropbox** - For cross-device file synchronization
- **Git** - For version control

### Quick Start

```bash
# Navigate to project directory (platform-specific paths)
cd "/Volumes/KLEANDOC/Origin Dropbox/SLYFOX/ADMIN/WEBSITE/2025/sfweb"  # macOS
cd "C:\Users\%USERNAME%\Dropbox\SLYFOX\ADMIN\WEBSITE\2025\sfweb"      # Windows
cd "~/Dropbox/SLYFOX/ADMIN/WEBSITE/2025/sfweb"                        # Linux

# Start development environment (ONLY correct method)
npm run docker:dev

# Start database admin interface
docker-compose --profile dev up adminer -d
```

### Access Points

- **Application**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Database Admin**: http://localhost:8080 (Adminer)

### Verification Steps

```bash
# Check containers are running
docker ps
# Expected: sfweb-app and sfweb-postgres

# Test API endpoints
curl http://localhost:3000/api/site-config | jq '.contact.business.name'
# Expected: Returns business name

# Check configuration persistence
docker exec sfweb-app ls -la /app/server/data/
# Expected: site-config-overrides.json exists
```

### Development Workflow

```bash
# Daily development commands
npm run docker:dev              # Start development
docker-compose logs -f          # Monitor logs
docker-compose down             # Stop services

# Development tools
npm run check                   # TypeScript checking
docker exec -it sfweb-app sh    # Container shell access
```

### Cross-Platform Support

**File Synchronization:**
- Source code synced via Dropbox (~50MB)
- Docker images rebuilt locally per device
- Configuration persists in Docker volumes

**Apple Silicon (M1/M2/M3) Notes:**
- Automatic multi-platform container builds
- Longer initial build times expected
- All functionality identical to Intel Macs

## 🌐 Production Environment

### VPS Infrastructure

- **Server**: vps.netfox.co.za (168.231.86.89)
- **OS**: Ubuntu 24.04 LTS
- **Resources**: 3.8GB RAM, 1 CPU core, 48GB storage
- **Provider**: Hostinger

### Production Services

| Service | Container | Port | Status |
|---------|-----------|------|--------|
| **SlyFox App** | `sfweb-app` | 3000 | ✅ Active |
| **PostgreSQL** | `sfweb-postgres` | 5432 | ✅ Active |
| **Traefik** | `traefik` | 80/443 | ✅ Active |
| **N8N** | `n8n` | 5678 | ✅ Active |

### Automated Deployment (Recommended)

**⚠️ MANDATORY: Always use the automated deployment script for production deployments.**

```bash
# Run from local development environment
./deploy-production.sh
```

## 🚀 Production Deployment Process (FOLLOW EXACTLY)

### Pre-Deployment Checklist (MANDATORY)

**✅ Step 1: Verify SSH Access**
```bash
ssh slyfox-vps "echo 'Connection verified'"
# Must return: Connection verified
```

**✅ Step 2: Check Local Environment**
```bash
# Ensure development server is running locally first
npm run docker:dev
curl http://localhost:3000 | head -50
# Must return HTML content (not errors)
```

**✅ Step 3: Commit All Changes**
```bash
git status
git add -A
git commit -m "Your deployment message"
```

### Automated Deployment (PREFERRED METHOD)

**⚠️ IMPORTANT: The script performs a COMPLETE REBUILD to prevent module errors**

```bash
./deploy-production.sh
```

**What the script does:**
1. ✅ Verifies SSH connection to VPS (prevents auth failures)
2. 🛑 Stops existing production containers gracefully  
3. 📦 Backs up current configuration with timestamp
4. 🔄 Syncs complete codebase to VPS (excludes build artifacts)
5. 🏗️ **REBUILDS containers from scratch** (prevents ERR_MODULE_NOT_FOUND)
6. ⚙️ Starts production services with fresh dependencies
7. 🔬 Verifies configuration persistence is working
8. 🌐 Tests all API endpoints
9. 📊 Reports production status

**Expected Output Signs of Success:**
- "VPS Connection OK" 
- "✅ Production services stopped"
- "✅ Configuration backup completed" 
- "Transfer starting: XXX files" (rsync progress)
- Container build logs with npm install
- "Container sfweb-app Started"
- "Container sfweb-postgres Started"

### Post-Deployment Verification (MANDATORY)

**✅ Step 1: Test Application Response**
```bash
curl -s -o /dev/null -w '%{http_code}' http://168.231.86.89:3000
# Expected: 200 (not 500)
```

**✅ Step 2: Verify Containers**
```bash
ssh slyfox-vps "cd /opt/sfweb && docker compose ps"
# Expected: Both sfweb-app and sfweb-postgres showing "Up"
```

**✅ Step 3: Check Application Logs**
```bash
ssh slyfox-vps "cd /opt/sfweb && docker compose logs app --tail 5"
# Expected: "express serving on port 5000"
# Not expected: ERR_MODULE_NOT_FOUND errors
```

**✅ Step 4: Test Key API Endpoints**
```bash
curl -s http://168.231.86.89:3000/api/site-config | jq '.contact.business.name'
# Expected: Returns business name (not error message)
```

**✅ Step 5: Visual Verification**
Visit in browser:
- **Main Site**: http://168.231.86.89:3000 (should load completely)
- **Admin Panel**: http://168.231.86.89:3000/admin (should show admin interface)
- **Site Management**: Admin Panel → Site Management tab (should show controls)

**🚨 If ANY verification step fails, see Troubleshooting section below**

### Production Access Points

- **Main Site**: http://168.231.86.89:3000
- **Admin Panel**: http://168.231.86.89:3000/admin
- **Site Management**: Admin Panel → Site Management tab
- **N8N Automation**: http://168.231.86.89:5678

### SSH Access Setup (CRITICAL - DO THIS FIRST)

**⚠️ MANDATORY: Complete SSH setup before attempting deployment**

#### Step 1: Create SSH Directory
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

#### Step 2: Create SSH Configuration
```bash
cat > ~/.ssh/config << 'EOF'
Host slyfox-vps
    HostName 168.231.86.89
    User root
    IdentityFile ~/.ssh/vps_key
    StrictHostKeyChecking no
EOF

chmod 600 ~/.ssh/config
```

#### Step 3: Verify SSH Key Exists
```bash
# Check if you have the VPS key (from previous setup)
ls -la ~/.ssh/vps_key

# If key doesn't exist, you need to use the existing key that matches
# the claude-deploy key configured in Hostinger control panel
```

#### Step 4: Test SSH Connection (MANDATORY VERIFICATION)
```bash
ssh slyfox-vps "echo 'SSH Connection successful'"
# Expected output: SSH Connection successful

# If connection fails, check:
# 1. ~/.ssh/vps_key exists and has correct permissions (chmod 600)
# 2. Public key matches the one in Hostinger control panel (claude-deploy)
# 3. VPS IP address is correct (168.231.86.89)
```

**🚨 DO NOT PROCEED WITH DEPLOYMENT UNTIL SSH CONNECTION WORKS**

**Note**: The SSH key is pre-configured in Hostinger control panel as `claude-deploy`. The local private key must match this public key.

## 🔧 Configuration Persistence Architecture ⭐ **CRITICAL FOR DEPLOYMENTS**

### **Complete Configuration System Overview**

The SlyFox Studios website uses a comprehensive configuration management system that stores ALL admin dashboard settings in persistent files. Understanding this system is CRITICAL for successful deployments.

### **Configuration Storage Architecture**

| Environment | Primary Storage | Backup Storage | API Access | Persistence Method |
|-------------|----------------|-----------------|------------|-------------------|
| **Development** | `server/data/site-config-overrides.json` | Manual backups | `/api/site-config/bulk` (PATCH) | Direct file mount |
| **Production** | `config_data` volume → `/app/server/data/site-config-overrides.json` | Auto deployment backups | `/api/site-config/bulk` (PATCH) | Docker volume |

### **All Configuration Files in Production**

#### **PRIMARY CONFIGURATION STORAGE** ⭐
- **File**: `/app/server/data/site-config-overrides.json` (inside container)
- **Volume**: `config_data` Docker volume (persistent storage)
- **Contains**: ALL admin dashboard settings including:
  ```json
  {
    "contact": {
      "business": { "name", "phone", "email", "address", "whatsapp" },
      "methods": [ /* contact cards */ ],
      "hours": { "monday-sunday" },
      "responseTimes": { "email", "whatsapp", "phone" },
      "serviceAreas": { "primary", "extended", "destination" },
      "emergency": { "title", "subtitle", "contacts" }
    },
    "home": {
      "hero": { "slides": [ /* hero slides */ ] },
      "servicesOverview": { /* services section */ },
      "testimonials": { "items": [ /* testimonials */ ] },
      "privateGallery": { /* private gallery section */ }
    },
    "about": {
      "hero": { /* about stats */ },
      "story": { /* paragraphs */ },
      "values": { /* values array */ },
      "team": { "members": [ /* team profiles */ ] },
      "cta": { /* call-to-action */ }
    },
    "portfolio": { "featured": { /* portfolio settings */ } },
    "categoryPages": {
      "photography": {
        "weddings": { /* complete wedding page */ },
        "corporate": { /* complete corporate page */ },
        "portraits": { /* complete portraits page */ },
        "events": { /* complete events page */ },
        "products": { /* complete products page */ },
        "graduation": { /* complete graduation page */ }
      }
    },
    "gradients": {
      "services": { /* colors */ },
      "testimonials": { /* colors */ },
      "contact": { /* colors */ },
      "privateGallery": { /* colors */ },
      "portfolio": { /* colors */ }
    }
  }
  ```

#### **FALLBACK CONFIGURATION FILES**
- **File**: `/shared/types/category-config.ts`
- **Purpose**: Default content when no admin settings exist
- **Critical Issue**: Contains "Cape Town" references instead of "Durban"
- **Used By**: Category pages (photography/videography) when no saved data

#### **DEPLOYMENT BACKUP FILES**
- **Pattern**: `/opt/sfweb-backup-YYYYMMDD-HHMMSS/site-config-overrides.json`
- **Created By**: `deploy-production.sh` script automatically
- **Purpose**: Recovery point before each deployment

### **All Admin Dashboard Components → Configuration Mappings**

| Admin Component | Config File Path | Admin UI Location | Target Pages |
|----------------|------------------|-------------------|--------------|
| **HomepageSettings** | `home.*` | Admin → Site Management → Homepage | Homepage sections |
| **ContactSettings** | `contact.*` | Admin → Site Management → Contact | Contact page + homepage contact |
| **AboutSettings** | `about.*` | Admin → Site Management → About | About page sections |
| **PortfolioSettings** | `portfolio.featured` | Admin → Site Management → Portfolio | Homepage portfolio section |
| **CategoryPageSettings** | `categoryPages.photography.*` | Admin → Photography Page Settings | `/photography/*` pages |
| **GradientPickers** | `gradients.*` | All admin components | Section background colors |

### **Site Management Features That Persist**

**✅ FULL PERSISTENCE (Survives Deployments):**
- **Homepage Settings**: Hero slides with images, titles, subtitles, CTAs
- **Services Section**: Headlines, descriptions, service cards, colors
- **Testimonials**: Customer reviews, ratings, names, photos, colors
- **Private Gallery**: Section content, features, buttons, colors
- **Contact Information**: Business name, phone, email, address, WhatsApp
- **Contact Methods**: Contact cards with icons, details, actions
- **Business Hours**: Complete schedule with display formatting
- **Response Times**: Email, WhatsApp, phone response expectations
- **Service Areas**: Primary, extended, destination service areas
- **Emergency Contacts**: Title, subtitle, all contact numbers
- **About Page**: Hero stats, story paragraphs, values, team profiles, CTA
- **Photography Categories**: Complete content for weddings, corporate, portraits, events, products, graduation
- **Portfolio Settings**: Featured gallery layout, colors, spacing
- **Section Colors**: Background gradients and text colors for all sections

**✅ REAL-TIME UPDATES**: All changes reflect immediately on live website
**✅ DEPLOYMENT SURVIVAL**: Settings persist through container rebuilds and deployments

### **Configuration Sync Between Environments**

#### **Development → Production Sync Process**
```bash
# 1. Backup production config
curl -s http://168.231.86.89:3000/api/site-config > /tmp/production-backup.json

# 2. Get development config
curl -s http://localhost:3000/api/site-config > /tmp/dev-config.json

# 3. Push development config to production
curl -X PATCH http://168.231.86.89:3000/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d @/tmp/dev-config.json

# 4. Verify sync success
curl -s http://168.231.86.89:3000/api/site-config | jq '.contact.business.phone'
```

#### **Configuration Drift Detection**
```bash
# Compare contact info (common drift area)
echo "=== DEVELOPMENT ===" && curl -s http://localhost:3000/api/site-config | jq '.contact.business.phone,.contact.business.address.displayText'
echo "=== PRODUCTION ===" && curl -s http://168.231.86.89:3000/api/site-config | jq '.contact.business.phone,.contact.business.address.displayText'

# Compare homepage hero slides count
echo "DEV Hero Slides:" && curl -s http://localhost:3000/api/site-config | jq '.home.hero.slides | length'
echo "PROD Hero Slides:" && curl -s http://168.231.86.89:3000/api/site-config | jq '.home.hero.slides | length'
```

### **Configuration Loss Prevention** 🚨 **CRITICAL**

#### **Why Configuration Loss Happens**
1. **Nuclear deployment** with `-v` flag wipes Docker volumes
2. **Development/Production drift** - environments get out of sync
3. **Failed deployments** that corrupt configuration files
4. **Manual changes** that aren't properly backed up

#### **MANDATORY Configuration Backup During Deployments**
The `deploy-production.sh` script automatically:
1. **Backs up existing config** before any changes
2. **Preserves config volume** during normal deployments  
3. **Provides recovery commands** if nuclear option needed

#### **Emergency Recovery Process**
```bash
# If admin dashboard shows defaults instead of custom content:

# Step 1: Check if config file exists
ssh slyfox-vps "docker exec sfweb-app ls -la /app/server/data/"

# Step 2: If missing, restore from backup
ssh slyfox-vps "cp /opt/sfweb-backup-[LATEST]/site-config-overrides.json /opt/sfweb/server/data/"

# Step 3: If backup also missing, restore from development
curl -s http://localhost:3000/api/site-config > /tmp/dev-config.json
curl -X PATCH http://168.231.86.89:3000/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d @/tmp/dev-config.json

# Step 4: Verify recovery
curl -s http://168.231.86.89:3000/api/site-config | jq '.contact.business.name'
```

## 🚨 If Deployment Fails (FIRST AID)

### **Image Loading Issues (TESTED 2025-09-01)**

**⚠️ COMMON ISSUE**: Images appear broken/missing on live site after deployment

**Symptoms**:
- Site loads but images show as broken/dark placeholders
- Service cards, logos, or hero images not displaying
- Browser returns HTTP 500 for image URLs
- Application logs show: `Error: EACCES: permission denied, open '/app/public/images/...`

**Quick Fix (30 seconds)**:
```bash
# Fix file permissions on all public assets
ssh slyfox-vps "chmod -R 755 /opt/sfweb/public/"

# Verify fix worked
curl -s -o /dev/null -w '%{http_code}' https://slyfox.co.za/images/logos/slyfox-logo-black.png
# Expected: 200
```

**Root Cause**: Files deployed with restrictive permissions (600) that Docker container cannot read, even though files exist in mounted volume.

**Prevention**: Always verify public assets have correct permissions after deployment.

---

### **Module Import Errors**

**Most Common Issue**: ERR_MODULE_NOT_FOUND (Node modules corruption)

**Symptoms**: 
- Application returns HTTP 500 instead of 200
- Logs show: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/node_modules/vite/dist/node/...`

**🚨 EMERGENCY ONLY - NUCLEAR OPTION (LIVE SITE WILL BE DOWN):**

**⚠️ CRITICAL WARNING: This BREAKS LIVE SITE for 3-5 minutes - Only use if site is already broken**

```bash
# ⚠️ BACKUP FIRST - THIS WIPES ALL DATA
curl -s https://slyfox.co.za/api/site-config > /tmp/nuclear-backup-$(date +%Y%m%d-%H%M%S).json

# 🚨 NUCLEAR OPTION - COMPLETE DESTRUCTION AND REBUILD
ssh slyfox-vps "cd /opt/sfweb && docker compose down -v"  # ⚠️ WIPES VOLUMES
ssh slyfox-vps "docker system prune -a -f"               # ⚠️ WIPES CACHE

# Rebuild from scratch 
ssh slyfox-vps "cd /opt/sfweb && docker compose up -d --build"

# IMMEDIATE configuration recovery
curl -X PATCH https://slyfox.co.za/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d @/tmp/nuclear-backup-*.json

# Verify fix
curl -s -o /dev/null -w '%{http_code}' https://slyfox.co.za
# Expected: 200
```

**💥 IMPACT**: 
- **LIVE SITE DOWN**: 3-5 minutes complete outage
- **DATA LOSS**: All volumes wiped (recovered from backup)
- **USER EXPERIENCE**: Visitors see connection errors

**Why This Works**: 
- Completely removes corrupted Docker cache
- Rebuilds all dependencies from scratch  
- Prevents incremental build conflicts

**⏱️ Downtime**: 3-5 minutes COMPLETE SITE OUTAGE

**🚨 ONLY USE WHEN**: Site already completely broken (returns 500/no response)

---

## 🚨 Detailed Troubleshooting

### Development Issues

#### Port Conflicts
```bash
# Find conflicting processes
lsof -i :3000 :5432 :8080
kill -9 <PID>

# Stop and restart
docker-compose down
npm run docker:dev
```

#### Configuration Not Persisting
```bash
# Check volume mount
docker volume ls | grep config_data
docker exec sfweb-app ls -la /app/server/data/

# Reset if needed
docker volume rm sfweb_config_data
npm run docker:dev
```

#### Complete Reset
```bash
# Nuclear option
docker-compose down -v
docker system prune -a -f
npm run docker:dev
```

### Production Issues

#### Deployment Failures
```bash
# Check deployment logs
./deploy-production.sh

# Manual container check
ssh slyfox-vps "cd /opt/sfweb && docker-compose logs --tail=50"

# Manual restart
ssh slyfox-vps "cd /opt/sfweb && docker-compose down && docker-compose up -d --build"
```

#### Configuration Problems
```bash
# Test API endpoints
curl http://168.231.86.89:3000/api/site-config | jq

# Check container file system
ssh slyfox-vps "docker exec sfweb-app ls -la /app/server/data/"

# Verify volume mount
ssh slyfox-vps "docker inspect sfweb-app | grep -A 10 Mounts"
```

#### Database Connection Issues
```bash
# Check PostgreSQL
ssh slyfox-vps "docker exec sfweb-postgres pg_isready -U postgres"

# Test connectivity
ssh slyfox-vps "docker exec sfweb-app nc -z postgres 5432"

# Database logs
ssh slyfox-vps "cd /opt/sfweb && docker-compose logs sfweb-postgres"
```

### Emergency Recovery

#### Production Rollback
```bash
# Stop current deployment
ssh slyfox-vps "cd /opt/sfweb && docker-compose down"

# Restore from backup
ssh slyfox-vps "cp /opt/sfweb-backup-[DATE]/site-config-overrides.json /opt/sfweb/server/data/"

# Restart
ssh slyfox-vps "cd /opt/sfweb && docker-compose up -d --build"
```

#### Configuration Recovery
```bash
# Restore configuration backup
BACKUP_DIR="/opt/sfweb-backup-[TIMESTAMP]"
ssh slyfox-vps "cp $BACKUP_DIR/site-config-overrides.json /opt/sfweb/server/data/"

# Manual configuration export
curl -s http://168.231.86.89:3000/api/site-config > "prod-config-backup.json"
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Application status
curl -I http://168.231.86.89:3000
# Expected: HTTP/1.1 200 OK

# Container status
ssh slyfox-vps "docker ps"
ssh slyfox-vps "docker stats --no-stream"

# Resource monitoring
ssh slyfox-vps "free -h && df -h"
```

### Log Management

```bash
# Application logs
ssh slyfox-vps "cd /opt/sfweb && docker-compose logs sfweb-app --tail=50"

# Real-time monitoring
ssh slyfox-vps "cd /opt/sfweb && docker-compose logs -f"

# Database logs
ssh slyfox-vps "cd /opt/sfweb && docker-compose logs sfweb-postgres"
```

### Backup Strategy

```bash
# Database backup
ssh slyfox-vps "docker exec sfweb-postgres pg_dump -U postgres slyfox_studios > backup_$(date +%Y%m%d).sql"

# Configuration backup
ssh slyfox-vps "docker exec sfweb-app cat /app/server/data/site-config-overrides.json" > "config-backup-$(date +%Y%m%d).json"

# Full application backup
ssh slyfox-vps "tar -czf sfweb_backup_$(date +%Y%m%d).tar.gz /opt/sfweb/"
```

## 📋 Deployment Checklists

### Pre-Deployment Checklist

- [ ] **Development Environment**
  - [ ] Local app running: `npm run docker:dev`
  - [ ] Tests passing: `npm run check`
  - [ ] Configuration changes tested locally
  - [ ] Dropbox sync completed

- [ ] **Production Preparation**
  - [ ] SSH access verified: `ssh slyfox-vps "echo 'Connected'"`
  - [ ] No critical processes running on production
  - [ ] Recent backup exists (automatic with deployment script)

### Deployment Execution

- [ ] **Automated Deployment**
  - [ ] Run deployment script: `./deploy-production.sh`
  - [ ] Monitor script output for errors
  - [ ] Verify all verification steps pass
  - [ ] Check final status report

- [ ] **Manual Verification**
  - [ ] Application accessible: http://168.231.86.89:3000
  - [ ] Admin panel accessible: http://168.231.86.89:3000/admin
  - [ ] Site management functional
  - [ ] Configuration changes persist after restart

### Post-Deployment Verification

- [ ] **Functionality Tests**
  - [ ] Main site loads correctly
  - [ ] Admin panel accessible
  - [ ] Site management changes save and persist
  - [ ] Database connectivity confirmed
  - [ ] Resource usage within normal limits

- [ ] **Success Criteria**
  - [ ] Application returns HTTP 200
  - [ ] API endpoints respond correctly
  - [ ] Site management changes persist after container restart
  - [ ] System using <50% of available resources

## 🎯 Environment Comparison

| Aspect | Development | Production |
|--------|-------------|------------|
| **Location** | Local (Dropbox synced) | VPS (/opt/sfweb) |
| **Access** | http://localhost:3000 | http://168.231.86.89:3000 |
| **Database** | Local PostgreSQL | VPS PostgreSQL |
| **SSL** | None | Traefik + Let's Encrypt |
| **Environment** | .env (local) | .env (production) |
| **Hot Reload** | Enabled | Disabled |
| **Persistence** | Direct file mount | Docker volume |
| **Deployment** | `npm run docker:dev` | `./deploy-production.sh` |

## 🔗 Related Documentation

- **[DEV_SERVER_STARTUP.md](./DEV_SERVER_STARTUP.md)** - Detailed development setup
- **[VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md)** - Complete production guide
- **[CLAUDE.md](./CLAUDE.md)** - Architecture overview and guidelines
- **[SITE_MANAGEMENT_GUIDE.md](./SITE_MANAGEMENT_GUIDE.md)** - Site management system details

---

## Quick Commands Reference

### Development
```bash
npm run docker:dev                    # Start development
docker-compose --profile dev up adminer -d  # Database admin
docker-compose down                   # Stop services
npm run check                        # Type checking
```

### Production
```bash
./deploy-production.sh               # Deploy to production
ssh slyfox-vps "cd /opt/sfweb && docker-compose ps"  # Status
curl http://168.231.86.89:3000/api/site-config | jq  # Test API
```

### Monitoring
```bash
ssh slyfox-vps "docker stats --no-stream"  # Resource usage
ssh slyfox-vps "cd /opt/sfweb && docker-compose logs -f"  # Logs
curl -I http://168.231.86.89:3000     # Health check
```

---

*This guide ensures reliable deployments across all environments with full configuration persistence and professional monitoring capabilities.*