# SlyFox Studios - Supabase Setup Guide

## Required Configuration Steps

### 1. Create Initial Admin User in Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard/project/dwkjfuhykdjtzvrzdnrr
2. Navigate to **Authentication > Users**
3. Click **Add User** and create the admin account:

```
Email: admin@slyfox.co.za
Password: SlyfoxAdmin2025!
```

4. After creation, copy the UUID from the Users table (looks like: `550e8400-e29b-41d4-a716-446655440000`)

### 2. Configure Row Level Security (RLS) Policies

Execute these SQL commands in your Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE shoots ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create policy for staff to manage all data
CREATE POLICY "Staff can manage all data" ON profiles
FOR ALL USING (
  auth.jwt() ->> 'role' = 'staff' OR 
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'staff'
  )
);

CREATE POLICY "Staff can manage all clients" ON clients
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'staff'
  )
);

CREATE POLICY "Staff can manage all shoots" ON shoots
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'staff'
  )
);

-- Clients can only view their own data
CREATE POLICY "Clients can view own data" ON clients
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Clients can view own shoots" ON shoots
FOR SELECT USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Public access to non-private shoots and images
CREATE POLICY "Public can view non-private shoots" ON shoots
FOR SELECT USING (is_private = false);

CREATE POLICY "Public can view non-private images" ON images
FOR SELECT USING (
  is_private = false AND 
  shoot_id IN (SELECT id FROM shoots WHERE is_private = false)
);
```

### 3. Service Role Permissions

Ensure your service role key has these permissions in Supabase Dashboard > Settings > API:

- ✅ `auth.admin.createUser`
- ✅ `auth.admin.deleteUser` 
- ✅ `auth.admin.updateUser`
- ✅ Database read/write access
- ✅ Storage bucket access (for future image uploads)

### 4. Environment Variables Verification

Confirm these are set in your Replit Secrets:

```
DATABASE_URL=postgresql://postgres.dwkjfuhykdjtzvrzdnrr:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
VITE_SUPABASE_URL=https://dwkjfuhykdjtzvrzdnrr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Post-Setup API Endpoints

### Create Staff User
```bash
curl -X POST http://localhost:5000/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dax@slyfox.co.za",
    "password": "slyfox2025",
    "fullName": "Dax Tucker", 
    "role": "staff"
  }'
```

### Create Client User
```bash
curl -X POST http://localhost:5000/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@slyfox.co.za",
    "password": "slyfox2025",
    "fullName": "Demo Client",
    "role": "client"
  }'
```

### Populate Database with Complete Dummy Data
```bash
curl -X POST http://localhost:5000/api/admin/seed-database
```

## Testing Authentication

```bash
# Test staff login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@slyfox.co.za", "password": "SlyfoxAdmin2025!"}'

# Test client login  
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@slyfox.co.za", "password": "slyfox2025"}'
```

## Expected Results

After setup completion:
- ✅ 1 Admin user in auth.users
- ✅ 5+ Staff/Client users created programmatically
- ✅ 5 Clients with realistic data
- ✅ 5 Photo shoots with Cape Town locations
- ✅ 15+ Professional images with Unsplash URLs
- ✅ 50+ Analytics records
- ✅ 25+ User favorites
- ✅ 6 Photography/Videography packages
- ✅ 4 Customer booking inquiries

## Production Deployment Notes

- RLS policies protect sensitive data
- Service role key enables staff user management
- Authentication flows work for both staff and clients
- All data relationships properly maintained
- Gallery system fully functional with real image URLs