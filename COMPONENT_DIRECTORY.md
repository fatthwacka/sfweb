# 🧩 Component Directory

Complete listing of all React components in the SlyFox Studios codebase with descriptions, locations, and usage examples.

## 📁 Directory Structure

```text
client/src/components/
├── admin/          # Admin dashboard components
├── auth/           # Authentication components
├── client/         # Client portal components
├── common/         # Common/generic components
├── gallery/        # Gallery viewing components
├── layout/         # Layout wrapper components
├── sections/       # Page section components
├── shared/         # Reusable shared components
└── ui/             # Base UI components (shadcn/ui)
```

---

## 🔄 Shared Components (`/shared/`)
**Highly reusable components used across multiple features**

### `thumbnail-with-buttons.tsx` ⭐ NEW
**Self-contained thumbnail with browse/upload icon buttons**
- **Props**: `imagePath`, `onImageChange`, `size?` (sm/md/lg), `showButtons?`, `className?`, `alt?`
- **Features**: Drag-and-drop, image browser modal, upload progress, toast notifications
- **Common Names**: "thumbnail-button thing", "thumbnail with buttons", "reusable thumbnail"
```tsx
<ThumbnailWithButtons 
  imagePath={slide.image}
  onImageChange={(path) => updateSlide(path)}
  size="md"
/>
```

### `image-browser.tsx`
**Full-featured modal for browsing all site images**
- **Props**: `currentImage?`, `onSelect`, `onUpload?`, `label?`, `className?`
- **Features**: Folder organization, thumbnail grid, upload option
```tsx
<ImageBrowser 
  currentImage={image}
  onSelect={handleImageSelect}
  onUpload={handleUpload}
/>
```

### `smart-image.tsx`
**Intelligent image component with loading states**
- **Props**: `src`, `alt`, `className?`, `fallback?`
- **Features**: Lazy loading, error handling, placeholder states

### `direct-image.tsx`
**Simple direct image rendering without processing**
- **Props**: `src`, `alt`, `className?`
- **Features**: Direct path rendering, no transformations

### `category-featured-grid.tsx`
**Featured image grid for category pages**
- **Props**: `images`, `category`, `className?`
- **Features**: Responsive grid, hover effects, lightbox integration

---

## 🔐 Admin Components (`/admin/`)
**Dashboard and content management components**

### Page Settings
- `page-settings/homepage-settings.tsx` - Homepage configuration (hero, services, testimonials)
- `page-settings/about-settings.tsx` - About page management
- `page-settings/contact-settings.tsx` - Contact information management
- `page-settings/category-page-settings.tsx` - Photography/videography category pages
- `page-settings/photography-settings.tsx` - Photography-specific settings
- `page-settings/homepage-sections/*.tsx` - Individual homepage section editors

### Gallery Management
- `gallery-editor.tsx` - Main gallery editing interface
- `enhanced-gallery-editor.tsx` - Advanced gallery editor with AI features
- `gallery-sections.tsx` - Gallery section components (BasicInfo, Images, etc.)
- `image-grid.tsx` - Admin image grid with reordering
- `image-upload.tsx` - Bulk image upload interface

### Content Management
- `client-management.tsx` - Client database management
- `user-management.tsx` - User accounts and permissions
- `package-editor.tsx` - Service package management
- `analytics-dashboard.tsx` - Site analytics viewing

---

## 🎨 UI Components (`/ui/`)
**Base UI components from shadcn/ui library**

### Core Components
- `button.tsx` - Button with variants (default, destructive, outline, secondary, ghost, link)
- `card.tsx` - Card container with Header, Title, Description, Content, Footer
- `dialog.tsx` - Modal dialog with Radix UI
- `input.tsx` - Form input field
- `textarea.tsx` - Multi-line text input
- `select.tsx` - Dropdown selection
- `checkbox.tsx` - Checkbox input
- `switch.tsx` - Toggle switch
- `label.tsx` - Form field labels

### Advanced Components
- `tabs.tsx` - Tab navigation (Tabs, TabsList, TabsTrigger, TabsContent)
- `accordion.tsx` - Collapsible accordion sections
- `alert.tsx` - Alert messages with variants
- `badge.tsx` - Status badges
- `tooltip.tsx` - Hover tooltips with Radix UI
- `popover.tsx` - Popover menus
- `dropdown-menu.tsx` - Dropdown menu system
- `command.tsx` - Command palette/search
- `sheet.tsx` - Side sheet/drawer
- `separator.tsx` - Visual separator line

### Special Components
- `gradient-picker.tsx` - Custom gradient color picker for sections
- `toaster.tsx` - Toast notification system
- `skeleton.tsx` - Loading skeleton placeholders
- `avatar.tsx` - User avatar display
- `aspect-ratio.tsx` - Maintain aspect ratios
- `scroll-area.tsx` - Custom scrollable areas

---

## 📄 Section Components (`/sections/`)
**Page section building blocks**

### Homepage Sections
- `hero-section.tsx` - Hero banner with slides
- `services-section.tsx` - Services overview cards
- `portfolio-section.tsx` - Portfolio showcase
- `testimonials-section.tsx` - Customer testimonials
- `contact-section.tsx` - Contact form with reCAPTCHA
- `cta-section.tsx` - Call-to-action blocks
- `stats-section.tsx` - Statistics display
- `process-section.tsx` - Process/workflow display

### Content Sections
- `about-section.tsx` - About content blocks
- `team-section.tsx` - Team member cards
- `faq-section.tsx` - FAQ accordion
- `pricing-section.tsx` - Pricing tables
- `features-section.tsx` - Feature highlights

---

## 🖼️ Gallery Components (`/gallery/`)
**Gallery viewing and interaction components**

- `gallery-renderer.tsx` - Main gallery rendering engine (8 layout modes)
- `gallery-settings-card.tsx` - Gallery customization panel
- `gallery-lightbox.tsx` - Full-screen image viewer
- `gallery-grid.tsx` - Grid layout component
- `masonry-gallery.tsx` - Pinterest-style masonry layout
- `gallery-filters.tsx` - Category/tag filtering
- `image-zoom.tsx` - Image zoom functionality

---

## 📐 Layout Components (`/layout/`)
**Page structure and navigation components**

- `navigation.tsx` - Main site navigation
- `footer.tsx` - Site footer
- `mobile-nav.tsx` - Mobile navigation menu
- `sidebar.tsx` - Admin sidebar navigation
- `page-header.tsx` - Page title headers
- `breadcrumbs.tsx` - Navigation breadcrumbs

---

## 🔑 Auth Components (`/auth/`)
**Authentication and authorization components**

- `login-form.tsx` - User login form
- `signup-form.tsx` - User registration
- `forgot-password.tsx` - Password reset request
- `reset-password.tsx` - Password reset form
- `auth-guard.tsx` - Route protection wrapper
- `role-guard.tsx` - Role-based access control

---

## 👤 Client Components (`/client/`)
**Client portal specific components**

- `client-gallery.tsx` - Client's private gallery view
- `client-dashboard.tsx` - Client portal dashboard
- `download-manager.tsx` - Bulk image downloads
- `share-gallery.tsx` - Gallery sharing options
- `client-profile.tsx` - Client profile management

---

## 🛠️ Common Components (`/common/`)
**Generic utility components**

- `loading-spinner.tsx` - Loading animation
- `error-boundary.tsx` - Error handling wrapper
- `empty-state.tsx` - No data placeholders
- `confirmation-dialog.tsx` - Action confirmation modals
- `search-bar.tsx` - Search input component
- `pagination.tsx` - Page navigation
- `data-table.tsx` - Sortable data tables

---

## 📝 Usage Notes

### Quick Component Selection Guide

**Need an image with upload/browse capabilities?**
→ Use `ThumbnailWithButtons` from `/shared/`

**Need a modal to browse existing images?**
→ Use `ImageBrowser` from `/shared/`

**Building an admin form?**
→ Check `/admin/page-settings/` for existing patterns

**Need a basic UI element?**
→ Check `/ui/` for shadcn components

**Creating a new page section?**
→ Look in `/sections/` for similar components

**Working with galleries?**
→ Use components from `/gallery/`

### Component Naming Conventions

- **PascalCase** for component files and exports
- **Descriptive names** that indicate purpose
- **-section** suffix for page sections
- **-form** suffix for form components
- **-card** suffix for card-based layouts
- **use-** prefix for custom hooks

### Import Patterns

```tsx
// UI components
import { Button } from '@/components/ui/button';

// Shared components
import { ThumbnailWithButtons } from '@/components/shared/thumbnail-with-buttons';

// Section components
import { HeroSection } from '@/components/sections/hero-section';

// Admin components
import { GalleryEditor } from '@/components/admin/gallery-editor';
```

---

## 🚀 Quick Reference for Claude

When users mention these informal names, use these components:

- "thumbnail thing" → `ThumbnailWithButtons`
- "image picker" → `ImageBrowser`
- "upload button" → `ThumbnailWithButtons` with `showButtons={true}`
- "gradient thing" → `GradientPicker`
- "gallery viewer" → `GalleryRenderer`
- "admin sidebar" → `Sidebar` from `/layout/`
- "toast" → `toast()` from `use-toast` hook
- "loading spinner" → `LoadingSpinner` from `/common/`

---

*Last Updated: 2025-09-01*
*Note: This directory is actively maintained. Add new components as they're created.*