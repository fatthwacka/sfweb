# VPS Deployment Guide - SlyFox Studios

This guide documents the complete VPS deployment setup for SlyFox Studios, including the shared infrastructure with N8N automation platform.

## 🖥️ System Configuration

**VPS Details:**
- **IP Address**: 168.231.86.89
- **Hostname**: vps.netfox.co.za
- **OS**: Linux Ubuntu 24.04 LTS
- **Resources**: 3.8GB RAM, 1 CPU core, 48GB storage
- **Provider**: Hostinger

**System Services:**
- Docker with Compose v2 ✅
- UFW Firewall (ports 22, 80, 443) ✅
- Nginx: Disabled (Traefik handles HTTP/HTTPS)

## 🐳 Docker Containers & Port Configuration

### Active Containers

| Container | Image | Port Mapping | Status |
|-----------|-------|--------------|--------|
| `sfweb-app` | sfweb-app | 3000:5000 | ✅ Running |
| `sfweb-postgres` | postgres:15-alpine | 5432:5432 | ✅ Running |
| `traefik` | traefik | 80:80, 443:443 | ✅ Running |
| `n8n` | docker.n8n.io/n8nio/n8n | 5678:5678 | ✅ Running |

### Port Allocation

- **Port 80**: Traefik HTTP (redirects to HTTPS)
- **Port 443**: Traefik HTTPS (SSL termination)
- **Port 3000**: SlyFox Studios application
- **Port 5432**: PostgreSQL database (SlyFox)
- **Port 5678**: N8N automation platform

### Resource Usage

- **Traefik**: ~130MB
- **N8N**: ~275MB
- **SlyFox App**: ~50MB
- **PostgreSQL**: ~30MB
- **Total**: ~485MB of 3.8GB available

## 🔄 Traefik Reverse Proxy Configuration

**Location**: `/root/docker-compose.yml`

```yaml
version: "3.7"

services:
  traefik:
    image: "traefik"
    restart: always
    command:
      - "--api=true"
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.file.filename=/etc/traefik/traefik-certs.yml"
      - "--providers.file.watch=true"
      - "--log.level=DEBUG"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.mytlschallenge.acme.tlschallenge=true"
      - "--certificatesresolvers.mytlschallenge.acme.email=${SSL_EMAIL}"
      - "--certificatesresolvers.mytlschallenge.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - traefik_data:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /root/traefik-certs.yml:/etc/traefik/traefik-certs.yml:ro
      - /root/server.crt:/certs/server.crt:ro
      - /root/server.key:/certs/server.key:ro

  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    labels:
      - traefik.enable=true
      - traefik.http.routers.n8n-ip.rule=Host(`168.231.86.89`)
      - traefik.http.routers.n8n-ip.tls=true
      - traefik.http.routers.n8n-ip.entrypoints=websecure
      - traefik.http.routers.n8n-domain.rule=Host(`${SUBDOMAIN}.${DOMAIN_NAME}`)
      - traefik.http.routers.n8n-domain.tls=true
      - traefik.http.routers.n8n-domain.entrypoints=websecure
      - traefik.http.routers.n8n-domain.tls.certresolver=mytlschallenge
    environment:
      - N8N_HOST=${SUBDOMAIN}.${DOMAIN_NAME}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://${SUBDOMAIN}.${DOMAIN_NAME}/
      - GENERIC_TIMEZONE=${GENERIC_TIMEZONE}
      - N8N_SECURE_COOKIE=false
    volumes:
      - n8n_data:/home/node/.n8n
      - /local-files:/files

volumes:
  traefik_data:
    external: true
  n8n_data:
    external: true
```

## 🤖 N8N Application Configuration

**Location**: `/root/.env`

```env
# Domain configuration
DOMAIN_NAME=netfox.co.za
SUBDOMAIN=n8n

# Timezone
GENERIC_TIMEZONE=Europe/Berlin

# SSL email for Let's Encrypt
SSL_EMAIL=user@netfox.co.za
```

**Access URLs:**
- **Current**: http://168.231.86.89:5678 ✅
- **Target**: https://n8n.netfox.co.za (DNS pending)

**Data Storage:**
- Docker Volume: `n8n_data` (persistent)
- Local Files: `/local-files` → `/files` (container)

**Active Workflows:**
- ✅ "DCS - post to Facebook"
- ✅ "META inbox (webhook)"

## 🦊 SlyFox Application Configuration

**Location**: `/opt/sfweb/docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:15-alpine
    platform: linux/amd64
    container_name: sfweb-postgres
    environment:
      POSTGRES_DB: slyfox_studios
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres_password
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/seed-supabase.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - sfweb-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
      platforms:
        - linux/amd64
        - linux/arm64
    container_name: sfweb-app
    environment:
      NODE_ENV: development
      PORT: 5000
      DOCKER_ENV: "true"
      DATABASE_URL: ${DATABASE_URL}
      VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
      VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
    volumes:
      - .:/app
      - /app/node_modules
      - /app/dist
      - ./public:/app/public
    ports:
      - "3000:5000"
    networks:
      - sfweb-network
    restart: unless-stopped
    command: npm run dev

volumes:
  postgres_data:
    driver: local

networks:
  sfweb-network:
    driver: bridge
```

**Access URLs:**
- **Current**: http://168.231.86.89:3000 ✅
- **Target**: https://slyfox.co.za (A record pending)

**Technology Stack:**
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (local) + Supabase (external)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth

## 🌐 DNS & Domain Configuration

### Required DNS Records

**Hostinger DNS Configuration:**

```dns
# N8N Application
Type: A
Name: n8n
Value: 168.231.86.89
TTL: 300

# SlyFox Application
Type: A
Name: @
Value: 168.231.86.89
TTL: 300
```

### Domain Status

| Domain | Target | Status |
|--------|--------|--------|
| n8n.netfox.co.za | 168.231.86.89:5678 | ❌ DNS not propagating |
| slyfox.co.za | 168.231.86.89:3000 | ⏳ A record not added |

### SSL Certificates

- **Automatic**: Let's Encrypt via Traefik
- **HTTP→HTTPS**: Automatic redirect
- **Custom Certs**: Available for IP-based access

### DNS Troubleshooting

```bash
# Check DNS propagation
dig n8n.netfox.co.za @8.8.8.8
nslookup n8n.netfox.co.za

# Check Hostinger nameservers
dig @ns1.dns-parking.com n8n.netfox.co.za
```

## 📁 File Structure & Locations

### N8N Configuration

```
/root/
├── docker-compose.yml          # Traefik + N8N setup
├── .env                        # N8N environment variables
├── traefik-certs.yml          # Traefik SSL certificate config
├── server.crt                 # Custom SSL certificate
└── server.key                 # Custom SSL private key
```

### SlyFox Application

```
/opt/sfweb/
├── docker-compose.yml          # SlyFox app + PostgreSQL
├── Dockerfile                  # App container build config
├── .env                        # Supabase configuration
├── package.json               # Node.js dependencies
├── client/                    # React frontend
│   ├── src/
│   ├── public/
│   └── dist/                  # Built React app
├── server/                    # Express backend
│   ├── index.ts               # Main server file
│   └── routes/
├── shared/                    # Shared TypeScript types
├── scripts/                   # Database seeding scripts
└── logs/                      # Application logs
```

### Backup Locations

```
/var/www/sfweb/                # Mirror of /opt/sfweb
/root/sfweb/                   # Documentation only
```

### Docker Volumes

```
traefik_data                   # Traefik Let's Encrypt certificates
n8n_data                       # N8N workflow data
sfweb_postgres_data            # SlyFox PostgreSQL database
```

## 🛠️ Management Commands

### Start/Stop Applications

```bash
# N8N + Traefik
cd /root
docker compose up -d          # Start
docker compose down           # Stop

# SlyFox App
cd /opt/sfweb
docker compose up -d --build  # Start
docker compose down           # Stop
```

### Monitor Applications

```bash
# Check all containers
docker ps

# Check resource usage
docker stats --no-stream

# Check logs
docker logs root-n8n-1 --tail 20
docker logs sfweb-app --tail 20

# Check system resources
free -h
df -h
```

### Troubleshooting

```bash
# Test connectivity
curl -I http://localhost:3000    # SlyFox app
curl -I http://localhost:5678    # N8N app

# Check ports
netstat -tulpn | grep -E ":(80|443|3000|5678)"

# Check DNS
dig n8n.netfox.co.za @8.8.8.8

# Restart applications
cd /opt/sfweb && docker compose restart
cd /root && docker compose restart
```

## 🔄 Deployment Workflow

### Repository Information
- **GitHub Repository**: https://github.com/fatthwacka/sfweb.git
- **Main Branch**: main
- **Remote Origin**: fatthwacka/sfweb

### From Local Development to VPS

1. **Sync Local Changes**
   ```bash
   # Ensure Dropbox sync is complete
   # Commit changes to git (recommended)
   git add . && git commit -m "Updates for deployment"
   git push origin main
   ```

2. **Connect to VPS**
   ```bash
   ssh root@168.231.86.89
   ```

3. **Update Application**
   ```bash
   cd /opt/sfweb
   
   # Pull latest changes (if using git)
   # git pull origin main
   
   # Or sync files manually
   # rsync -av /local/path/ /opt/sfweb/
   
   # Rebuild and restart
   docker compose down
   docker compose up -d --build
   ```

4. **Verify Deployment**
   ```bash
   # Check containers
   docker ps
   
   # Test application
   curl -I http://168.231.86.89:3000
   
   # Monitor logs
   docker logs sfweb-app --tail 50 -f
   ```

## 📊 Current Status Summary

### ✅ Working

- **N8N**: http://168.231.86.89:5678
- **SlyFox**: http://168.231.86.89:3000
- **Traefik**: Reverse proxy with SSL
- **PostgreSQL**: Database for SlyFox
- **All containers**: Healthy and running

### ⏳ Pending

- **DNS propagation**: n8n.netfox.co.za
- **A record creation**: slyfox.co.za
- **Traefik routing**: Domain-based access for SlyFox

### 🔧 Next Steps

1. **Resolve DNS issues** with Hostinger support
2. **Add A record** for slyfox.co.za
3. **Configure Traefik routing** for SlyFox domain access
4. **Set up automated deployment** pipeline
5. **Implement monitoring** and alerting

---

*Last updated: August 2025*
*VPS: vps.netfox.co.za (168.231.86.89)*