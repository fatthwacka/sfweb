# Supabase Service Role Permissions Fix

## Issue
"Database error creating new user" means the service role key lacks proper permissions.

## Solution Steps

### 1. Check Service Role Key in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/dwkjfuhykdjtzvrzdnrr/settings/api
2. Verify your service role key matches what's in Replit Secrets
3. The service role key should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. Enable Auth Admin in Supabase

1. Go to: **Authentication > Settings > Auth Providers**
2. Scroll to **Advanced Settings**
3. Enable: **"Allow service role to bypass RLS"**
4. Save changes

### 3. Check RLS Policies (if needed)

If you have Row Level Security enabled on auth.users:

```sql
-- Run this in Supabase SQL Editor to allow service role
CREATE POLICY "Service role can manage users" ON auth.users
FOR ALL USING (true)
WITH CHECK (true);
```

### 4. Alternative: Manual User Creation

If service role permissions can't be fixed immediately:

1. Go to: **Authentication > Users**
2. Click **"Add User"**
3. Create:
   - Email: `admin@slyfox.co.za`
   - Password: `SlyfoxAdmin2025!`
   - Confirm email: **Yes**
4. Copy the UUID from the users table
5. Run this SQL in Supabase SQL Editor:

```sql
-- Replace UUID_FROM_STEP_4 with the actual UUID
INSERT INTO profiles (id, email, full_name, role, theme_preference, created_at, updated_at) 
VALUES (
  'UUID_FROM_STEP_4', 
  'admin@slyfox.co.za', 
  'SlyFox Admin', 
  'staff', 
  'dark', 
  NOW(), 
  NOW()
);
```

### 5. Test After Fix

```bash
# Test user creation
curl -X POST http://localhost:5000/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dax@slyfox.co.za",
    "password": "slyfox2025",
    "fullName": "Dax Tucker",
    "role": "staff"
  }'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@slyfox.co.za", "password": "SlyfoxAdmin2025!"}'
```

## Root Cause
Supabase restricts user creation to prevent abuse. The service role needs explicit permissions to use the auth admin API.