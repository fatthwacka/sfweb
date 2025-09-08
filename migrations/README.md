# Database Migration Instructions

## Overview
These migrations set up the complete SlyFox Studios database with security policies and preview selection functionality:

1. **001_enable_rls.sql** - Enables Row Level Security (RLS) and creates helper functions
2. **002_rls_policies.sql** - Creates comprehensive security policies based on role hierarchy: `client` → `staff` → `super_admin`
3. **003_add_preview_tables.sql** - Adds client image preview selection system

## Deployment Options

### Option 1: Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run migrations in order:
   - Copy and paste the contents of `001_enable_rls.sql` → Click **Run**
   - Copy and paste the contents of `002_rls_policies.sql` → Click **Run**
   - Copy and paste the contents of `003_add_preview_tables.sql` → Click **Run**

**Note**: If migrations 001 and 002 are already applied, you can run only migration 003.

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset  # Optional: reset to clean state
supabase db push   # Push schema changes

# Run migrations in order
psql "your-database-connection-string" -f migrations/001_enable_rls.sql
psql "your-database-connection-string" -f migrations/002_rls_policies.sql
psql "your-database-connection-string" -f migrations/003_add_preview_tables.sql
```

### Option 3: Direct PostgreSQL Connection
```bash
# Connect to your Supabase PostgreSQL instance
psql "postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"

# Run migrations in order
\i migrations/001_enable_rls.sql
\i migrations/002_rls_policies.sql
\i migrations/003_add_preview_tables.sql
```

## Policy Summary

### Security Model
- **Public Access**: Bookings (contact forms), active packages, non-private galleries
- **User Access**: Own profile, own favorites, own analytics, galleries they're assigned to
- **Staff Access**: All clients, shoots, images, packages, bookings (read/write)
- **Super Admin Access**: All tables including user management (full CRUD)

### Key Features
- **Client Gallery Access**: Clients can view shoots assigned to their email address
- **Privacy Controls**: Private shoots/images only visible to staff/admin
- **Public Galleries**: Non-private content accessible to everyone
- **Analytics Tracking**: Public insertion for visitor tracking, admin management
- **Contact Forms**: Public booking insertion, staff management

## Validation

After running the migrations, verify RLS is working:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Test access (run as different user roles)
SELECT * FROM profiles; -- Should respect role-based access
SELECT * FROM shoots WHERE "isPrivate" = false; -- Should be publicly accessible
```

## Troubleshooting

If you encounter issues:
1. **Permission Denied**: Ensure you're connected as a superuser or have appropriate privileges
2. **Function Already Exists**: Drop existing helper functions first if re-running
3. **Policy Conflicts**: Drop existing policies before creating new ones

## Rollback

If you need to disable RLS:
```sql
-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- Drop helper functions
DROP FUNCTION IF EXISTS get_user_role();
DROP FUNCTION IF EXISTS is_admin_or_staff();
DROP FUNCTION IF EXISTS is_super_admin();
```