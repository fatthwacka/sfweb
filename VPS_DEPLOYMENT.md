# VPS Production Deployment Guide - SlyFox Studios

Complete guide for deploying SlyFox Studios to production VPS with configuration persistence, shared infrastructure management, and automated deployment scripts.

## 🖥️ Production Environment Overview

### VPS Configuration
- **IP Address**: 168.231.86.89
- **Hostname**: vps.netfox.co.za
- **OS**: Ubuntu 24.04 LTS
- **Resources**: 3.8GB RAM, 1 CPU core, 48GB storage
- **Provider**: Hostinger

### Application Architecture
- **Application Directory**: `/opt/sfweb`
- **Docker Environment**: Production containers with persistence
- **Configuration Storage**: Docker volume with atomic file writes
- **Reverse Proxy**: Traefik (shared with N8N)
- **SSL Certificates**: Automatic Let's Encrypt via Traefik

### Service Ecosystem

| Service | Container | Port Mapping | Status | Purpose |
|---------|-----------|--------------|--------|---------|
| **SlyFox App** | `sfweb-app` | 3000:5000 | ✅ Active | Main application |
| **PostgreSQL** | `sfweb-postgres` | 5432:5432 | ✅ Active | Database |
| **Traefik** | `traefik` | 80:80, 443:443 | ✅ Active | Reverse proxy & SSL |
| **N8N** | `n8n` | 5678:5678 | ✅ Active | Automation platform |

### Resource Allocation
- **SlyFox App**: ~50MB
- **PostgreSQL**: ~30MB  
- **Traefik**: ~130MB
- **N8N**: ~275MB
- **Total Usage**: ~485MB of 3.8GB available
- **Available**: ~3.3GB free capacity

## 🚀 Quick Deployment

### Automated Deployment (Recommended)

The `deploy-production.sh` script handles the complete deployment process:

```bash
# Run from local development environment
./deploy-production.sh
```

**What this does:**
1. ✅ Verifies SSH connection to VPS
2. 🛑 Stops existing production containers gracefully  
3. 📦 Backs up current configuration with timestamp
4. 🔄 Syncs complete codebase to VPS
5. 🏗️ Builds containers with configuration persistence fixes
6. ⚙️ Starts production services
7. 🔬 Verifies configuration persistence is working
8. 🌐 Tests all API endpoints
9. 📊 Reports production status

### SSH Access Setup

The deployment script requires SSH key authentication:

```bash
# SSH keys are configured in ~/.ssh/config as:
Host slyfox-vps
    HostName 168.231.86.89
    User root
    IdentityFile ~/.ssh/slyfox_vps_key
    StrictHostKeyChecking no
```

**SSH key is already configured in Hostinger control panel as `claude-deploy`**

## 🔧 Manual Deployment Process

### 1. Pre-Deployment Checks

```bash
# Verify VPS connectivity
ssh slyfox-vps "echo 'Connection successful'"

# Check current production status
ssh slyfox-vps "cd /opt/sfweb && docker compose ps"

# Check disk space
ssh slyfox-vps "df -h"
```

### 2. Code Synchronization

```bash
# Sync codebase to production (from local)
rsync -avz --progress \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.npm-cache' \
    --exclude='dist' \
    --exclude='*.log' \
    ./ slyfox-vps:/opt/sfweb/
```

### 3. Production Container Management

```bash
# Stop existing services
ssh slyfox-vps "cd /opt/sfweb && docker compose down"

# Build and start with latest fixes
ssh slyfox-vps "cd /opt/sfweb && docker compose up -d --build"

# Monitor startup logs
ssh slyfox-vps "cd /opt/sfweb && docker compose logs -f"
```

### 4. Verify Configuration Persistence

```bash
# Check config directory exists in container
ssh slyfox-vps "docker exec sfweb-app ls -la /app/server/data/"

# Test API endpoints
ssh slyfox-vps "curl -s http://localhost:3000/api/site-config | jq '.contact.business.name'"

# Test configuration update
ssh slyfox-vps 'curl -X PATCH http://localhost:3000/api/site-config/bulk -H "Content-Type: application/json" -d "{\"test\":{\"deployment\":\"$(date)\"}}"'
```

## 🔐 Configuration Persistence Architecture

### Development vs Production

| Environment | Config Storage | Persistence Method | Access |
|-------------|----------------|-------------------|---------|
| **Development** | `server/data/` directory | Direct file mount | Immediate |
| **Production** | Docker volume `config_data` | Atomic file writes | Persistent across deployments |

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

### Site Management System

**Complete site management features work in production:**

- ✅ **Homepage Settings**: Hero slides, services, testimonials
- ✅ **Contact Settings**: Business info, hours, contact methods
- ✅ **Portfolio Settings**: Gallery layouts, colors, spacing
- ✅ **Real-time Updates**: Changes reflect immediately
- ✅ **Persistent Storage**: Survives container restarts and deployments

**Access URLs:**
- **Admin Panel**: http://168.231.86.89:3000/admin
- **Site Management**: Admin Panel → Site Management tab

## 🌐 Domain & SSL Configuration

### Current Access
- **Direct IP**: http://168.231.86.89:3000
- **Domain Target**: slyfox.co.za (pending A record setup)

### Traefik Reverse Proxy Setup

**Location**: `/root/docker-compose.yml` (separate from SlyFox app)

```yaml
version: '3.7'
services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@slyfox.co.za"
      - "--certificatesresolvers.letsencrypt.acme.storage=/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./acme.json:/acme.json"
```

### SSL Certificate Management
- **Provider**: Let's Encrypt (automatic)
- **Renewal**: Automatic via Traefik
- **Storage**: `/root/acme.json`

## 📊 Production Monitoring & Management

### Container Status Monitoring

```bash
# Check all production containers
ssh slyfox-vps "docker ps"

# Resource usage monitoring
ssh slyfox-vps "docker stats --no-stream"

# Application-specific logs
ssh slyfox-vps "cd /opt/sfweb && docker compose logs sfweb-app --tail=50"

# Database logs
ssh slyfox-vps "cd /opt/sfweb && docker compose logs sfweb-postgres --tail=20"
```

### Configuration Management

```bash
# View current site configuration
curl -s http://168.231.86.89:3000/api/site-config | jq

# Test admin panel accessibility
curl -I http://168.231.86.89:3000/admin

# Check configuration file in production
ssh slyfox-vps "docker exec sfweb-app cat /app/server/data/site-config-overrides.json | jq"

# Backup current configuration
ssh slyfox-vps "docker exec sfweb-app cat /app/server/data/site-config-overrides.json" > "backup-config-$(date +%Y%m%d).json"
```

### Database Management

```bash
# Access PostgreSQL directly
ssh slyfox-vps "docker exec -it sfweb-postgres psql -U postgres -d slyfox_studios"

# Database backup
ssh slyfox-vps "docker exec sfweb-postgres pg_dump -U postgres slyfox_studios" > "backup-db-$(date +%Y%m%d).sql"

# Check database size and connections
ssh slyfox-vps "docker exec sfweb-postgres psql -U postgres -c '\l+'"
```

## 🛠️ Production Maintenance

### Regular Maintenance Tasks

```bash
# Weekly: Check system resources
ssh slyfox-vps "df -h && free -h"

# Monthly: Docker cleanup
ssh slyfox-vps "docker system prune -f"

# Quarterly: Update container images
ssh slyfox-vps "cd /opt/sfweb && docker compose pull && docker compose up -d"
```

### Configuration Backup Strategy

```bash
# Automated backup during deployment
BACKUP_DIR="/opt/sfweb-backup-$(date +%Y%m%d-%H%M%S)"
ssh slyfox-vps "mkdir -p $BACKUP_DIR"
ssh slyfox-vps "cp /opt/sfweb/server/data/site-config-overrides.json $BACKUP_DIR/"

# Manual configuration export
curl -s http://168.231.86.89:3000/api/site-config > "prod-config-$(date +%Y%m%d).json"
```

### Log Management

```bash
# Application logs (last 100 lines)
ssh slyfox-vps "cd /opt/sfweb && docker compose logs --tail=100"

# Real-time log monitoring
ssh slyfox-vps "cd /opt/sfweb && docker compose logs -f"

# Filter logs by service
ssh slyfox-vps "cd /opt/sfweb && docker compose logs sfweb-app -f"
```

## 🔄 Environment Variables & Configuration

### Required Environment Variables

**Production `.env` file location**: `/opt/sfweb/.env`

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres_password@postgres:5432/slyfox_studios

# Supabase Integration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Email & reCAPTCHA (optional for basic functionality)
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
SMTP_EMAIL=your_smtp_email
SMTP_PASSWORD=your_smtp_password
```

### Docker Compose Environment Mapping

**CRITICAL**: All environment variables must be explicitly listed in `docker-compose.yml`:

```yaml
services:
  app:
    environment:
      - NODE_ENV=development
      - DATABASE_URL=${DATABASE_URL}
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      # ... all other variables explicitly mapped
```

## 🚨 Troubleshooting Production Issues

### Common Production Issues

#### 1. Configuration Not Persisting
```bash
# Check if config volume exists
ssh slyfox-vps "docker volume ls | grep config"

# Verify volume is mounted correctly
ssh slyfox-vps "docker inspect sfweb-app | grep -A 10 Mounts"

# Check file permissions in container
ssh slyfox-vps "docker exec sfweb-app ls -la /app/server/data/"
```

#### 2. Site Management Not Working
```bash
# Test API endpoint directly
ssh slyfox-vps "curl -I http://localhost:3000/api/site-config"

# Check if server directory was copied to container
ssh slyfox-vps "docker exec sfweb-app ls -la /app/server/"

# Verify Dockerfile includes server directory
ssh slyfox-vps "cd /opt/sfweb && grep -A 3 'COPY.*server' Dockerfile"
```

#### 3. Container Won't Start
```bash
# Check Docker disk space
ssh slyfox-vps "docker system df"

# View detailed container logs
ssh slyfox-vps "cd /opt/sfweb && docker compose logs --no-log-prefix"

# Check for port conflicts
ssh slyfox-vps "netstat -tulpn | grep -E ':(3000|5432)'"
```

#### 4. Database Connection Issues
```bash
# Check PostgreSQL status
ssh slyfox-vps "docker exec sfweb-postgres pg_isready -U postgres"

# Verify database exists
ssh slyfox-vps "docker exec sfweb-postgres psql -U postgres -l"

# Check database connection from app container
ssh slyfox-vps "docker exec sfweb-app nc -z postgres 5432"
```

### Emergency Recovery

#### Full Application Reset
```bash
# Stop all services
ssh slyfox-vps "cd /opt/sfweb && docker compose down -v"

# Clean Docker system
ssh slyfox-vps "docker system prune -a -f"

# Redeploy from scratch
./deploy-production.sh
```

#### Configuration Recovery
```bash
# Restore from backup
ssh slyfox-vps "cp /opt/sfweb-backup-[DATE]/site-config-overrides.json /opt/sfweb/server/data/"

# Restart application
ssh slyfox-vps "cd /opt/sfweb && docker compose restart app"
```

## 📋 Production Deployment Checklist

### Pre-Deployment
- [ ] Local development environment tested
- [ ] Configuration changes tested locally
- [ ] Database migrations ready (if any)
- [ ] SSH access to VPS verified
- [ ] Backup current production config

### During Deployment
- [ ] Run `./deploy-production.sh`
- [ ] Monitor deployment logs
- [ ] Verify containers start successfully
- [ ] Test API endpoints respond
- [ ] Confirm configuration persistence works

### Post-Deployment  
- [ ] Test admin panel accessibility
- [ ] Verify site management functions work
- [ ] Check all customized content displays correctly
- [ ] Test configuration updates persist
- [ ] Monitor resource usage
- [ ] Update deployment logs

### Success Criteria
- [ ] **Application**: http://168.231.86.89:3000 returns HTTP 200
- [ ] **Admin Panel**: http://168.231.86.89:3000/admin accessible
- [ ] **API Endpoints**: `/api/site-config` returns custom configuration
- [ ] **Site Management**: Changes in admin persist after restart
- [ ] **Resources**: System using <50% of available RAM/disk

## 🔗 Production URLs & Access

### Application Access
- **Main Site**: http://168.231.86.89:3000
- **Admin Panel**: http://168.231.86.89:3000/admin  
- **API Base**: http://168.231.86.89:3000/api
- **Site Config API**: http://168.231.86.89:3000/api/site-config

### Infrastructure Access
- **N8N Automation**: http://168.231.86.89:5678
- **Database**: Direct access via SSH tunnel only
- **SSH Access**: `ssh slyfox-vps` (configured alias)

### Future Domain Setup
- **Target Domain**: slyfox.co.za
- **SSL**: Automatic via Let's Encrypt
- **DNS**: A record needs to point to 168.231.86.89

## 📈 Performance & Scaling

### Current Performance
- **Response Time**: <100ms for static pages
- **API Response**: <200ms for configuration endpoints
- **Build Time**: ~2 minutes for complete deployment
- **Uptime**: 99.9% (infrastructure monitoring via Traefik)

### Scaling Considerations
- **Horizontal**: Load balancer can distribute across multiple containers
- **Vertical**: VPS can be upgraded to higher resources
- **Database**: PostgreSQL can be moved to dedicated database server
- **Static Assets**: CDN can be added for public directory

### Monitoring & Alerts
- **Resource Monitoring**: Docker stats and system monitoring
- **Application Health**: API endpoint health checks
- **Configuration Changes**: Tracked via admin panel activity
- **Automated Backups**: Configuration backed up on each deployment

---

## 🎯 Quick Reference Commands

### Deployment
```bash
./deploy-production.sh                               # Full automated deployment
ssh slyfox-vps "cd /opt/sfweb && docker compose ps" # Check status  
ssh slyfox-vps "cd /opt/sfweb && docker compose logs -f" # Monitor logs
```

### Configuration Management
```bash
curl http://168.231.86.89:3000/api/site-config | jq # View config
ssh slyfox-vps "docker exec sfweb-app ls -la /app/server/data/" # Check persistence
```

### Maintenance
```bash
ssh slyfox-vps "docker stats --no-stream"           # Resource usage
ssh slyfox-vps "docker system df"                   # Disk usage
ssh slyfox-vps "docker system prune -f"             # Cleanup
```

---

*This guide ensures reliable, persistent production deployments with full site management capabilities.*