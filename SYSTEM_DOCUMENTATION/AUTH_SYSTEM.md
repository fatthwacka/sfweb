# Authentication System Architecture

## Current Implementation (September 2025) ✅ VERIFIED

**Authentication Method**: Server-side Supabase integration with React state management
**Status**: Fully functional, runtime errors resolved
**Database**: PostgreSQL with Supabase Auth integration

### Core Architecture

#### Frontend Layer (`client/src/hooks/use-auth.tsx`)
- **React Context**: Provides authentication state across app
- **localStorage Persistence**: User session persists across browser sessions
- **State Management**: `useState` for user object and loading states
- **Auto-restore**: Automatically loads user from localStorage on app init
- **Methods**: `login(email, password)`, `logout()`, `signOut()` (alias)

#### Backend Layer (`server/routes.ts`)
- **Supabase Auth**: Real authentication via `supabase.auth.signInWithPassword()`
- **Profile Resolution**: Queries `profiles` table for user role and metadata
- **API Endpoints**: `/api/auth/login`, `/api/auth/logout`
- **Response Format**: Returns user object with role, email, fullName, profileImage

#### UI Components (`client/src/components/ui/auth-button.tsx`)
- **Modal-based Login**: Dialog with email/password form
- **User Dropdown**: Avatar with role-based menu items
- **Navigation Integration**: Dashboard and Admin Panel links based on role
- **Toast Integration**: Success/error notifications

### Database Schema (`shared/schema.ts`)
```typescript
profiles: {
  id: string (UUID, primary key)
  email: string (unique)
  role: "client" | "staff" | "super_admin"
  fullName?: string
  profileImage?: string
  themePreference?: string
}
```

### Role-Based Access Control
- **client**: Gallery access, client portal, image selection
- **staff**: Admin panel access, content management
- **super_admin**: Full system access, user management

### Session Management
- **Storage**: localStorage with key "user"
- **Format**: JSON serialized user object
- **Restoration**: `useEffect` hook on mount checks localStorage
- **Security**: Server validates all authenticated requests
- **Logout**: Clears localStorage and redirects to home (`window.location.href = "/"`)

### Environment Configuration
```bash
# Required Environment Variables (Updated December 2025)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

### Data Flow (Verified)
1. User submits credentials via AuthButton modal
2. `login(email, password)` called from useAuth hook
3. POST request to `/api/auth/login` with credentials
4. Server calls `supabase.auth.signInWithPassword(email, password)`
5. Server queries `profiles` table for user role/metadata
6. Server returns complete user object to client
7. Client stores in localStorage and React state
8. UI updates with role-based navigation options

### Recent Fixes (September 2025)
- **Runtime Error**: Disabled `@replit/vite-plugin-runtime-error-modal` causing Chrome conflicts
- **File Cleanup**: Removed conflicting auth files (`lib/auth.tsx`, `lib/supabase.ts`, `login-modal.tsx`)
- **useLocation Hook**: Fixed array destructuring pattern in auth-button.tsx
- **Development Stability**: Resolved Vite cache conflicts from deleted dependencies

### Active Files ✅
- `client/src/hooks/use-auth.tsx` - Primary authentication hook
- `client/src/components/ui/auth-button.tsx` - Login UI and user menu
- `server/routes.ts` - Authentication API endpoints
- `shared/schema.ts` - Database schema definitions

### Deleted Files ❌ (Cleaned up Sept 2025)
- `client/src/lib/auth.tsx` - Legacy conflicting auth system
- `client/src/lib/supabase.ts` - Mock client (real client is server-side)
- `client/src/components/auth/login-modal.tsx` - Unused modal component

## Security Updates (December 2025) 🔒

### Supabase API Key Migration ✅ COMPLETED
**Migration Date**: December 29, 2025
**Status**: Production ready

#### New Key System (2024+ Standard)
- **Frontend (Client)**: `VITE_SUPABASE_PUBLISHABLE_KEY` - Safe for browser exposure
- **Backend (Server)**: `SUPABASE_SECRET_KEY` - Server-only, full admin access
- **Legacy Support**: Old `VITE_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` patterns removed

#### Security Improvements
1. **Git Tracking**: `.env` files properly gitignored to prevent credential exposure
2. **Pre-commit Hooks**: Automated scanning to prevent accidental secret commits
3. **Environment Validation**: Server startup validates all required keys are present
4. **Key Rotation Ready**: New key format supports easier rotation without code changes

#### Updated Files ✅
- All server-side Supabase clients updated to new key format
- Docker compose environment mappings updated
- Production deployment templates updated
- Development and testing scripts updated

#### Safety Measures
- **Hardcoded Key Prevention**: Pre-commit hooks scan for hardcoded credentials
- **Environment Verification**: Startup logs confirm key configuration without exposing values
- **Documentation Updates**: All references to old key names updated in docs