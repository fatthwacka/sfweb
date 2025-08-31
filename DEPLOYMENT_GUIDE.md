# SlyFox Studios - Complete Deployment Guide

This comprehensive guide covers both development and production deployment for the SlyFox Studios photography website.

## 🚀 Quick Reference

| Environment | Command | Access | Purpose |
|-------------|---------|--------|---------|
| **Development** | `npm run docker:dev` | http://localhost:3000 | Local development with hot reload |
| **Production** | `./deploy-production.sh` | http://168.231.86.89:3000 | VPS deployment with persistence |

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

**What the script does:**
1. ✅ Verifies SSH connection to VPS
2. 🛑 Stops existing production containers gracefully
3. 📦 Backs up current configuration with timestamp
4. 🔄 Syncs complete codebase to VPS (excludes build artifacts)
5. 🏗️ Builds containers with configuration persistence fixes
6. ⚙️ Starts production services
7. 🔬 Verifies configuration persistence is working
8. 🌐 Tests all API endpoints
9. 📊 Reports production status

### Production Access

- **Main Site**: http://168.231.86.89:3000
- **Admin Panel**: http://168.231.86.89:3000/admin
- **Site Management**: Admin Panel → Site Management tab
- **N8N Automation**: http://168.231.86.89:5678

### SSH Access Configuration

The deployment script uses SSH key authentication:

```bash
# SSH configuration in ~/.ssh/config
Host slyfox-vps
    HostName 168.231.86.89
    User root
    IdentityFile ~/.ssh/slyfox_vps_key
    StrictHostKeyChecking no
```

**SSH key is pre-configured in Hostinger control panel as `claude-deploy`**

## 🔧 Configuration Persistence Architecture

### Development vs Production

| Environment | Storage Method | Persistence | Access |
|-------------|----------------|-------------|--------|
| **Development** | Direct file mount | Immediate | `server/data/` |
| **Production** | Docker volume | Across deployments | `config_data` volume |

### Site Management System

**Features that persist in production:**
- ✅ **Homepage Settings**: Hero slides, services, testimonials
- ✅ **Contact Settings**: Business info, hours, contact methods
- ✅ **Portfolio Settings**: Gallery layouts, colors, spacing
- ✅ **Real-time Updates**: Changes reflect immediately
- ✅ **Deployment Survival**: Settings persist across container rebuilds

### Configuration Files Structure

```
Production Container: /app/server/data/
├── site-config-overrides.json    # Site management settings
└── [automatic backups during deployment]

Docker Volume: config_data
├── Persistent across container rebuilds
├── Backed up during deployments
└── Atomic writes prevent corruption
```

## 🚨 Troubleshooting

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