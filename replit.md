# SlyFox Studios - Photography & Videography Website

## Overview
SlyFox Studios is a professional photography and videography business based in Cape Town, South Africa. This project delivers a full-stack web application featuring a client gallery system, portfolio showcase, and business management capabilities. The vision is to provide a modern, comprehensive platform for managing photography and videography services, streamlining client interactions, and showcasing creative work.

## User Preferences
Preferred communication style: Simple, everyday language.
Technical approach: Always fix everything at the root cause, never patch, workaround, or temporary fix.
**Critical:** Never test uploads using real attachment screenshots - this overwrites professional hero images with random files. Always use dedicated test files or validate without actual uploads.
**Important:** NEVER make code changes without approval when suspecting cache or stale data issues. Always investigate and present findings first. Never assume cache/stale data issues - fix the actual root cause.
**Gallery Restoration Lesson:** When custom design is lost, restore from git history instead of recreating (5 minutes vs 5 hours). User becomes extremely frustrated when custom design features are lost - prioritize restoration over recreation.

## System Architecture
This application follows a **monorepo structure** with clear separation between frontend, backend, and shared code.

### Core Technologies
- **Frontend**: React 18 with TypeScript, Vite, Wouter for routing, shadcn/ui and TailwindCSS for styling.
- **Backend**: Express.js with TypeScript, following RESTful API patterns.
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations.
- **State Management**: TanStack Query for server state, React Context for client state.

### Key Architectural Decisions
- **Component-based UI**: Utilizing shadcn/ui for consistent, accessible components.
- **Responsive Design**: Mobile-first approach for optimal viewing across devices.
- **SEO Optimization**: Implemented with proper meta tags and semantic HTML.
- **Storage Abstraction Layer**: Clean interface for database operations.
- **Authentication System**: Mock authentication is in place, designed for future integration with Supabase, including role-based access for staff and clients.
- **Monorepo Strategy**: Centralized codebase for simplified development and deployment.
- **Image Optimization**: Utilizes Supabase's built-in image transformation API for on-demand image optimization, reducing bandwidth while maintaining quality.
- **Email-Based Client Management**: Core client-shoot relationships are managed via email addresses for unique identification and flexible access.
- **Automated Gallery Layout**: Implemented a smart aspect ratio detection system for dynamic and responsive gallery layouts (Masonry, Square Grid, Automatic).

### Data Flow and Schema
The application uses core entities such as Users, Clients, Shoots, Images, Packages, Analytics, and Bookings. Relationships, particularly between clients and shoots, are primarily email-based.

### API Structure
RESTful API endpoints are defined for contact forms, packages, client access, and planned authentication/admin management.

## Recent Changes (August 2025)
- **Gallery System Restoration (Aug 3):** Successfully restored original working gallery from git commit 331c09f after component interface issues
- **Gallery Settings Integration:** Fixed gallerySettings application for background colors, layout styles (masonry/grid/square), border styles, and image spacing
- **Component Architecture:** Updated client-gallery.tsx to support both routing patterns (useParams and props) for maximum compatibility
- **Custom Features Preserved:** All original hover overlays, download selected functionality, modal navigation, and professional design elements maintained

## External Dependencies

### UI and Styling
- **shadcn/ui**: Pre-built accessible components.
- **TailwindCSS**: Utility-first CSS framework.
- **Radix UI**: Headless component primitives.
- **Lucide React**: Icon system.

### Database and Backend
- **Drizzle ORM**: Type-safe PostgreSQL interface.
- **@neondatabase/serverless**: Neon database client.
- **Zod**: Runtime type validation.
- **Express.js**: Web framework.

### Development Tools
- **Vite**: Frontend build tool and dev server.
- **TypeScript**: Type safety across the stack.
- **ESBuild**: Fast backend compilation.
- **TanStack Query**: Server state management.