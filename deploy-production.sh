#!/bin/bash

# Production Deployment Script for SlyFox Studios
# Deploys the complete site management system with configuration persistence fixes

set -e  # Exit on any error

echo "🚀 SlyFox Studios - Production Deployment"
echo "========================================="

VPS_HOST="slyfox-vps"
VPS_USER="root"
VPS_APP_DIR="/opt/sfweb"
LOCAL_DIR="$(pwd)"

echo "📋 Deployment Configuration:"
echo "   VPS Host: $VPS_HOST"
echo "   VPS Directory: $VPS_APP_DIR"
echo "   Local Directory: $LOCAL_DIR"
echo ""

# Function to run commands on VPS
run_on_vps() {
    ssh $VPS_HOST "$1"
}

# Function to copy files to VPS
copy_to_vps() {
    scp -r "$1" $VPS_HOST:"$2"
}

echo "🔍 Step 1: Pre-deployment Checks"
echo "================================="

# Check if we can connect to VPS
if ! ssh $VPS_HOST "echo 'VPS Connection OK'"; then
    echo "❌ Cannot connect to VPS. Please check your SSH connection."
    exit 1
fi

# Check if Docker is running on VPS
if ! run_on_vps "docker --version"; then
    echo "❌ Docker not found on VPS"
    exit 1
fi

echo "✅ VPS connection and Docker verified"

echo ""
echo "🚨 Step 1.5: CRITICAL Infrastructure Verification"
echo "================================================"

# CRITICAL: Check if live domain is currently working
echo "🌐 Testing LIVE DOMAIN (this is what users see):"
if curl -s -o /dev/null -w "%{http_code}" https://slyfox.co.za | grep -q "200"; then
    echo "✅ Live domain https://slyfox.co.za is responding (HTTP 200)"
else
    echo "⚠️  Live domain https://slyfox.co.za is not responding properly"
    echo "   This could indicate Traefik routing issues"
    read -p "   Continue anyway? (y/N): " continue_anyway
    if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
        echo "❌ Deployment aborted for safety"
        exit 1
    fi
fi

# Check if Traefik is running
echo "🔧 Checking Traefik infrastructure:"
if run_on_vps "docker ps | grep -q traefik"; then
    echo "✅ Traefik container is running"
    
    # Check if SlyFox service is configured in Traefik
    if run_on_vps "cd /root && docker compose config | grep -q slyfox"; then
        echo "✅ SlyFox service is configured in Traefik"
    else
        echo "⚠️  SlyFox service NOT found in Traefik configuration"
        echo "   This will cause live domain routing to fail"
        read -p "   Continue anyway? (y/N): " continue_traefik
        if [[ ! $continue_traefik =~ ^[Yy]$ ]]; then
            echo "❌ Deployment aborted - fix Traefik configuration first"
            exit 1
        fi
    fi
else
    echo "❌ Traefik container not running - live domain will not work"
    read -p "   Continue anyway? (y/N): " continue_no_traefik
    if [[ ! $continue_no_traefik =~ ^[Yy]$ ]]; then
        echo "❌ Deployment aborted for safety"
        exit 1
    fi
fi

# Check Docker Compose command format
echo "🐳 Verifying Docker Compose command format:"
if run_on_vps "docker compose version" 2>/dev/null; then
    echo "✅ Using 'docker compose' (new format)"
else
    echo "❌ 'docker compose' not available - this script will fail"
    exit 1
fi

echo "✅ Infrastructure verification completed"

echo ""
echo "🛑 Step 2: Stop Current Production Services"
echo "============================================"

# Stop existing containers gracefully
run_on_vps "cd $VPS_APP_DIR && docker compose down || echo 'No containers to stop'"

echo "✅ Production services stopped"

echo ""
echo "📦 Step 3: Backup Current Configuration"
echo "======================================="

# Create backup directory with timestamp
BACKUP_DIR="/opt/sfweb-backup-$(date +%Y%m%d-%H%M%S)"
run_on_vps "mkdir -p $BACKUP_DIR"

# Backup existing configuration if it exists
run_on_vps "if [ -f $VPS_APP_DIR/server/data/site-config-overrides.json ]; then cp $VPS_APP_DIR/server/data/site-config-overrides.json $BACKUP_DIR/; echo 'Configuration backed up to $BACKUP_DIR'; else echo 'No existing configuration found'; fi"

echo "✅ Configuration backup completed"

echo ""
echo "🔄 Step 4: Deploy Updated Code"
echo "=============================="

# Sync all project files
echo "📁 Copying project files to VPS..."

# Create temp directory for deployment
TEMP_DIR="/tmp/sfweb-deploy-$(date +%Y%m%d%H%M%S)"
run_on_vps "mkdir -p $TEMP_DIR"

# Copy entire project (excluding node_modules, .git, etc.)
rsync -avz --progress \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.npm-cache' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='__pycache__' \
    ./ $VPS_HOST:$TEMP_DIR/

# Move to production directory
run_on_vps "rm -rf $VPS_APP_DIR/* && mv $TEMP_DIR/* $VPS_APP_DIR/ && rmdir $TEMP_DIR"

echo "✅ Code deployment completed"

echo ""
echo "⚙️  Step 5: Verify Configuration Files"
echo "======================================"

# Verify critical files exist
run_on_vps "ls -la $VPS_APP_DIR/Dockerfile"
run_on_vps "ls -la $VPS_APP_DIR/docker-compose.yml"
run_on_vps "ls -la $VPS_APP_DIR/.env || echo 'WARNING: .env file not found - you may need to create it'"

# Verify the fixed Dockerfile includes server directory
if run_on_vps "grep -q 'COPY --from=builder /app/server ./server' $VPS_APP_DIR/Dockerfile"; then
    echo "✅ Dockerfile includes server directory copy"
else
    echo "❌ Dockerfile missing server directory copy - deployment may fail"
fi

# Verify docker-compose includes config volume
if run_on_vps "grep -q 'config_data:' $VPS_APP_DIR/docker-compose.yml"; then
    echo "✅ Docker-compose includes config_data volume"
else
    echo "❌ Docker-compose missing config_data volume - persistence may fail"
fi

echo ""
echo "🏗️  Step 6: Build and Start Production Services"
echo "==============================================="

# Build and start containers
run_on_vps "cd $VPS_APP_DIR && docker compose up -d --build"

echo "⏳ Waiting for services to start..."
sleep 30

# Check if containers are running
if run_on_vps "docker ps | grep -q sfweb"; then
    echo "✅ Production containers started successfully"
else
    echo "❌ Containers failed to start - checking logs..."
    run_on_vps "cd $VPS_APP_DIR && docker compose logs --tail=20"
    exit 1
fi

echo ""
echo "🔬 Step 7: Verify Configuration Persistence"
echo "==========================================="

# Test if config directory was created
if run_on_vps "docker exec sfweb-app ls -la /app/server/data/ 2>/dev/null"; then
    echo "✅ Configuration directory exists in container"
    
    # Check if config file was copied
    if run_on_vps "docker exec sfweb-app ls -la /app/server/data/site-config-overrides.json 2>/dev/null"; then
        echo "✅ Configuration file exists in container"
    else
        echo "⚠️  No configuration file found - will be created on first save"
    fi
else
    echo "❌ Configuration directory missing in container - check Dockerfile"
fi

echo ""
echo "🌐 Step 8: Test Production Endpoints"
echo "===================================="

# Wait a bit more for full startup
sleep 15

# CRITICAL: Test the LIVE domain first (what users actually see)
echo "🚨 CRITICAL: Testing LIVE DOMAIN (what users see):"
if curl -s -o /dev/null -w "%{http_code}" https://slyfox.co.za | grep -q "200"; then
    echo "✅ SUCCESS: Live domain https://slyfox.co.za is working (HTTP 200)"
    
    # Test specific new pages deployed
    echo "🆕 Testing newly deployed service pages:"
    
    if curl -s -o /dev/null -w "%{http_code}" https://slyfox.co.za/services/social-media | grep -q "200"; then
        echo "✅ Social Media service page working"
    else
        echo "❌ Social Media service page NOT working"
    fi
    
    if curl -s -o /dev/null -w "%{http_code}" https://slyfox.co.za/services/web-apps | grep -q "200"; then
        echo "✅ Web Apps service page working"
    else
        echo "❌ Web Apps service page NOT working"
    fi
    
else
    echo "❌ CRITICAL FAILURE: Live domain https://slyfox.co.za NOT WORKING"
    echo "   This means the deployment has FAILED - users cannot access the site"
    echo "   Checking Traefik connectivity and server binding..."
    
    # Test if container is responding internally
    if run_on_vps "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" | grep -q "200"; then
        echo "   ➜ Container responds internally - likely Traefik routing issue"
        echo "   ➜ Check: Traefik configuration, Docker networks, domain routing"
    else
        echo "   ➜ Container not responding internally - application startup issue"
        echo "   ➜ Check: Server binding (should be 0.0.0.0:5000), DOCKER_ENV variable"
    fi
    
    echo ""
    echo "🔧 IMMEDIATE DEBUGGING STEPS:"
    echo "1. Check Traefik logs: ssh $VPS_HOST 'docker logs traefik --tail 20'"
    echo "2. Check app logs: ssh $VPS_HOST 'cd $VPS_APP_DIR && docker logs sfweb-app --tail 20'"
    echo "3. Check networks: ssh $VPS_HOST 'docker network ls && docker inspect sfweb-app | grep -A 10 Networks'"
    echo "4. Check binding: ssh $VPS_HOST 'docker exec sfweb-app netstat -tulpn | grep 5000'"
    
    exit 1
fi

# Test API endpoint (secondary check)
echo "📡 Testing site configuration API..."
if run_on_vps "curl -s -f http://localhost:3000/api/site-config | head -10"; then
    echo "✅ Site configuration API responding"
else
    echo "❌ Site configuration API not responding"
    echo "Checking application logs..."
    run_on_vps "cd $VPS_APP_DIR && docker logs sfweb-app --tail=20"
fi

echo ""
echo "📊 Step 9: Production Status Summary"
echo "===================================="

run_on_vps "cd $VPS_APP_DIR && docker compose ps"
run_on_vps "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'"

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "🔗 Production URLs:"
echo "   🌐 LIVE SITE (users): https://slyfox.co.za"
echo "   🛠️  Admin Panel: https://slyfox.co.za/admin"
echo "   🔧 Direct Access: http://168.231.86.89:3000 (for debugging)"
echo ""
echo "📁 Important Paths:"
echo "   Application: $VPS_APP_DIR"
echo "   Backup: $BACKUP_DIR"
echo "   Logs: docker logs sfweb-app"
echo ""
echo "🔧 Management Commands:"
echo "   View Logs: ssh $VPS_USER@$VPS_HOST 'cd $VPS_APP_DIR && docker compose logs -f'"
echo "   Restart: ssh $VPS_USER@$VPS_HOST 'cd $VPS_APP_DIR && docker compose restart'"
echo "   Stop: ssh $VPS_USER@$VPS_HOST 'cd $VPS_APP_DIR && docker compose down'"
echo ""
echo "✨ Configuration management should now work correctly!"
echo "   🎯 Test at: https://slyfox.co.za/admin → Site Management"
echo ""
echo "🚨 CRITICAL: Always verify https://slyfox.co.za works before considering deployment successful!"