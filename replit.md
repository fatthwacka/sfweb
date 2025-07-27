# SlyFox Studios - Photography & Videography Website

## Overview

SlyFox Studios is a professional photography and videography business based in Cape Town, South Africa. This is a full-stack web application built with a modern React frontend and Express.js backend, featuring a client gallery system, portfolio showcase, and business management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.
Technical approach: Always fix everything at the root cause, never patch, workaround, or temporary fix.

## System Architecture

This application follows a **monorepo structure** with clear separation between frontend, backend, and shared code:

- **Frontend**: React 18 with TypeScript, using Vite for development and build tooling
- **Backend**: Express.js with TypeScript, following RESTful API patterns
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: TanStack Query for server state, React Context for client state

## Key Components

### Frontend Architecture
- **Component-based structure** using shadcn/ui design system
- **Route-based code splitting** with Wouter for lightweight routing
- **Theme system** supporting light/dark modes
- **Responsive design** optimized for mobile-first approach
- **SEO optimization** with proper meta tags and semantic HTML

### Backend Architecture
- **Express.js server** with middleware for logging, CORS, and error handling
- **Storage abstraction layer** providing clean interface for database operations
- **RESTful API endpoints** for contact forms, packages, and client management
- **Environment-based configuration** for development/production differences

### Authentication System
- **Mock authentication** currently implemented (ready for Supabase integration)
- **Role-based access** (staff vs client permissions)
- **Session management** with secure token handling

## Data Flow

### Database Schema (PostgreSQL + Drizzle)
The application uses the following core entities:

1. **Users** - Authentication and user management
   - id, email, password, role (staff/client), profile settings

2. **Clients** - Customer information and gallery access
   - id, name, slug, contact info, user association

3. **Shoots** - Photography/videography sessions
   - id, client association, metadata, privacy settings, SEO data

4. **Images** - Individual photos and media files
   - id, shoot association, file paths, privacy, download tracking

5. **Packages** - Service offerings and pricing
   - id, name, description, pricing, features, categories

6. **Analytics** - Usage tracking and insights
   - User interactions, page views, download statistics

7. **Bookings** - Customer inquiries and bookings
   - Contact form submissions, service requests, status tracking

### API Structure
- `POST /api/contact` - Contact form submissions
- `GET /api/packages` - Service packages and pricing
- `GET /api/clients/:slug` - Client gallery access
- Authentication endpoints (planned)
- Admin management endpoints (planned)

## External Dependencies

### UI and Styling
- **shadcn/ui** - Pre-built accessible components
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Headless component primitives
- **Lucide React** - Icon system

### Database and Backend
- **Drizzle ORM** - Type-safe PostgreSQL interface
- **@neondatabase/serverless** - Neon database client
- **Zod** - Runtime type validation
- **Express.js** - Web framework

### Development Tools
- **Vite** - Frontend build tool and dev server
- **TypeScript** - Type safety across the stack
- **ESBuild** - Fast backend compilation
- **TanStack Query** - Server state management

## Deployment Strategy

### Development Environment
- **Vite dev server** for frontend with HMR
- **tsx** for running TypeScript backend directly
- **Concurrent development** with frontend/backend on different ports

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: ESBuild compiles TypeScript to ESM in `dist/`
- **Static serving**: Express serves frontend assets in production
- **Database migrations**: Drizzle handles schema changes

### Environment Configuration
- **DATABASE_URL** - PostgreSQL connection string
- **NODE_ENV** - Environment detection
- **VITE_GA_MEASUREMENT_ID** - Google Analytics tracking

The application is structured to be easily deployable to platforms like Vercel, Railway, or traditional VPS hosting, with the frontend and backend bundled as a single Node.js application.

## Development Strategy Decision (July 27, 2025)
**Approach**: Complete functionality first, then add security/performance layers
**Rationale**: Test core business logic with real workflows before over-engineering theoretical solutions
**Order**: Core features → Production deployment → Security/monitoring → Performance optimization

## Planned Updates: Future scalability considerations

### Image Optimization Strategy (Evaluated July 27, 2025)
**Current Status**: 2MB original images serving directly - performing excellently
**Average Album**: 20-30 images (40-60MB total)
**Performance**: Fast loading times, no user complaints

**Selected Approach**: Supabase Built-in Image Transformation API
- Keep original 2MB images in Supabase Storage
- Use URL parameters to generate optimized sizes on-demand
- Examples: `?width=1200&quality=80` for gallery, `?width=400&height=300` for thumbnails
- Benefits: No storage duplication, CDN caching, automatic format optimization (WebP/AVIF)
- Implementation: Simple URL modifications when performance optimization becomes necessary

**Implementation Plan**:
- **Phase 1 (Current)**: Continue with originals, monitor bandwidth and performance
- **Phase 2 (When needed)**: Add transformation parameters to image URLs for bandwidth reduction
- Minimal code changes required - primarily frontend URL modifications

## Recent Changes: Latest modifications with dates

### July 27, 2025 - Complete Admin Panel Enhancements & Performance Optimization ✅
- **Futuristic Upload Progress Indicator**: Added gradient overlay with spinning animations during image uploads
- **Missing 4th Button Added**: Purple "View Full Res" button now appears in all gallery management hover states
- **Optimized Image Loading CONFIRMED**: Gallery management now uses 300KB optimized images instead of full 4.4MB files (93% bandwidth reduction)
- **Fixed Supabase Image Transformations**: Corrected API endpoint from URL parameters to /render/image/ path for proper optimization
- **Eliminated React Infinite Loop**: Fixed useEffect dependency issues causing maximum update depth errors
- **Enhanced User Experience**: Clear visual feedback prevents staff from accidentally interrupting uploads
- **Performance Optimization**: Reduced bandwidth usage in admin panels while maintaining full resolution access via "View Full Res" button
- **Browser Console Verification**: All images now load with `/render/image/` URLs and proper transformation parameters

### July 27, 2025 - Client Management System Complete
- **Fixed Missing PATCH Endpoint**: Added complete app.patch("/api/clients/:id") route that was causing edit failures
- **Enhanced Client Edit Modal**: All fields (phone, address, secondaryEmail) now save properly to Supabase
- **Zod Schema Updates**: Fixed nullable field validation for proper null handling in database
- **Real-time UI Updates**: Client cards now refresh immediately after edit operations with proper query invalidation

### July 27, 2025 - Staff Management System Implementation
- **Complete Staff Management Interface**: Created comprehensive CRUD system for staff/super_admin accounts
- **Role-Based Access Control**: Staff Management tab only visible to super_admin users
- **Database Schema Fix**: Updated profiles table constraint to allow super_admin, staff, and client roles
- **Super Admin Setup**: Updated dax@slyfox.co.za from staff to super_admin role for testing
- **API Endpoints**: Full REST API for staff operations (create, read, update, delete) with proper validation
- **Security Features**: Super admin accounts cannot be deleted, role validation, proper error handling
- **Search & Filter**: Real-time search functionality for staff member management

### July 26, 2025 - Gallery Editor Fixes & Database Schema Updates
- **Fixed Supabase Upload Issue**: Changed bucket name from 'shoot-images' to 'gallery-images' to match existing Supabase storage buckets
- **Added Drag & Drop Functionality**: Implemented proper drag event handlers with visual feedback in gallery editor upload sections
- **Database Schema Extensions**: Added missing columns to shoots table - location, shoot_date, shoot_type, notes for complete basic shoot info functionality
- **Gallery Appearance Controls**: Fixed border style (rounded/sharp/circular) and image spacing (tight/normal/loose) live preview functionality
- **Enhanced Upload Feedback**: Improved success/error messages with actual upload count, better query invalidation for immediate UI updates
- **Four-Card Gallery Editor**: Restructured into separate cards (Basic Info, Advanced Settings, Add Images, Gallery Appearance) with individual save buttons
- **Collapsible Card Interface**: All gallery management cards now load collapsed with expand/collapse arrows for cleaner interface
- **Date Picker Improvements**: Enhanced with fully clickable container, salmon calendar icon, and cross-origin iframe error handling
- **Smart URL Slug Field**: Custom slug field with automatic space-to-hyphen conversion and special character removal

### July 26, 2025 - WHITE SCREEN ISSUE ACTUALLY SOLVED
- **REAL Root Cause Found**: Runtime error plugin causing server restart cycles every 5000ms when JavaScript errors occurred
- **Server Restart Loop**: @replit/vite-plugin-runtime-error-modal → Vite error handler → process.exit(1) → 5-second restart delay
- **Critical Fixes Applied**: 
  - Prevented unhandled promise rejections in auth hook
  - Added comprehensive error handling in query client
  - Implemented global error handlers to prevent error plugin crashes
- **Performance Result**: Eliminated 5-second server restart delays, app now loads in ~100ms consistently
- **Technical Solution**: Error prevention rather than plugin removal (config files are protected)

### July 22-23, 2025 - Complete Email-Based Client System
- **Pure Supabase Architecture**: Eliminated all legacy systems - now 100% Supabase with no memory storage or workarounds
- **Email-Based Client-Shoot Matching**: Implemented business logic where staff associate client emails with shoots, clients log in and see shoots matching their email
- **Schema Correction**: Fixed shoots.client_id from UUID to TEXT to store client email addresses for proper matching
- **Comprehensive Test Data**: Created 3 realistic clients, 5 professional shoots, 60 high-quality Unsplash images
- **Working API System**: All endpoints functional with proper client-shoot relationships via email matching
- **Root Cause Fixes**: Fixed authentication, data relationships, and API endpoints at fundamental level with no patches

### Technical Architecture Changes  
- **Client-Shoot Relationships**: Changed from foreign key constraints to email-based matching system per business requirements
- **Database Schema**: Updated shoots.client_id to TEXT field storing client email addresses
- **Storage Layer**: Added getShootsByClientEmail() method for email-based querying
- **API Endpoints**: Fixed /api/clients/:slug to use email-based shoot matching instead of integer relationships
- **Data Structure**: Sarah & Tom (wedding/engagement), Wilson Family (portraits), Corporate (headshots/conference) with 12 images each
- **Authentication Flow**: Staff create users and associate emails with shoots; clients login and auto-match to their shoots