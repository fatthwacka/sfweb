# SlyFox Studios - Development Server Startup Guide

Complete guide for starting the development server across different environments and devices with the latest configuration persistence fixes.

## 🚀 Quick Start (All Platforms)

**⚠️ MANDATORY: Always use Docker for development - ensures consistent environment and configuration persistence.**

```bash
# Start development environment with config persistence (ONLY correct method)
npm run docker:dev

# Optional: Start Adminer database interface
docker-compose --profile dev up adminer -d
```

**🔧 Development Environment Details:**
- Runs with `NODE_ENV=development` for hot reloading
- Uses Vite dev server for frontend with HMR (Hot Module Replacement)
- TypeScript files are executed directly with `tsx`
- Changes to code are reflected immediately without rebuilding
- Configuration saves persist across restarts via Docker volumes

**Access URLs:**
- **Application**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Site Management**: http://localhost:3000/admin → Site Management tab
- **Database Admin**: http://localhost:8080 (if Adminer started)

## ⏱️ What to Expect During Startup

**Total Time**: 3-4 minutes (first run) | 30-60 seconds (cached)

### Startup Timeline

```
Phase 1: Docker Build (2-3 minutes on first run)
├─ Loading base image (node:20-alpine)
├─ Installing system dependencies
├─ npm install (600 packages) ← LONGEST STEP
├─ Copying application files
└─ Exporting Docker image

Phase 2: Express Server Startup (5-10 seconds)
├─ Container starts
├─ Database connection verified
├─ Routes registered
├─ Config overrides loaded
└─ ✅ "express serving on port 5000" ← SERVER READY

Phase 3: Vite Integration (1-2 minutes, SILENT)
├─ Vite middleware initializes
├─ Frontend build preparation
├─ No visible output (NORMAL BEHAVIOR)
└─ First [vite] warnings appear when ready

Phase 4: Fully Ready
├─ ✅ Backend API: Ready at Phase 2
├─ ✅ Frontend pages: Ready at Phase 2
└─ ✅ Hot Module Reload: Ready at Phase 3
```

### When Is the Server Ready?

**Quick Answer**: As soon as you see `"express serving on port 5000"`

**Details**:
- ✅ **API & Backend**: Ready immediately when Express starts
- ✅ **Frontend Pages**: Accessible immediately via http://localhost:3000
- ⏳ **Hot Module Reload (HMR)**: Takes additional 1-2 minutes (Vite initialization)
- 💡 **Tip**: Don't wait for Vite messages - start testing immediately!

### Expected Log Messages

**✅ Key Success Indicators:**

1. **Docker Build Complete**:
   ```
   #10 DONE 124.4s
   #11 DONE 2.6s
   #12 DONE 19.7s
   ```

2. **Express Server Ready** (most important):
   ```
   sfweb-app  | 11:38:32 AM [express] serving on port 5000
   ```

3. **Configuration Loaded**:
   ```
   sfweb-app  | 🔄 Loaded config overrides from disk: [
   sfweb-app  |   'contact', 'home', 'portfolio', 'categoryPages', 'gradients', 'about'
   sfweb-app  | ]
   ```

4. **Vite Active** (appears 1-2 minutes later):
   ```
   sfweb-app  | 11:39:54 AM [vite] warning: ...
   ```

**⚠️ Silent Period After Express Starts:**
- Output may pause for 1-2 minutes after "express serving on port 5000"
- This silence is **NORMAL** - Vite is initializing as Express middleware
- Do NOT stop the process during this silent period
- Server is already accessible - verify with: `curl -I http://localhost:3000`

### Vite Integration Behavior

**Important**: Vite runs integrated into Express, not as a standalone server.

**What this means**:
- ❌ NO separate "Vite dev server running at..." message
- ❌ NO standalone Vite process in logs
- ✅ Vite initializes silently as Express middleware
- ✅ First Vite output appears 1-2 minutes after Express starts
- ✅ Usually shows as [vite] warnings or compilation messages
- ✅ HMR works once you see any [vite] log output

**Why the integration**:
- Single server serves both frontend and backend (port 3000)
- Simplified development experience
- Vite proxies API requests to Express backend automatically
- Hot reload works seamlessly across full stack

## ✅ Verification Steps

After startup, verify everything is working:

```bash
# Check containers are running
docker ps

# Test API endpoints (works immediately after Express starts)
curl http://localhost:3000/api/site-config | jq '.contact.business.name'

# Test frontend (works immediately, no need to wait for Vite)
curl -I http://localhost:3000

# Check configuration persistence
ls -la server/data/site-config-overrides.json
```

**Expected Output:**
- Containers: `sfweb-app` and `sfweb-postgres` running
- API returns: `"SlyFox Studio Group"` (or your custom name)
- HTTP response: `HTTP/1.1 200 OK`
- Config file exists with your customizations

## ⚠️ Common Startup Issues & Solutions

### Docker Desktop Not Running
```
Error: Cannot connect to the Docker daemon
```
**Solution**: Start Docker Desktop and wait for "Engine running" status.

### Port Conflicts
```
Error: bind: address already in use
```
**Solution**:
```bash
# Stop all project containers
docker-compose down

# Find and kill conflicting processes
lsof -i :3000 :5432 :8080
kill -9 <PID>
```

### Startup Seems Stuck (Silent Period)
**Symptoms**: No output after "express serving on port 5000" for 1-2 minutes
**Solution**: This is NORMAL - Vite is initializing. Verify server is ready:
```bash
# Test if server responds (should work immediately)
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

# Check container is still running
docker ps | grep sfweb-app
```

### Config Changes Not Persisting
**Symptoms**: Admin changes don't save or revert on restart
**Solution**: Ensure config volume is mounted correctly:
```bash
docker volume ls | grep config_data
docker exec sfweb-app ls -la /app/server/data/
```

## 📂 File Structure & Storage Configuration

### Local Development Structure
```
Project Root (Dropbox Synced)
├── client/                    # React frontend
├── server/                    # Express.js backend
│   └── data/                 # Configuration persistence directory
│       └── site-config-overrides.json  # Site management settings
├── public/                   # Static assets
│   └── uploads/              # User uploaded images
├── docker-compose.yml        # Development container setup
├── deploy-production.sh      # Production deployment script
└── .env                      # Environment variables
```

### Configuration Persistence

The site management system now includes persistent configuration:

- **Development**: `server/data/` directory mounted directly
- **Production**: Docker volume `config_data` ensures persistence
- **Backup**: Configuration automatically backed up during deployments

### Dropbox vs Local Storage Overview

The SlyFox Studios project is designed for seamless cross-device development with strategic file placement:

**✅ Stored in Dropbox (synced across all devices):**
```
/Volumes/KLEANDOC/Origin Dropbox/SLYFOX/ADMIN/WEBSITE/2025/sfweb/
├── 📁 Complete application source code
├── 📁 client/                    # React frontend
├── 📁 server/                    # Express backend
├── 📁 shared/                    # TypeScript schemas
├── 📁 public/                    # Static assets
├── 📁 scripts/                   # Build scripts
├── 📄 .env                       # Environment variables
├── 📄 package.json               # Dependencies
├── 📄 docker-compose.yml         # Docker configuration
├── 📄 Dockerfile                 # Container definition
├── 📄 *.md                       # All documentation
├── 📄 .gitignore                 # Git exclusions
└── 📁 .git/                      # Git repository
```

**🖥️ Local-only (device-specific, NOT synced):**
```
# Development Tools & Caches
~/Library/Application Support/Windsurf/    # 255MB - IDE settings
~/Library/Caches/com.exafunction.windsurf  # 132KB - IDE cache

# Docker Storage (per device)
Docker Images:                              # ~374MB (after cleanup)
Docker Volumes:                             # ~48MB (postgres data + config_data)
Docker Build Cache:                         # 0MB (after cleanup)

# Application Build Artifacts (auto-generated)
sfweb/node_modules/                         # ~344MB (excluded from Dropbox)
sfweb/dist/                                 # Build output (excluded from Dropbox)
sfweb/.npm-cache/                           # NPM cache (excluded from Dropbox)
```

### Storage Space Requirements

**Per Device:**
- **Dropbox Project Folder**: ~50MB (source code only)
- **Docker Overhead**: ~422MB (images + volumes + config persistence)
- **Node Dependencies**: ~344MB (auto-downloaded)
- **IDE Configuration**: ~255MB (Windsurf)
- **Total Local Storage**: ~1.1GB per device

**Cross-Device Efficiency:**
- Only source code syncs via Dropbox (~50MB)
- Large dependencies (node_modules, Docker images) rebuilt locally
- Configuration persists via Docker volumes
- No unnecessary file transfer between devices

## 📱 Cross-Platform Device Setup

### Prerequisites (All Platforms)

1. **Docker Desktop** - Install and ensure it's running
2. **Node.js 20+** - For npm commands
3. **Dropbox** - Ensure project folder is synced
4. **Windsurf IDE** (optional) - Will need reconfiguration on new devices

### 🍎 macOS Setup (Intel & Apple Silicon)

**⚠️ Apple Silicon (M1/M2/M3) Note:**
- Docker multi-platform builds automatically handle ARM64 architecture
- Expect longer initial build times: 3-5 minutes vs 2-3 minutes on Intel
- Configuration persistence works identically across architectures

```bash
# 1. Ensure Dropbox sync is complete
# Check Dropbox menu bar icon for sync status

# 2. Navigate to project folder
cd "/Volumes/KLEANDOC/Origin Dropbox/SLYFOX/ADMIN/WEBSITE/2025/sfweb"
# or your specific Dropbox path (check Dropbox folder location)

# 3. Verify Docker is running
docker --version

# 4. Start development environment
npm run docker:dev

# 5. Wait for server ready message (2-4 minutes)
# Look for: "express serving on port 5000" ← SERVER IS READY
# Note: 1-2 minute silent period after this is normal (Vite initializing)

# 6. Verify server is accessible (optional)
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

# 7. Start Adminer for database management (optional)
docker-compose --profile dev up adminer -d
```

### 🪟 Windows Setup

```bash
# 1. Ensure Dropbox sync is complete
# Check Dropbox system tray icon

# 2. Navigate to project folder (PowerShell/CMD)
cd "C:\Users\%USERNAME%\Dropbox\SLYFOX\ADMIN\WEBSITE\2025\sfweb"
# or check your Dropbox folder location in Dropbox preferences

# 3. Verify Docker Desktop is running
docker --version

# 4. Start development environment
npm run docker:dev

# 5. Start Adminer for database management
docker-compose --profile dev up adminer -d
```

### 🐧 Linux Setup

```bash
# 1. Ensure Dropbox sync is complete
dropbox status

# 2. Navigate to project folder
cd "~/Dropbox/SLYFOX/ADMIN/WEBSITE/2025/sfweb"

# 3. Verify Docker is running
docker --version
sudo systemctl status docker

# 4. Start development environment
npm run docker:dev

# 5. Start Adminer for database management
docker-compose --profile dev up adminer -d
```

## 📊 Startup Verification Checklist

### ✅ Container Status Check

```bash
# Check all containers are running
docker ps

# Expected containers:
# sfweb-app        (port 3000:5000)
# sfweb-postgres   (port 5432:5432)
# sfweb-adminer    (port 8080:8080) [dev profile only]
```

### ✅ Application Health Check

```bash
# Test main application
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

# Test site configuration API
curl http://localhost:3000/api/site-config | jq '.contact.business.name'
# Expected: Returns your customized business name

# Test database connection
docker-compose exec postgres pg_isready -U postgres
# Expected: accepting connections

# Check configuration persistence
docker exec sfweb-app ls -la /app/server/data/
# Expected: site-config-overrides.json exists
```

### ✅ Development Features Verification

- **Hot Reload**: Edit a file and check browser auto-refreshes (after Vite is ready)
- **Database**: Access http://localhost:8080 (Adminer)
- **API Endpoints**: Test API routes work correctly
- **Site Management**: Access admin panel at http://localhost:3000/admin
- **Config Persistence**: Make changes in admin → check they persist after restart

## 🛠️ Development Workflow Commands

### Daily Development

```bash
# Start development (most common)
npm run docker:dev

# View logs while developing
docker-compose logs -f

# Stop development environment
docker-compose down

# Quick restart (preserves config)
docker-compose down && npm run docker:dev
```

### Configuration Management

```bash
# View current configuration
curl http://localhost:3000/api/site-config | jq

# Check saved configuration file
docker exec sfweb-app cat /app/server/data/site-config-overrides.json | jq

# Test configuration update
curl -X PATCH http://localhost:3000/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d '{"test": {"timestamp": "'$(date)'"}}' | jq

# Check configuration volume
docker volume inspect sfweb_config_data
```

### Development Tools

```bash
# Type checking
npm run check

# Database migrations - run SQL directly in Supabase SQL Editor
# See /migrations/ folder for SQL files

# Access container shell
docker exec -it sfweb-app sh

# View only database logs
docker-compose logs postgres -f
```

### Production Deployment

```bash
# Deploy to production VPS (requires SSH setup)
./deploy-production.sh

# Check production status
ssh slyfox-vps "cd /opt/sfweb && docker compose ps"

# View production logs
ssh slyfox-vps "cd /opt/sfweb && docker compose logs -f"
```

### Quick Reference Commands

```bash
# Essential development commands
npm run docker:dev          # Start development with config persistence
npm run check               # Type checking
docker-compose down         # Stop all containers
docker system prune -f      # Clean up Docker resources

# Configuration management
curl http://localhost:3000/api/site-config | jq    # View current config
docker exec sfweb-app cat /app/server/data/site-config-overrides.json  # View saved config

# Database management
docker exec -it sfweb-postgres psql -U postgres -d slyfox_studios
# Migrations: Run SQL files from /migrations/ in Supabase SQL Editor

# Production deployment
./deploy-production.sh     # Full production deployment with SSH
ssh slyfox-vps "cd /opt/sfweb && docker compose ps"  # Check production status

# Monitoring and debugging
docker logs sfweb-app      # View application logs
docker stats --no-stream  # Container resource usage
docker exec sfweb-app ls -la /app/server/data/  # Check config persistence
```

## 🔧 Port Customization

### Default Ports
- **App**: 3000 → 5000 (container)
- **PostgreSQL**: 5432
- **Adminer**: 8080

### If Ports Are Unavailable

1. **Copy override template:**
   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   ```

2. **Edit ports in override file:**
   ```bash
   nano docker-compose.override.yml
   ```

3. **Start with custom configuration:**
   ```bash
   npm run docker:dev
   ```

## 🆘 Emergency Recovery

### If Everything Breaks

```bash
# Nuclear option - clean everything
docker-compose down -v
docker system prune -a -f

# Restart Docker Desktop
# Then rebuild from scratch
npm run docker:dev
```

### If Configuration Issues

```bash
# Reset configuration volume
docker volume rm sfweb_config_data
npm run docker:dev

# Configuration will be recreated from defaults
```

### If Database Issues

```bash
# Reset database
docker volume rm sfweb_postgres_data
npm run docker:dev
# Then run migrations from /migrations/ in Supabase SQL Editor
```

## 📋 Complete Setup Verification

**Verified working configuration:**

```bash
# 1. Start development environment
npm run docker:dev
# Wait for: "express serving on port 5000" (2-4 minutes)
# Note: Silent period after this is normal

# 2. Test application (don't wait for Vite messages)
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

# 3. Test site management API
curl http://localhost:3000/api/site-config | jq '.contact.business.name'
# Expected: Returns business name

# 4. Test admin panel
# Navigate to: http://localhost:3000/admin
# Go to: Site Management → Homepage
# Make a change and verify it persists

# 5. Test configuration persistence
docker-compose restart app
# Wait 30 seconds, then check config is still there
curl http://localhost:3000/api/site-config | jq '.contact.business.name'
```

**Default URLs:**
- **App**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Database Admin**: http://localhost:8080 (after starting Adminer)
- **Production**: http://168.231.86.89:3000

---

*This guide ensures consistent development environment with persistent configuration across all devices and platforms.*
