# VPS Production Deployment Guide - SlyFox Studios

Complete guide for deploying SlyFox Studios to production VPS with configuration persistence, shared infrastructure management, and automated deployment scripts.

---

# 01 SEPTEMBER 2025 - CRITICAL DEPLOYMENT LESSONS LEARNED

## 🚨 DEPLOYMENT DISASTER ANALYSIS - WHAT WENT CATASTROPHICALLY WRONG

**Duration**: 20+ minutes of live site downtime  
**Root Cause**: Multiple cascading failures due to incomplete understanding of Traefik integration  
**Impact**: Complete loss of live site at slyfox.co.za, significant token/resource waste  
**Recovery**: Eventually successful but painful process requiring multiple emergency fixes  

### ❌ CRITICAL FAILURES THAT CAUSED THE DISASTER

#### 1. **TRAEFIK INTEGRATION COMPLETELY IGNORED**
- **FAILURE**: Claude focused only on the SlyFox application (168.231.86.89:3000) and completely ignored that the live site runs through Traefik at slyfox.co.za
- **CONSEQUENCE**: Applied the "nuclear option" which completely broke the Traefik connectivity that was routing traffic to the live domain
- **LESSON**: **NEVER deploy to production without first understanding the complete infrastructure architecture**

#### 2. **WRONG ENDPOINT TESTING** 
- **FAILURE**: Claude tested success against 168.231.86.89:3000 instead of the live domain slyfox.co.za
- **CONSEQUENCE**: Reported "successful deployment" while the actual live site was returning 404 errors
- **LESSON**: **ALWAYS test the actual live domain, not just the container endpoints**

#### 3. **DOCKER-COMPOSE COMMAND INCOMPATIBILITY**
- **FAILURE**: The automated deployment script used `docker-compose` but production server only had `docker compose` (no hyphen)
- **CONSEQUENCE**: Deployment script failed at container management steps but continued with file sync
- **LESSON**: **Verify Docker Compose command format on target server before deployment**

#### 4. **SERVER BINDING MISCONFIGURATION** 
- **FAILURE**: Node.js server was binding to 127.0.0.1:5000 instead of 0.0.0.0:5000
- **CONSEQUENCE**: Traefik couldn't route traffic to the application container even after network fixes
- **LESSON**: **Docker container applications MUST bind to 0.0.0.0, not localhost**

#### 5. **DOCKER NETWORKING MISUNDERSTANDING**
- **FAILURE**: SlyFox application wasn't properly connected to Traefik's network after the nuclear option
- **CONSEQUENCE**: 502 Bad Gateway errors even when container was running
- **LESSON**: **Multi-service Docker environments require explicit network configuration**

### 🔧 STEP-BY-STEP DISASTER RECOVERY PROCESS

#### Phase 1: Recognition of Failure (DELAYED)
```bash
# WRONG - What Claude tested initially
curl http://168.231.86.89:3000  # Returns 200 - FALSE SUCCESS

# RIGHT - What should have been tested  
curl https://slyfox.co.za       # Returns 404 - ACTUAL FAILURE
```

#### Phase 2: Traefik Infrastructure Discovery
```bash
# Found Traefik configuration in /root/docker-compose.yml
# Discovered SlyFox service was missing from Traefik routing
# Required adding service definition to Traefik's compose file
```

#### Phase 3: Network Connectivity Fixes
```bash
# Multiple failed attempts to configure Traefik routing
# Issues with duplicate network names, volume conflicts
# Eventually required dual-network setup:
networks:
  - sfweb-network      # SlyFox internal network
  - root_default       # Traefik external network
```

#### Phase 4: Server Binding Resolution
```bash
# CRITICAL FIX - Added to docker-compose.yml:
environment:
  - DOCKER_ENV=true    # Forces server to bind to 0.0.0.0:5000

# This triggered the conditional in server/index.ts:
const host = process.env.NODE_ENV === 'development' && 
             process.env.DOCKER_ENV === 'true' ? "0.0.0.0" : "127.0.0.1";
```

### 📋 MANDATORY PRE-DEPLOYMENT CHECKLIST (UPDATED)

#### Infrastructure Understanding (CRITICAL)
- [ ] **Map complete service architecture** - Identify ALL services (Traefik, N8N, etc.)
- [ ] **Identify live domain routing** - Understand how traffic reaches the application
- [ ] **Document network dependencies** - Map Docker networks and service connections
- [ ] **Verify DNS configuration** - Confirm domain points to correct infrastructure

#### Docker Environment Verification
- [ ] **Check Docker Compose command format** - Test `docker-compose` vs `docker compose`
- [ ] **Verify network connectivity** - Ensure services can communicate
- [ ] **Test container binding** - Confirm applications bind to 0.0.0.0 in containers
- [ ] **Validate environment variables** - Especially DOCKER_ENV for binding

#### Testing Protocol (MANDATORY)
- [ ] **Test live domain FIRST** - Always verify https://slyfox.co.za before claiming success
- [ ] **Check all new service pages** - Test newly deployed features specifically
- [ ] **Verify SSL certificate status** - Ensure HTTPS works correctly
- [ ] **Monitor for 5+ minutes** - Don't trust immediate success responses

#### Emergency Rollback Preparation
- [ ] **Backup Traefik configuration** - Copy /root/docker-compose.yml before changes
- [ ] **Document current network setup** - Map existing Docker networks
- [ ] **Have rollback commands ready** - Prepare quick recovery procedures
- [ ] **Save working container states** - Backup working configurations

### 🚨 UPDATED DEPLOYMENT COMMANDS (POST-DISASTER)

#### Docker Compose Command (FIXED)
```bash
# BROKEN - Old format
docker-compose up -d --build

# FIXED - New format (works on production server)  
docker compose up -d --build
```

#### Traefik Service Configuration (REQUIRED)
```yaml
# Add to /root/docker-compose.yml
services:
  slyfox:
    image: sfweb-app:latest
    restart: always
    networks:
      - default
      - sfweb_sfweb-network
    labels:
      - traefik.enable=true
      - traefik.http.routers.slyfox-domain.rule=Host(`slyfox.co.za`)
      - traefik.http.routers.slyfox-domain.tls=true
      - traefik.http.routers.slyfox-domain.entrypoints=websecure
      - traefik.http.routers.slyfox-domain.tls.certresolver=mytlschallenge
      - traefik.http.services.slyfox-domain.loadbalancer.server.port=5000

networks:
  sfweb_sfweb-network:
    external: true
```

#### SlyFox Application Configuration (REQUIRED)
```yaml
# Update /opt/sfweb/docker-compose.yml
services:
  app:
    environment:
      - NODE_ENV=development
      - DOCKER_ENV=true        # CRITICAL - Forces 0.0.0.0 binding
    networks:
      - sfweb-network
      - root_default           # CRITICAL - Traefik connectivity
    labels:
      - traefik.enable=true
      - traefik.http.routers.slyfox-domain.rule=Host(`slyfox.co.za`)
      - traefik.http.routers.slyfox-domain.tls.certresolver=mytlschallenge
      - traefik.http.services.slyfox-domain.loadbalancer.server.port=5000

networks:
  sfweb-network:
  root_default:
    external: true
```

### 🔍 DIAGNOSTIC COMMANDS (UPDATED)

#### Network Connectivity Debugging
```bash
# Check Docker networks
docker network ls

# Inspect network connections
docker inspect <container_name> | grep -A 10 Networks

# Test container-to-container connectivity  
docker exec <container> ping <other_container>

# Check port binding inside container
docker exec <container> netstat -tulpn | grep :5000
```

#### Traefik Debugging
```bash
# Check Traefik logs
docker logs traefik --tail 50

# Verify Traefik discovers services
curl http://localhost:8080/api/http/routers

# Test Traefik routing
curl -H "Host: slyfox.co.za" http://localhost
```

#### Server Binding Verification
```bash
# Check what host the server binds to
docker logs sfweb-app | grep "serving on port"

# Should show: "serving on port 5000" (not specific to localhost)
# If bound correctly, Traefik can reach it
```

### 💡 ARCHITECTURAL INSIGHTS FROM THE DISASTER

#### Infrastructure Dependencies
1. **Traefik** manages ALL external traffic and SSL certificates
2. **SlyFox application** is a service BEHIND Traefik, not standalone
3. **Docker networks** connect Traefik to individual applications
4. **Host binding** must be 0.0.0.0 for container-to-container communication

#### Service Relationships
```
Internet → slyfox.co.za → Traefik → Docker Network → SlyFox App Container
                         (Port 443)  (root_default)   (Port 5000)
```

#### Critical Configuration Points
1. **Traefik** must know about SlyFox service
2. **Docker networks** must connect Traefik and SlyFox
3. **Server binding** must be 0.0.0.0 for container access
4. **Environment variables** control binding behavior

### ⚠️ NEVER AGAIN RULES

1. **NEVER apply "nuclear option" without understanding infrastructure dependencies**
2. **NEVER test only container endpoints - always test live domain**
3. **NEVER assume deployment success from HTTP 200 on wrong endpoint**
4. **NEVER modify production without mapping complete service architecture**
5. **NEVER ignore user feedback about live site status**
6. **NEVER proceed with deployment if Docker commands fail**
7. **NEVER skip network connectivity verification**
8. **NEVER forget DOCKER_ENV variable for container binding**

### 🎯 SUCCESS CRITERIA (REDEFINED)

#### Deployment is NOT successful unless:
- [ ] https://slyfox.co.za returns HTTP 200
- [ ] All new service pages work (e.g., /services/social-media)  
- [ ] SSL certificate is valid and working
- [ ] Site management configuration persists
- [ ] No 404, 502, or 500 errors on live domain
- [ ] Traefik routing functions correctly
- [ ] Application container binds to 0.0.0.0:5000

### 📊 DISASTER METRICS

- **Downtime**: 20+ minutes
- **Failed Attempts**: 6+ deployment cycles
- **Root Cause Resolution Time**: 60+ minutes
- **User Frustration Level**: MAXIMUM
- **Token/Resource Waste**: Significant
- **Lesson Impact**: CRITICAL - changed entire deployment approach

### 🛠️ UPDATED DEPLOYMENT SCRIPT (POST-DISASTER)

The `./deploy-production.sh` script has been completely rewritten based on the lessons learned:

#### New Features Added:
1. **🚨 CRITICAL Infrastructure Verification** (Step 1.5)
   - Tests live domain https://slyfox.co.za BEFORE deployment
   - Verifies Traefik container is running
   - Checks if SlyFox service is configured in Traefik
   - Validates Docker Compose command format
   - **STOPS deployment if any critical checks fail**

2. **🐳 Fixed Docker Compose Commands**
   - Changed from `docker-compose` to `docker compose` (hyphen removed)
   - Applied throughout entire script consistently
   - Prevents deployment script failures

3. **🌐 Live Domain Testing Priority**
   - Tests https://slyfox.co.za FIRST in verification
   - Tests specific new service pages (/services/social-media, /services/web-apps)
   - Provides immediate debugging guidance if live domain fails
   - **FAILS deployment if live domain doesn't work**

4. **🔧 Enhanced Error Diagnostics**
   - Differentiates between Traefik routing vs application issues  
   - Provides specific debugging commands for each failure type
   - Shows network inspection and binding verification commands

5. **⚠️ Safety Prompts**
   - Interactive prompts if infrastructure issues detected
   - Allows experienced users to proceed with warnings
   - Prevents accidental deployment breaking

#### Critical Success Criteria:
The script now considers deployment successful ONLY if:
- ✅ https://slyfox.co.za returns HTTP 200
- ✅ New service pages are accessible
- ✅ SSL certificates work properly
- ✅ Configuration persistence functions

#### Usage:
```bash
# The script now prevents disasters automatically
./deploy-production.sh

# If any critical checks fail, deployment stops with guidance:
# "❌ Live domain https://slyfox.co.za NOT WORKING"
# "❌ Deployment aborted - fix Traefik configuration first"
```

This ensures that future deployments cannot break the live site without immediate detection and prevention.

---

# DOCUMENTATION EARLIER THAN 01 SEPT 2025

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

#### 1. ERR_MODULE_NOT_FOUND (Vite Dependencies) - CRITICAL FIX

**Symptom**: Application returns HTTP 500 with Vite module resolution errors:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/node_modules/vite/dist/node/chunks/dep-D-7KCb9p.js'
```

**Root Cause**: Node modules corruption during deployment or Docker cache conflicts

**Solution** (DOCUMENTED FIX - UPDATED 2025-08-31):
```bash
# Step 1: BACKUP SITE CONFIGURATION (CRITICAL - prevents admin settings loss)
curl -s http://168.231.86.89:3000/api/site-config > /tmp/production-config-backup.json

# Step 2: Nuclear option - clean everything (from DEV_SERVER_STARTUP.md)
ssh slyfox-vps "cd /opt/sfweb && docker compose down -v"
ssh slyfox-vps "docker system prune -a -f"

# Step 3: Rebuild from scratch 
ssh slyfox-vps "cd /opt/sfweb && docker compose up -d --build"

# Step 4: RESTORE SITE CONFIGURATION (CRITICAL - restores admin settings)
curl -X PATCH http://168.231.86.89:3000/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d @/tmp/production-config-backup.json

# Step 5: Verify fix
ssh slyfox-vps "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000"
# Expected: 200

ssh slyfox-vps "cd /opt/sfweb && docker compose logs app --tail 5"
# Expected: "express serving on port 5000"
```

**🚨 CRITICAL NOTE**: The `-v` flag removes Docker volumes, which wipes ALL admin dashboard settings (colors, content, etc.). Steps 1 and 4 are MANDATORY to preserve site configuration.

**Prevention**: This issue occurs when:
- Dependencies change significantly between deployments
- Docker build cache becomes corrupted  
- Node modules aren't properly rebuilt in container
- Incremental builds fail to resolve new dependencies

**Recovery Time**: ~3-5 minutes (includes full container rebuild)

**Success Indicators**:
- ✅ `curl http://localhost:3000` returns HTTP 200
- ✅ Application logs show "express serving on port 5000"  
- ✅ API endpoints respond correctly (`/api/site-config`)
- ✅ No ERR_MODULE_NOT_FOUND errors in logs

#### 2. Configuration Not Persisting
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