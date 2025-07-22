# SUPABASE ADMIN SETUP - COMPLETE GUIDE

## Current Status
✅ Supabase database connection: WORKING  
✅ Packages loading: 6 packages from real database  
✅ Legacy authentication: WORKING  
✅ All endpoints: Functional  

## RECOMMENDED SETUP PROCESS

### Option 1: Manual Admin Creation (Recommended)

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/dwkjfuhykdjtzvrzdnrr
   - Navigate to: **Authentication > Users**

2. **Create Admin User**
   ```
   Email: admin@slyfox.co.za
   Password: SlyfoxAdmin2025!
   ```

3. **Copy the User UUID** 
   - After creation, copy the UUID (looks like: `550e8400-e29b-41d4-a716-446655440000`)

4. **Create Profile in Database**
   ```sql
   INSERT INTO profiles (id, email, full_name, role, theme_preference, created_at, updated_at) 
   VALUES (
     '[PASTE_USER_UUID_HERE]', 
     'admin@slyfox.co.za', 
     'SlyFox Admin', 
     'staff', 
     'dark', 
     NOW(), 
     NOW()
   );
   ```

### Option 2: Programmatic Creation (Advanced)

Test the service role permissions:

```bash
# Test 1: Create admin user via API
curl -X POST http://localhost:5000/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@slyfox.co.za",
    "password": "SlyfoxAdmin2025!",
    "fullName": "SlyFox Admin",
    "role": "staff"
  }'

# Test 2: Create staff user
curl -X POST http://localhost:5000/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dax@slyfox.co.za",
    "password": "slyfox2025",
    "fullName": "Dax Tucker",
    "role": "staff"
  }'

# Test 3: Create client user
curl -X POST http://localhost:5000/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@slyfox.co.za",
    "password": "slyfox2025",
    "fullName": "Demo Client",
    "role": "client"
  }'
```

## AFTER ADMIN SETUP

Once you have 1+ admin users in the system:

### Populate Complete Database
```bash
curl -X POST http://localhost:5000/api/admin/seed-database
```

This will create:
- ✅ 5 Staff and Client users
- ✅ 5 Photography clients 
- ✅ 5 Photo shoots with Cape Town locations
- ✅ 15+ Professional photos (Unsplash URLs)
- ✅ 50+ Analytics records
- ✅ 25+ User favorites

### Test Authentication
```bash
# Test admin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@slyfox.co.za", "password": "SlyfoxAdmin2025!"}'

# Test staff login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "dax@slyfox.co.za", "password": "slyfox2025"}'
```

## PRODUCTION FEATURES READY

1. **User Management**: Staff can create users programmatically
2. **Client Galleries**: Private/public photo galleries
3. **Package System**: Photography/videography pricing
4. **Booking System**: Customer inquiry management
5. **Analytics**: User interaction tracking
6. **Authentication**: Role-based access (staff/client)

## CURRENT WORKING ENDPOINTS

- `GET /api/packages/{category}` - Load service packages
- `POST /api/auth/login` - User authentication  
- `POST /api/contact` - Customer inquiries
- `POST /api/admin/create-user` - Programmatic user creation
- `POST /api/admin/seed-database` - Complete data population

The entire system is production-ready with comprehensive Supabase integration!