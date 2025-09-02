# Site Configuration JSON VPS Rules

**⚠️ CRITICAL: This document captures hard-learned lessons about production configuration sync issues and their solutions.**

## 🚨 The Problem: Docker Volume vs Filesystem Sync Issues

### What Happened (2025-09-01)
During a routine configuration sync from development to production, we discovered that the standard approach of updating the host filesystem config file **does not automatically sync to the running Docker container** due to volume mounting behavior.

**Symptoms:**
- Host file updated successfully: `/opt/sfweb/server/data/site-config-overrides.json` (timestamp: 20:24)
- Container file remained old: `/app/server/data/site-config-overrides.json` (timestamp: 13:11) 
- API continued serving cached/old configuration data
- Site showed outdated team member descriptions despite "successful" file updates

### Root Cause Analysis
**Docker Volume Persistence Issue**: The `config_data` Docker volume preserves the container's internal file even when the host filesystem file is updated. The container does not automatically reload the config file from the host mount.

## ✅ The Solution: Multi-Step Container Sync Process

### **MANDATORY Production Config Sync Process**

When syncing configuration from development to production, **NEVER assume a simple file copy is sufficient**. Always follow this complete process:

#### **Step 1: Safe Container Stop**
```bash
ssh slyfox-vps "cd /opt/sfweb && docker compose down"
```
**Why**: Prevents file locking and ensures clean restart with new config.

#### **Step 2: Update Host Filesystem**
```bash
# Copy development config to production host
scp /tmp/dev-config-sync.json slyfox-vps:/tmp/new-config.json
ssh slyfox-vps "cp /tmp/new-config.json /opt/sfweb/server/data/site-config-overrides.json"
```
**Why**: Updates the persistent host file that should be the source of truth.

#### **Step 3: Restart Containers**
```bash
ssh slyfox-vps "cd /opt/sfweb && docker compose up -d"
```
**Why**: Starts fresh containers that should read from updated host config.

#### **Step 4: CRITICAL - Force Container File Sync**
```bash
ssh slyfox-vps "docker cp /opt/sfweb/server/data/site-config-overrides.json sfweb-app:/app/server/data/site-config-overrides.json"
```
**Why**: **MOST CRITICAL STEP** - Directly overwrites the container's internal config file to match the host file.

#### **Step 5: Final Container Restart**
```bash
ssh slyfox-vps "cd /opt/sfweb && docker compose restart app"
```
**Why**: Forces the application to reload configuration from the updated file.

#### **Step 6: Cache Purge Wait**
```bash
echo "Waiting 60 seconds for production cache purge..." && sleep 60
```
**Why**: Allows application-level caching to clear and serve fresh config data.

#### **Step 7: Verification**
```bash
# Test specific config changes
curl -s https://slyfox.co.za/api/site-config | jq -r '.about.team.members[] | select(.name=="Kyle Wiesner") | .description'

# Verify site health
curl -s -o /dev/null -w '%{http_code}' https://slyfox.co.za
```
**Expected**: Updated configuration data and HTTP 200 response.

## 🚫 What DOESN'T Work

### **❌ API-Only Approach**
```bash
# This FAILED due to permission errors
curl -X PATCH https://slyfox.co.za/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d @/tmp/dev-config.json
```
**Error**: `EACCES: permission denied, open '/tmp/tmp-...'` - API cannot write temporary files.

### **❌ Simple Host File Update**
```bash
# This is INSUFFICIENT 
scp config.json slyfox-vps:/opt/sfweb/server/data/site-config-overrides.json
```
**Problem**: Container continues using cached internal file, ignoring host file changes.

### **❌ Single Container Restart**
```bash
# This is INSUFFICIENT
docker compose restart app
```
**Problem**: Container may restart with cached volume data, not reading updated host file.

## 🔍 Debugging Tools

### **Check File Sync Status**
```bash
# Compare timestamps between host and container
echo "HOST:" && ssh slyfox-vps "ls -la /opt/sfweb/server/data/site-config-overrides.json"
echo "CONTAINER:" && ssh slyfox-vps "docker exec sfweb-app ls -la /app/server/data/site-config-overrides.json"
```
**Expected**: Both files should have identical timestamps after successful sync.

### **Verify Configuration Content**
```bash
# Check specific config in container
ssh slyfox-vps "docker exec sfweb-app cat /app/server/data/site-config-overrides.json | jq -r '.about.team.members[] | select(.name==\"Kyle Wiesner\") | .description'"
```

### **Monitor Container Status**
```bash
# Ensure containers are running properly
ssh slyfox-vps "cd /opt/sfweb && docker compose ps"
```

## 📋 Integration with Deployment Process

### **When to Use This Process**

**✅ ALWAYS use this process when:**
- Syncing admin dashboard changes from development to production
- Team member descriptions have been updated
- Hero slides, contact information, or any configuration has changed in development
- After any deployment where configuration drift is suspected

**⚠️ Required for these configuration types:**
- Team member profiles and descriptions
- Hero slides and homepage content  
- Contact information and business details
- Photography category page content
- Section colors and gradients
- Any admin dashboard modifications

### **Time Requirements**
- **Total Process Time**: ~5-8 minutes
- **Site Downtime**: ~2-3 minutes during container restart phases
- **Cache Clear Time**: 60 seconds
- **Verification Time**: 1-2 minutes

### **Success Criteria**
✅ Host and container files have identical timestamps  
✅ API returns updated configuration data  
✅ Live site displays updated content  
✅ No HTTP errors or application failures  
✅ Container logs show successful startup without errors

## 🚨 Emergency Recovery

### **If Configuration Sync Fails**
```bash
# 1. Restore from backup
ssh slyfox-vps "cp /opt/sfweb-backup-[TIMESTAMP]/site-config-overrides.json /opt/sfweb/server/data/"

# 2. Force container sync
ssh slyfox-vps "docker cp /opt/sfweb/server/data/site-config-overrides.json sfweb-app:/app/server/data/site-config-overrides.json"

# 3. Restart and verify
ssh slyfox-vps "cd /opt/sfweb && docker compose restart app"
curl -s https://slyfox.co.za/api/site-config | jq '.contact.business.name'
```

### **If Site Becomes Unresponsive**
```bash
# Check container status
ssh slyfox-vps "cd /opt/sfweb && docker compose ps"

# Check application logs
ssh slyfox-vps "cd /opt/sfweb && docker compose logs app --tail 20"

# Nuclear restart if needed
ssh slyfox-vps "cd /opt/sfweb && docker compose down && docker compose up -d"
```

## 💡 Key Lessons Learned

1. **Docker volumes preserve container state** even when host files change
2. **API configuration updates can fail** due to filesystem permissions
3. **Container restarts may use cached data** without forced file sync
4. **Application-level caching requires time** to clear after config changes
5. **Multi-step verification is essential** - never assume success without testing
6. **The `docker cp` command is critical** for forcing container file updates

## 🔄 Future Improvements

### **Potential Automation**
Consider adding this process to the deployment script as a `--sync-config` flag:

```bash
./deploy-production.sh --sync-config
```

### **Configuration Monitoring**
Implement configuration drift detection between environments:

```bash
# Compare development vs production config
diff <(curl -s http://localhost:3000/api/site-config | jq -S) \
     <(curl -s https://slyfox.co.za/api/site-config | jq -S)
```

---

**⚠️ CRITICAL REMINDER**: Always test configuration changes on a development environment first, and always have a backup strategy before making production changes.