# SlyFox Studios - Photography & Videography Website

## Overview

SlyFox Studios is a professional photography and videography business based in Cape Town, South Africa. This is a full-stack web application built with a modern React frontend and Express.js backend, featuring a client gallery system, portfolio showcase, and business management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

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