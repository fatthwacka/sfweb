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

**Access URLs:**
- **Application**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Site Management**: http://localhost:3000/admin → Site Management tab
- **Database Admin**: http://localhost:8080 (if Adminer started)

## ✅ Verification Steps

After startup, verify everything is working:

```bash
# Check containers are running
docker ps

# Test API endpoints
curl http://localhost:3000/api/site-config | jq '.contact.business.name'

# Check configuration persistence
ls -la server/data/site-config-overrides.json
```

**Expected Output:**
- Containers: `sfweb-app` and `sfweb-postgres` running
- API returns: `"SlyFox Studio Group"` (or your custom name)
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
- Expect 2-3x longer initial build times compared to Intel Macs
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

# 5. Wait for containers to build and start
# Look for: "express serving on port 5000"
# Look for: "🔄 Loaded config overrides from disk"

# 6. Start Adminer for database management
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

- **Hot Reload**: Edit a file and check browser auto-refreshes
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

# Database operations
npm run db:push

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
npm run db:push            # Push schema changes (inside container)

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
npm run db:push
```

## 📋 Complete Setup Verification

**Verified working configuration:**

```bash
# 1. Start development environment
npm run docker:dev
# Wait for: "🔄 Loaded config overrides from disk"

# 2. Test application
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