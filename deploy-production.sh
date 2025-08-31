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
echo "🛑 Step 2: Stop Current Production Services"
echo "============================================"

# Stop existing containers gracefully
run_on_vps "cd $VPS_APP_DIR && docker-compose down || echo 'No containers to stop'"

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
run_on_vps "cd $VPS_APP_DIR && docker-compose up -d --build"

echo "⏳ Waiting for services to start..."
sleep 30

# Check if containers are running
if run_on_vps "docker ps | grep -q sfweb"; then
    echo "✅ Production containers started successfully"
else
    echo "❌ Containers failed to start - checking logs..."
    run_on_vps "cd $VPS_APP_DIR && docker-compose logs --tail=20"
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

# Test API endpoint
echo "Testing site configuration API..."
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

run_on_vps "cd $VPS_APP_DIR && docker-compose ps"
run_on_vps "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'"

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "🔗 Production URLs:"
echo "   Main Site: http://$VPS_HOST:3000"
echo "   Admin Panel: http://$VPS_HOST:3000/admin"
echo ""
echo "📁 Important Paths:"
echo "   Application: $VPS_APP_DIR"
echo "   Backup: $BACKUP_DIR"
echo "   Logs: docker logs sfweb-app"
echo ""
echo "🔧 Management Commands:"
echo "   View Logs: ssh $VPS_USER@$VPS_HOST 'cd $VPS_APP_DIR && docker-compose logs -f'"
echo "   Restart: ssh $VPS_USER@$VPS_HOST 'cd $VPS_APP_DIR && docker-compose restart'"
echo "   Stop: ssh $VPS_USER@$VPS_HOST 'cd $VPS_APP_DIR && docker-compose down'"
echo ""
echo "✨ Configuration management should now work correctly!"
echo "   Test at: http://$VPS_HOST:3000/admin → Site Management"