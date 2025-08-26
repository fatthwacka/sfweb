# SlyFox Studios - Deployment Workflow

This document outlines the complete deployment workflow from local development to production VPS deployment.

## 🏗️ Development to Production Workflow

### Overview

- **Repository**: https://github.com/fatthwacka/sfweb.git (fatthwacka/sfweb)
- **Local Development**: Dockerized environment synced via Dropbox across devices
- **Version Control**: Git-based code management with GitHub integration
- **Production**: VPS deployment at vps.netfox.co.za (168.231.86.89)

### Environment Mapping

| Environment | Location | Access | Database | Purpose |
|-------------|----------|--------|----------|---------|
| **Local** | Dropbox folder | http://localhost:3000 | Local PostgreSQL | Development & testing |
| **Production** | /opt/sfweb | http://168.231.86.89:3000 | VPS PostgreSQL | Live application |

## 📋 Pre-Deployment Checklist

### ✅ Development Environment Ready

```bash
# 1. Ensure local app is running
npm run docker:dev

# 2. Test application locally
curl -I http://localhost:3000

# 3. Run type checking
npm run check

# 4. Ensure Dropbox sync is complete
# Check Dropbox sync status in system tray
```

### ✅ Code Quality Checks

```bash
# Recommended: Commit changes to git
git add .
git status
git commit -m "Ready for production deployment"
git push origin main

# Ensure no sensitive data in files
grep -r "password\|secret\|key" --exclude-dir=node_modules .
```

## 🚀 Deployment Process

### Method 1: Manual Deployment (Current)

#### Step 1: Connect to VPS

```bash
# Connect via SSH
npm run vps:connect
# or manually: ssh root@168.231.86.89
```

#### Step 2: Sync Code to VPS

**Option A: Manual File Sync**
```bash
# From local development machine (new terminal)
# Use rsync or scp to sync files
rsync -av --exclude='node_modules' --exclude='.git' \
  /path/to/local/sfweb/ root@168.231.86.89:/opt/sfweb/

# Or using scp for specific files
scp -r ./client root@168.231.86.89:/opt/sfweb/
scp -r ./server root@168.231.86.89:/opt/sfweb/
scp package.json root@168.231.86.89:/opt/sfweb/
```

**Option B: Git-based Sync (recommended)**
```bash
# On VPS (already connected)
cd /opt/sfweb
git pull origin main
```

#### Step 3: Deploy on VPS

```bash
# On VPS (in SSH session)
cd /opt/sfweb

# Stop existing containers
docker-compose down

# Rebuild and start containers
docker-compose up -d --build

# Monitor deployment
docker logs sfweb-app --tail 50 -f
```

#### Step 4: Verify Deployment

```bash
# On VPS
docker ps  # Check container status
curl -I http://localhost:3000  # Test local access

# From local machine (new terminal)
npm run vps:test
# or manually: curl -I http://168.231.86.89:3000
```

### Method 2: Using NPM Scripts (Guided)

```bash
# 1. Test VPS connectivity
npm run vps:test

# 2. Get deployment commands
npm run vps:deploy
# This shows you the commands to run after connecting

# 3. Connect to VPS
npm run vps:connect

# 4. Run deployment commands (on VPS)
cd /opt/sfweb && docker-compose down && docker-compose up -d --build

# 5. Monitor (on VPS)
docker logs sfweb-app --tail 50 -f
```

## 🔍 Post-Deployment Verification

### Health Checks

```bash
# Check application status
curl -I http://168.231.86.89:3000

# Expected response:
# HTTP/1.1 200 OK
# X-Powered-By: Express
# Content-Type: text/html; charset=utf-8
```

### Container Status

```bash
# On VPS
docker ps

# Expected containers:
# sfweb-app        (0.0.0.0:3000->5000/tcp)
# sfweb-postgres   (0.0.0.0:5432->5432/tcp)
# traefik          (0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp)
# n8n              (0.0.0.0:5678->5678/tcp)
```

### Database Connectivity

```bash
# On VPS
docker-compose exec postgres psql -U postgres -d slyfox_studios -c "SELECT version();"

# Should return PostgreSQL version info
```

### Resource Monitoring

```bash
# On VPS
docker stats --no-stream

# Check memory usage (should be under 3.8GB total)
free -h

# Check disk usage
df -h
```

## 🚨 Troubleshooting Deployment Issues

### Common Issues & Solutions

#### 1. Container Build Failures

```bash
# Clear Docker cache and rebuild
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

#### 2. Port Conflicts

```bash
# Check what's using ports
netstat -tulpn | grep -E ":(3000|5432)"

# Stop conflicting services
sudo systemctl stop nginx  # if nginx is running
```

#### 3. Database Connection Issues

```bash
# Check PostgreSQL container
docker logs sfweb-postgres --tail 20

# Restart database container
docker-compose restart postgres

# Test database connectivity
docker-compose exec postgres pg_isready -U postgres
```

#### 4. File Permission Issues

```bash
# Fix ownership (on VPS)
chown -R root:root /opt/sfweb
chmod -R 755 /opt/sfweb
```

#### 5. Out of Disk Space

```bash
# Clean up Docker
docker system prune -a -f

# Remove old images
docker image prune -a -f

# Check disk usage
df -h
```

### Emergency Rollback

```bash
# On VPS - if deployment fails
cd /opt/sfweb

# Stop current containers
docker-compose down

# Revert to last known good state
git reset --hard HEAD~1  # if using git
# or manually restore files from backup

# Restart with previous version
docker-compose up -d --build
```

## 📊 Monitoring & Maintenance

### Regular Health Checks

```bash
# Weekly health check script (run from local)
#!/bin/bash
echo "=== SlyFox VPS Health Check ==="
echo "Application Status:"
curl -I http://168.231.86.89:3000

echo "N8N Status:"
curl -I http://168.231.86.89:5678

echo "=== End Health Check ==="
```

### Log Monitoring

```bash
# On VPS - monitor application logs
docker logs sfweb-app --tail 100 -f

# Check for errors
docker logs sfweb-app | grep -i error

# Monitor resource usage
watch docker stats --no-stream
```

### Backup Strategy

```bash
# Database backup (on VPS)
docker-compose exec postgres pg_dump -U postgres slyfox_studios > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf sfweb_backup_$(date +%Y%m%d).tar.gz /opt/sfweb/

# Copy backups to safe location
# rsync backups to remote storage or local machine
```

## 🔄 Cross-Platform Development Flow

**Note**: For complete file structure and device setup instructions, see `DEV_SERVER_STARTUP.md`.

### Intel ↔ ARM Compatibility

1. **File Sync**: Code automatically syncs across devices via Dropbox (~50MB)
2. **Docker Platform**: Multi-platform builds support both architectures  
3. **Environment Consistency**: Same Docker setup works on both platforms
4. **Local Rebuilds**: Docker images and node_modules rebuilt per device (~766MB)

### Device Switching Workflow

```bash
# On new device after Dropbox sync
cd "/Volumes/KLEANDOC/Origin Dropbox/SLYFOX/ADMIN/WEBSITE/2025/sfweb"  # macOS
# or "C:\Users\%USERNAME%\Dropbox\SLYFOX\ADMIN\WEBSITE\2025\sfweb"      # Windows  
npm run docker:dev  # Rebuilds containers and starts development

# Total setup time: ~3-5 minutes (first build on new device)
```

## 🎯 Future Automation Goals

### Planned Improvements

1. **CI/CD Pipeline**: Automated deployment on git push
2. **Health Monitoring**: Automated alerting for downtime
3. **Backup Automation**: Scheduled database and file backups
4. **Domain Configuration**: Automated SSL certificate management
5. **Load Balancing**: Multiple container instances for high availability

### Deployment Script Template

```bash
#!/bin/bash
# Future automated deployment script
set -e

echo "Starting SlyFox deployment..."

# Pre-deployment checks
npm run check
npm run vps:test

# Sync code
rsync -av --exclude='node_modules' ./ root@168.231.86.89:/opt/sfweb/

# Deploy
ssh root@168.231.86.89 'cd /opt/sfweb && docker-compose down && docker-compose up -d --build'

# Verify
sleep 30
npm run vps:test

echo "Deployment complete!"
```

---

*This workflow ensures reliable, repeatable deployments while maintaining development flexibility across platforms.*

**Quick Reference:**
- **VPS**: 168.231.86.89
- **App**: http://168.231.86.89:3000
- **SSH**: `ssh root@168.231.86.89`
- **Deploy**: `cd /opt/sfweb && docker-compose down && docker-compose up -d --build`