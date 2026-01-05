# Production Secrets Setup Guide

## 🔐 Problem Solved
Your contact form and other services fail in production because environment variables are missing on the VPS.

## 🚀 Ultra-Safe Solution (No Deployment Risk)

### Step 1: Copy Template to VPS
```bash
# Copy the template to VPS
scp .env.production.template slyfox-vps:/opt/sfweb/.env.template

# Connect to VPS
ssh slyfox-vps

# Navigate to app directory
cd /opt/sfweb

# Copy template to actual .env file
cp .env.template .env

# Secure the file
chmod 600 .env
```

### Step 2: Fill in Your Production Values
```bash
# Edit the .env file on VPS
nano .env
```

**Fill in these critical values:**

1. **DATABASE_URL** - Get from your working production setup
2. **SMTP_EMAIL** - `dax.tucker@gmail.com` 
3. **SMTP_PASSWORD** - Your Gmail app password (NOT regular password)
4. **RECAPTCHA_SECRET_KEY** - From Google reCAPTCHA console
5. **DROPBOX_ACCESS_TOKEN** - Current working token
6. **VITE_SUPABASE_URL** - Your Supabase project URL
7. **VITE_SUPABASE_PUBLISHABLE_KEY** - Supabase publishable key (sb_publishable_...)
8. **SUPABASE_SECRET_KEY** - Supabase secret key (sb_secret_...)

### Step 3: Test Without Deployment
```bash
# Check environment is loaded
cd /opt/sfweb
docker compose -f docker-compose.yml -f docker-compose.prod.yml config | grep -E "SMTP_EMAIL|NODE_ENV"

# Should show your actual values (not ${SMTP_EMAIL})
```

### Step 4: Restart Services (Safe)
```bash
# Restart to pick up new environment
cd /opt/sfweb
docker compose restart app

# Wait 30 seconds for startup
sleep 30

# Test contact form
curl -X POST https://slyfox.co.za/api/contact \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","message":"Test message"}'
```

## 🚨 Critical Security Notes

1. **File Permissions**: `chmod 600 .env` (only root can read)
2. **Never Commit**: Add `.env` to `.gitignore` (already done)
3. **Backup Securely**: Store credentials in password manager
4. **Rotate Regularly**: Change passwords/tokens quarterly

## 🔄 Dropbox Token Refresh Issue

**Known Problem**: Dropbox tokens expire every 4 hours  
**Short-term**: Manual token refresh as needed  
**Long-term**: Implement refresh token flow (separate task)

## ✅ Verification Checklist

After setup:
- [ ] Contact form sends emails successfully
- [ ] reCAPTCHA validation works
- [ ] Supabase operations function (auth, storage, database)
- [ ] No "undefined" errors in logs
- [ ] Environment variables show real values (not ${VAR})

## 🚫 What This DOESN'T Change

- ✅ No changes to docker-compose files
- ✅ No changes to deployment script
- ✅ No changes to Traefik configuration
- ✅ No risk to working deployment
- ✅ Can be reversed by deleting .env file