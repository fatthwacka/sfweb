# Quick Manual Setup - Bypass Service Role Issues

Since you're getting "Database error creating new user", let's use the manual approach:

## Step 1: Create Admin User in Supabase Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/dwkjfuhykdjtzvrzdnrr
2. **Navigate to**: Authentication > Users  
3. **Click**: "Add User"
4. **Fill in**:
   - Email: `admin@slyfox.co.za`
   - Password: `SlyfoxAdmin2025!`
   - Confirm email: ✅ Yes
5. **Click**: "Create User"
6. **Copy the UUID** from the new user (looks like: `a1b2c3d4-5e6f-7890-abcd-ef1234567890`)

## Step 2: Create Profile in Database

Once you have the UUID, I'll create the profile for you. Just paste the UUID here and I'll run:

```sql
INSERT INTO profiles (id, email, full_name, role, theme_preference, created_at, updated_at) 
VALUES (
  '[YOUR_UUID_HERE]', 
  'admin@slyfox.co.za', 
  'SlyFox Admin', 
  'staff', 
  'dark', 
  NOW(), 
  NOW()
);
```

## Step 3: Populate Database

After that's done, I'll run the complete database population:

```bash
curl -X POST http://localhost:5000/api/admin/seed-database
```

This will create all the realistic dummy data:
- Staff and client users
- Photography clients  
- Photo shoots with Cape Town locations
- Professional images with Unsplash URLs
- Analytics and user interactions

## Step 4: Test Everything

We'll test authentication and all endpoints to ensure everything works perfectly.

**Ready to proceed? Just create the admin user and give me the UUID!**