# Development Server Startup Guide

Quick reference for starting the SlyFox Studios development environment on any device.

## 🤖 Development Resources

**Specialized Agents Available**: 8 specialist agents in root directory (auth, backend, css, database, frontend, gallery, seo, meta-updater) - use proactively via Task tool for domain-specific work. See CLAUDE.md for details.

**Key Documentation**: 
- `CLAUDE.md` - Primary development rules and agent usage
- `CSS_REFERENCE.md` - Complete styling and design system guide
- `SITE_MANAGEMENT_ARCHITECTURE.md` - Site configuration system implementation
- `site-management-specialist.md` - Specialist agent for site content governance

## 🚀 Quick Start Commands

### Primary Development Server (Recommended)

```bash
# Start full Docker development environment
npm run docker:dev

# Start Adminer database admin interface (separate step required)
docker-compose --profile dev up adminer -d
```

**What this does:**
- Starts PostgreSQL database
- Starts SlyFox Studios app with hot reload
- Automatically rebuilds containers if needed
- **Note**: Adminer requires separate command due to dev profile configuration

**Access URLs:**
- **App**: http://localhost:3000
- **Database Admin**: http://localhost:8080 (after running Adminer command)
- **PostgreSQL**: localhost:5432

### Alternative Startup Methods

```bash
# Start only database services
npm run docker:db

# Start app directly (without Docker)
npm run dev

# Start production build locally
npm run build
npm run start
```

## 📂 File Structure & Storage Configuration

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
Docker Volumes:                             # ~48MB (postgres data)
Docker Build Cache:                         # 0MB (after cleanup)

# Application Build Artifacts (auto-generated)
sfweb/node_modules/                         # ~344MB (excluded from Dropbox)
sfweb/dist/                                 # Build output (excluded from Dropbox)
sfweb/.npm-cache/                           # NPM cache (excluded from Dropbox)
```

### Storage Space Requirements

**Per Device:**
- **Dropbox Project Folder**: ~50MB (source code only)
- **Docker Overhead**: ~422MB (images + volumes)  
- **Node Dependencies**: ~344MB (auto-downloaded)
- **IDE Configuration**: ~255MB (Windsurf)
- **Total Local Storage**: ~1.1GB per device

**Cross-Device Efficiency:**
- Only source code syncs via Dropbox (~50MB)
- Large dependencies (node_modules, Docker images) rebuilt locally
- No unnecessary file transfer between devices

### Windsurf IDE Configuration Backup

Since Windsurf settings are local-only, here's how to backup/restore:

```bash
# Backup Windsurf settings (optional)
cp -r ~/Library/Application\ Support/Windsurf/User ~/Desktop/windsurf-backup-$(date +%Y%m%d)

# Restore on new device (if needed)
cp -r ~/Desktop/windsurf-backup-*/User/* ~/Library/Application\ Support/Windsurf/User/
```

### Git Repository Structure

The project is also version-controlled via Git:
- **Remote**: https://github.com/fatthwacka/sfweb.git
- **Local**: `.git/` folder within Dropbox (synced)
- **Benefits**: Git history available on all devices without separate clones

### Docker Storage Optimization

Regular cleanup to maintain lean local storage:

```bash
# Check current Docker storage usage
docker system df

# Clean unused images, volumes, and cache (recommended monthly)
docker system prune -a -f
docker volume prune -f

# Expected storage after cleanup:
# Images: ~374MB (only Adminer + built containers)
# Volumes: ~48MB (postgres data only)
# Build Cache: 0MB (cleared)
```

**Configure Docker Desktop Storage Limits:**
1. Open Docker Desktop → Settings → Resources
2. Set "Disk image size" to 20-30GB (sufficient for this project)
3. Enable "Use gRPC FUSE for file sharing" for better macOS performance

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
- No special configuration required - just ensure Docker Desktop is updated

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

## 🔄 First-Time Device Setup

### Complete Setup Workflow

```bash
# 1. Clone from GitHub (if not using Dropbox sync)
git clone https://github.com/fatthwacka/sfweb.git
cd sfweb

# 2. Verify all required files are present
ls -la

# 3. Check Docker is running
docker ps

# 4. Start development environment
npm run docker:dev

# 5. Wait for startup messages:
# "PostgreSQL Database directory appears to contain a database"
# "express serving on port 5000"

# 6. Start Adminer for database management
docker-compose --profile dev up adminer -d

# 7. Test the application
curl -I http://localhost:3000
# Should return: HTTP/1.1 200 OK

# 8. Test database admin interface
curl -I http://localhost:8080
# Should return: HTTP/1.1 200 OK
```

### 🚨 First-Time Troubleshooting

**If containers fail to start:**

```bash
# Clean Docker environment
npm run docker:clean

# Rebuild from scratch
npm run docker:dev
```

**If port conflicts occur:**

```bash
# Check what's using ports
lsof -i :3000
lsof -i :5432
lsof -i :8080

# Option 1: Stop conflicting services
sudo service nginx stop  # if nginx is running
sudo service postgresql stop  # if local postgres is running

# Option 2: Use alternative ports (recommended)
cp docker-compose.override.yml.example docker-compose.override.yml
# Edit docker-compose.override.yml to change ports
# Example: Change 3000:5000 to 3001:5000
nano docker-compose.override.yml

# Then start with custom ports
npm run docker:dev
```

**Port Conflict Solutions:**

Create `docker-compose.override.yml` with alternative ports:

```yaml
version: "3.7"
services:
  postgres:
    ports:
      - "5433:5432"  # Use 5433 instead of 5432
  app:
    ports:
      - "3001:5000"  # Use 3001 instead of 3000
  adminer:
    ports:
      - "8081:8080"  # Use 8081 instead of 8080
```

**Access URLs with custom ports:**
- App: http://localhost:3001
- Database Admin: http://localhost:8081
- PostgreSQL: localhost:5433

**If Dropbox sync issues:**

```bash
# Force Dropbox sync (macOS)
killall Dropbox && open -a Dropbox

# Check sync status
# Look for green checkmarks on files in Finder/Explorer
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

# Test database connection
docker-compose exec postgres pg_isready -U postgres
# Expected: accepting connections

# View application logs
npm run docker:logs
```

### ✅ Development Features Verification

- **Hot Reload**: Edit a file and check browser auto-refreshes
- **Database**: Access http://localhost:8080 (Adminer)
- **API Endpoints**: Test API routes work correctly
- **TypeScript**: Check `npm run check` passes

## 🛠️ Development Workflow Commands

### Daily Development

```bash
# Start development (most common)
npm run docker:dev

# View logs while developing
npm run docker:logs

# Stop development environment
npm run docker:down

# Quick restart
npm run docker:down && npm run docker:dev
```

### Development Tools

```bash
# Type checking
npm run check

# Database operations
npm run db:push

# Access container shell
npm run docker:shell

# View only database logs
docker-compose logs postgres -f
```

### Code Synchronization

```bash
# Commit and push changes
npm run deploy:commit

# Pull latest changes
git pull origin main

# Push to production (after testing locally)
npm run deploy:vps
```

## 🔧 Platform-Specific Notes

### macOS Considerations

- **Docker Desktop**: Ensure adequate memory allocation (4GB+) 
- **File Permissions**: Docker volume mounting works seamlessly
- **Apple Silicon (M1/M2/M3)**: Multi-platform builds handle ARM64 automatically
  - Initial builds take 2-3x longer than Intel Macs
  - No performance impact once containers are built
  - Docker Desktop 4.0+ required for optimal Apple Silicon support

### Windows Considerations

- **WSL2**: Recommended for better Docker performance
- **Path Separators**: Use forward slashes in Docker paths
- **Line Endings**: Git should handle CRLF→LF conversion

### Linux Considerations

- **Docker Permissions**: May need `sudo` for Docker commands
- **systemd**: Ensure Docker service is enabled and started
- **Firewall**: Check local firewall allows Docker ports

## 📱 Device Switching Workflow

### When Moving Between Devices

1. **Ensure current work is saved**
   ```bash
   npm run deploy:commit
   ```

2. **Stop development on current device**
   ```bash
   npm run docker:down
   ```

3. **On new device (after Dropbox sync)**
   ```bash
   cd /path/to/sfweb
   npm run docker:dev
   ```

4. **Verify everything works**
   ```bash
   curl -I http://localhost:3000
   npm run check
   ```

## 🆘 Emergency Recovery

### If Everything Breaks

```bash
# Nuclear option - clean everything
npm run docker:clean
docker system prune -a -f

# Restart Docker Desktop
# Then rebuild from scratch
npm run docker:dev
```

### If Database Issues

```bash
# Reset database
docker volume rm sfweb_postgres_data
npm run docker:dev
npm run db:push
```

### If Git Issues

```bash
# Reset to last known good state
git status
git stash  # save local changes
git pull origin main
git stash pop  # restore local changes if needed
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

### Common Alternative Port Configurations

**Configuration A (Development Server Running):**
```yaml
# Use if you have another dev server on 3000
services:
  app:
    ports:
      - "3001:5000"
```

**Configuration B (Local PostgreSQL Running):**
```yaml
# Use if you have local PostgreSQL on 5432
services:
  postgres:
    ports:
      - "5433:5432"
```

**Configuration C (Full Alternative Ports):**
```yaml
# Use if multiple services conflict
services:
  postgres:
    ports:
      - "15432:5432"
  app:
    ports:
      - "13000:5000"
  adminer:
    ports:
      - "18080:8080"
```

## ✅ Complete Tested Startup Sequence

**Verified on ARM-based Apple Silicon (M1/M2/M3 Macs):**

```bash
# 1. Ensure Docker Desktop is running
docker --version

# 2. Start main development environment
npm run docker:dev
# Wait for: "express serving on port 5000" message

# 3. Start database admin interface
docker-compose --profile dev up adminer -d

# 4. Verify all services are running
docker ps
# Expected: sfweb-app, sfweb-postgres, sfweb-adminer

# 5. Test application accessibility
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

curl -I http://localhost:8080  
# Expected: HTTP/1.1 200 OK (Adminer interface)
```

**Build Times (Apple Silicon):**
- First build: ~3-5 minutes (npm install + Docker build)
- Subsequent starts: ~30 seconds
- Adminer start: ~10 seconds

## 📋 Quick Reference

**Essential Commands:**
- Start: `npm run docker:dev`
- Start Database Admin: `docker-compose --profile dev up adminer -d`
- Stop: `npm run docker:down`
- Logs: `npm run docker:logs`
- Test: `curl -I http://localhost:3000`
- Clean: `npm run docker:clean`
- Port conflicts: `cp docker-compose.override.yml.example docker-compose.override.yml`

**Default URLs:**
- App: http://localhost:3000
- Database Admin: http://localhost:8080 (after starting Adminer)
- Production: http://168.231.86.89:3000

**Default Ports:**
- App: 3000 → 5000 (container)
- PostgreSQL: 5432
- Adminer: 8080

**Alternative URLs (if using overrides):**
- Check your `docker-compose.override.yml` for actual ports
- App: http://localhost:[YOUR_APP_PORT]
- Database Admin: http://localhost:[YOUR_ADMINER_PORT]

---

*This guide ensures you can start development immediately on any device, anywhere!*