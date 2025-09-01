# Site Management Complete Implementation Guide

## 🚨 **CRITICAL: CONFIGURATION PERSISTENCE & DEPLOYMENT** ⭐ **MUST READ**

**⚠️ WARNING: Configuration changes made in development DO NOT automatically sync to production!**

### **Configuration System Architecture (Post-Incident Analysis)**

**ROOT CAUSE OF DEPLOYMENT ISSUES**: The site management system stores configuration in **multiple separate systems** that don't sync automatically during deployment.

```
CONFIGURATION STORAGE LAYERS:
┌─────────────────────────────────────────────────────────────┐
│ 1. API-BASED CONFIGURATION (PRIMARY)                       │
│    Source: Admin Dashboard → API calls                     │
│    Storage: /server/data/site-config-overrides.json        │
│    Scope: ALL admin content (team, hero, colors, text)     │
│    Sync: MANUAL via cURL API calls                         │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 2. FILE-BASED CONFIGURATION                                │
│    Source: Direct file uploads/edits                       │
│    Storage: alt-text-storage.json, public/uploads/         │
│    Scope: Alt text, uploaded images                        │  
│    Sync: MANUAL via scp/rsync                              │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 3. CODE-BASED FALLBACKS                                    │  
│    Source: TypeScript files                                │
│    Storage: shared/types/category-config.ts                │
│    Scope: Default content when no admin settings exist     │
│    Sync: Automatic via Docker (code deployment)            │
└─────────────────────────────────────────────────────────────┘
```

### **🎯 MANDATORY DEPLOYMENT WORKFLOW**

**LESSON LEARNED**: Docker deployment only syncs CODE, not CONFIGURATION DATA.

```bash
# STEP 1: Deploy code changes (handles layer 3 only)
./deploy-production.sh

# STEP 2: Sync API-based configuration (layer 1) 
curl -s http://localhost:3000/api/site-config > /tmp/config-sync.json
curl -X PATCH http://168.231.86.89:3000/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d @/tmp/config-sync.json

# STEP 3: Sync file-based configuration (layer 2)
# Alt text storage
scp "alt-text-storage.json" slyfox-vps:/opt/sfweb/
ssh slyfox-vps "docker cp /opt/sfweb/alt-text-storage.json sfweb-app:/app/"

# Uploaded images  
rsync -av "public/uploads/" slyfox-vps:/opt/sfweb/public/uploads/
ssh slyfox-vps "cd /opt/sfweb && docker compose restart app"

# STEP 4: Verify sync worked
curl -s http://168.231.86.89:3000/api/site-config | jq '.about.team.members | length'
# Should match development environment count
```

### **🔍 Configuration File Locations (COMPLETE LIST)**

#### **Development Environment**
```
/Volumes/.../sfweb/
├── server/data/site-config-overrides.json     ← PRIMARY: All admin content
├── alt-text-storage.json                      ← Alt text for images  
├── public/uploads/                            ← All uploaded images
└── shared/types/category-config.ts            ← Fallback defaults
```

#### **Production Environment**  
```
/opt/sfweb/
├── server/data/site-config-overrides.json     ← PRIMARY: All admin content
├── alt-text-storage.json                      ← Alt text for images
├── public/uploads/                            ← All uploaded images  
└── shared/types/category-config.ts            ← Fallback defaults

Container: sfweb-app
├── /app/server/data/site-config-overrides.json  ← Volume mount
├── /app/alt-text-storage.json                   ← Direct copy
├── /app/public/uploads/                         ← Volume mount
└── /app/shared/types/category-config.ts         ← Code deployment
```

### **🚨 Debugging Configuration Issues**

**SYMPTOM**: Admin panel or live site shows defaults/old content after deployment

**DIAGNOSIS COMMANDS**:
```bash
# Check what production API is serving
curl -s http://168.231.86.89:3000/api/site-config | jq 'keys'

# Compare with development
curl -s http://localhost:3000/api/site-config | jq 'keys' 

# Check specific sections (About page example)
curl -s http://168.231.86.89:3000/api/site-config | jq '.about.team.members | length'
curl -s http://localhost:3000/api/site-config | jq '.about.team.members | length'

# Should return same numbers. If different = config not synced
```

**QUICK FIX**:
```bash
# Re-sync configuration from development to production
curl -s http://localhost:3000/api/site-config > /tmp/fix-config.json
curl -X PATCH http://168.231.86.89:3000/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d @/tmp/fix-config.json
```

---

## 🎯 How Site Management Works (Plain English)

The SlyFox Studios website has an admin dashboard where you can change content, colors, and settings. When you make changes in the admin, they are saved to files on the server and immediately appear on the live website.

The SlyFox Studios site management system provides centralized control over dynamic website content through a consistent admin interface pattern. All changes are persisted to `/server/data/site-config-overrides.json` and served via `/api/site-config` endpoints.

### **Core Data Flow Pattern**
1. **Admin Panel** → User edits content in tabbed interface
2. **Save Action** → PATCH `/api/site-config/bulk` with changes
3. **Persistence** → Server saves to `site-config-overrides.json`
4. **Live Display** → Target pages read from same config via `useSiteConfig()` hook
5. **Fallbacks** → Default values from TypeScript files when no custom data exists

### **Photography Category Manager** 📸 **(CURRENT FORWARD MODEL)**
**What it does:** Manages content for photography pages like weddings, corporate, portraits, etc.
**Where you use it:** Admin Dashboard → Photography Page Settings → [Category tabs]
**Key files:**
- **Admin interface:** `/client/src/components/admin/page-settings/category-page-settings.tsx`
- **Default content (fallbacks):** `/shared/types/category-config.ts`
- **Saved changes stored in:** `/server/data/site-config-overrides.json`
- **Live pages:** `/client/src/pages/photography-category.tsx`
- **API endpoint:** `/api/site-config/bulk` (PATCH method only)

### **Homepage Manager** 🏠 **(CURRENT FORWARD MODEL)**
**What it does:** Manages hero slides, services section, testimonials, and company info
**Where you use it:** Admin Dashboard → Site Management → Homepage → [Section tabs]
**Key files:**
- **Admin interface:** `/client/src/components/admin/page-settings/homepage-settings.tsx`
- **Saved changes stored in:** `/server/data/site-config-overrides.json`
- **Live homepage:** Uses various components that call `/api/site-config`
- **API endpoint:** `/api/site-config/bulk` (PATCH method only)

### **How Changes Flow:**
1. You edit content in admin dashboard
2. Click save → sends PATCH request to `/api/site-config/bulk`
3. Server saves changes to `/server/data/site-config-overrides.json`
4. Live website immediately shows your changes (no restart needed)
5. If no custom content saved, system shows defaults from TypeScript files

---

## 📋 Technical Implementation Details

The SlyFox Studios site management system provides centralized control over dynamic website content through an admin interface. This guide covers the complete implementation model, from component development to data persistence, focusing on two main systems:

1. **GradientPicker Component System** - Reusable Section Colors controls
2. **Site Configuration Architecture** - Data persistence and API integration

---

## 🎨 GradientPicker Component System

### Component Overview
The `GradientPicker` component provides unified gradient and text color management across all website sections. It's designed for site-wide reusability with consistent styling and behavior.

**Location**: `/client/src/components/ui/gradient-picker.tsx`

### Component Props Interface
```typescript
interface GradientPickerProps {
  sectionKey: string;        // Unique identifier for the section
  label: string;            // Display label (used when showTextColors=false)
  gradient: GradientConfig; // Gradient configuration object
  onChange: (gradient: GradientConfig) => void;
  showDirection?: boolean;  // Show direction dropdown (default: true)
  showOpacity?: boolean;    // Show opacity control (default: false)
  showAccentColor?: boolean; // Show accent color (default: false)
  showTextColors?: boolean; // Enable full Section Colors layout (default: false)
}

interface GradientConfig {
  startColor: string;
  middleColor: string;
  endColor: string;
  accentColor?: string;
  direction: string;
  opacity?: number;
  textColors?: {
    primary: string;    // Main title text
    secondary: string;  // Subtitle & paragraph text
    tertiary: string;   // All other text
  };
}
```

### Usage Patterns

#### Basic Layout (Legacy - Being Phased Out)
```typescript
<GradientPicker
  sectionKey="services"
  label="Services Section Background Gradient"
  gradient={gradient}
  onChange={updateGradient}
  showDirection={true}
  showTextColors={false}  // Basic layout only
/>
```

#### Section Colors Layout (Preferred - Current Standard)
```typescript
<GradientPicker
  sectionKey="services"
  label="Not used when showTextColors=true"
  gradient={gradient}
  onChange={updateGradient}
  showDirection={true}
  showTextColors={true}  // Enables full Section Colors layout
/>
```

### Layout Modes

**showTextColors=false (Basic Layout)**
- Simple gradient preview
- 3 color pickers in horizontal row
- Direction dropdown
- Compact vertical layout

**showTextColors=true (Section Colors Layout)**
- **Title**: "Section Colors" (text-lg font-bold)
- **Row 1**: Preview + Main Title Text controls
- **Row 2**: Background Gradient + Subtitle & Paragraph Text controls
- **Row 3**: Direction + All Other Text controls
- **All labels**: Consistent `text-xs font-medium` sizing
- Perfect horizontal alignment with 2-column grid layout

### Text Color Control Implementation

Each text color control includes:
- **Theme Color Swatches**: Salmon (`hsl(16, 100%, 73%)`) and Cyan (`hsl(180, 100%, 50%)`) with `var(--color-*)` CSS variables
- **Custom HTML5 Color Picker**: For precise color selection
- **Visual Selection States**: White border on selected theme colors
- **Hover Effects**: Scale and border transitions

```typescript
// Example text color control structure
<div className="flex gap-1">
  <div /* Salmon swatch */
    className="flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2"
    style={{ backgroundColor: 'hsl(16, 100%, 73%)' }}
    onClick={() => updateTextColor('primary', 'var(--color-salmon)')}
  />
  <div /* Cyan swatch */
    className="flex-1 h-8 rounded cursor-pointer transition-all hover:scale-105 border-2"
    style={{ backgroundColor: 'hsl(180, 100%, 50%)' }}
    onClick={() => updateTextColor('primary', 'var(--color-cyan)')}
  />
  <input /* Custom color picker */
    type="color"
    className="flex-1 h-8 rounded cursor-pointer custom-color-input"
    onChange={(e) => updateTextColor('primary', e.target.value)}
  />
</div>
```

### CSS Integration System

#### Section-Specific CSS Variables
Text colors are applied via section-specific CSS variables that automatically resolve to actual colors:

```css
/* Services Section Text Colors */
[data-gradient-section="services"] h1,
[data-gradient-section="services"] h2 {
  color: var(--services-text-primary, #ffffff) !important;
}
[data-gradient-section="services"] p,
[data-gradient-section="services"] h3 {
  color: var(--services-text-secondary, #e2e8f0) !important;
}
[data-gradient-section="services"] .text-muted-foreground {
  color: var(--services-text-tertiary, #94a3b8) !important;
}

/* Testimonials, Contact, Private Gallery, Portfolio sections follow same pattern */
```

#### GradientBackground Component Integration
The `GradientBackground` component applies CSS variables and data attributes:

```typescript
// Updated GradientBackground component
export function GradientBackground({ section, children, className }) {
  const backgroundStyle = {
    background: gradientStyle,
    // Section-specific CSS variables
    [`--${section}-text-primary`]: resolveColor(textColors?.primary, '#ffffff'),
    [`--${section}-text-secondary`]: resolveColor(textColors?.secondary, '#e2e8f0'),
    [`--${section}-text-tertiary`]: resolveColor(textColors?.tertiary, '#94a3b8')
  } as React.CSSProperties;

  return (
    <div 
      className={`relative ${className}`}
      style={backgroundStyle}
      data-gradient-section={section}  // Enables CSS targeting
    >
      {children}
    </div>
  );
}
```

### Text Element Mapping by Section

#### Services Section
- **Primary**: Main headlines (`h1`, `h2`) - "Capturing Life's Beautiful Moments"
- **Secondary**: Service descriptions (`p`, `h3`) - Service titles and descriptions
- **Tertiary**: "more" buttons, metadata (`span`, `.text-muted-foreground`)

#### Testimonials Section
- **Primary**: Section title (`h2`) - "What Our Clients Say"
- **Secondary**: Testimonial content (`p`, `blockquote`) - Quotes and descriptions
- **Tertiary**: Client names, roles, ratings (`.font-saira`, `.text-muted-foreground`)

#### Contact Section
- **Primary**: Main headings (`h2`, `h3`) - "Let's Create Something Beautiful", "Get in Touch"
- **Secondary**: Contact information (`h4`, `p`) - Form labels, contact details
- **Tertiary**: Form field labels, muted text (`label`, `.text-muted-foreground`)

#### Private Gallery Section
- **Primary**: Main headline (`h2`) - "Your Private Gallery"
- **Secondary**: Description and feature titles (`p`, `h4`) - Section description, feature names
- **Tertiary**: Feature descriptions (`.text-muted-foreground`)

#### Portfolio Section (Special Case - Uses FrontPageSettings)
- **Primary**: Main headlines (`h1`, `h2`) - "Recent Work"
- **Secondary**: Description (`p`) - Portfolio description
- **Tertiary**: Filter buttons, metadata (`.text-muted-foreground`)

### Portfolio Section Special Implementation

The Portfolio section uses a hybrid approach combining the GradientPicker methodology with its unique grid controls:

**FrontPageSettings Interface** (Standalone):
```typescript
interface FrontPageSettings {
  // Grid controls (unique to portfolio)
  imagePadding?: number;
  borderRadius?: number;
  imageCount?: number;
  layoutStyle?: string;
  borderColor?: string;
  borderThickness?: number;
  
  // Background gradient (shared pattern)
  backgroundGradientStart?: string;
  backgroundGradientMiddle?: string;
  backgroundGradientEnd?: string;
  
  // Text colors (following GradientPicker methodology)
  textColorPrimary?: string;    // Main title text
  textColorSecondary?: string;  // Subtitle & paragraph text
  textColorTertiary?: string;   // All other text
}
```

**Three-Row Layout**:
- **Row 1**: Grid-specific controls (Number of Images, Border Thickness, etc.)
- **Row 2**: Background and legacy controls (Image Padding, Layout Style, etc.)
- **Row 3**: **Text Color Controls** (duplicated GradientPicker methodology)

**Integration with GradientBackground**:
```typescript
// Special handling in GradientBackground component
if (section === 'portfolio' && frontPageSettings) {
  textColors = {
    primary: frontPageSettings.textColorPrimary,
    secondary: frontPageSettings.textColorSecondary,
    tertiary: frontPageSettings.textColorTertiary
  };
}
```

### Styling System

#### Container Styling
All instances use the unified `.gallery-slider-container` class:

```css
.gallery-slider-container {
  max-width: calc(50% - 8px);
  border: 1px solid hsl(220, 13%, 25%);
  background: linear-gradient(to right, hsl(220, 13%, 18%), hsl(220, 13%, 15%));
  border-radius: 0.5rem;
  padding: 0.75rem;
}
```

#### Typography Consistency
- **Main Title**: `text-lg font-bold` (Section Colors title)
- **Section Labels**: `text-xs font-medium` (all element labels)
- **Interactive Height**: `h-8` for all color pickers and controls

### Current Implementation Status

- ✅ **Services**: Full Section Colors implementation with showTextColors=true
- ✅ **Testimonials**: Full Section Colors implementation with showTextColors=true
- ✅ **Contact**: Full Section Colors implementation with showTextColors=true
- ✅ **Private Gallery**: Full Section Colors implementation with showTextColors=true
- ✅ **Portfolio**: Standalone implementation with complete text controls (third row)
- ✅ **Hero Slides**: N/A (full-screen slides don't need text controls)

---

## 🏗️ Site Configuration Architecture

### Data Storage & Persistence

**Configuration Storage Hierarchy**:
1. **Primary Storage**: Atomic file persistence at `server/data/site-config-overrides.json`
2. **In-Memory Cache**: `configOverrides` object loaded on server startup
3. **Default Fallbacks**: Hardcoded defaults in components for missing values
4. **Client State**: React Query cache with optimistic updates

**Atomic Write System**:
```typescript
async function saveConfigOverrides(overrides: any): Promise<void> {
  const tempPath = `${CONFIG_OVERRIDES_PATH}.tmp.${Date.now()}`;
  
  // Write to temporary file first (prevents corruption)
  await fs.writeFile(tempPath, JSON.stringify(overrides, null, 2));
  
  // Atomic rename (guaranteed by OS)
  await fs.rename(tempPath, CONFIG_OVERRIDES_PATH);
  
  // Update in-memory cache
  configOverrides = overrides;
}
```

### API Endpoint System

#### ⚠️ CRITICAL: HTTP Method Requirements

**Always use PATCH method for site configuration updates:**

```typescript
// ✅ CORRECT - Use PATCH method
const response = await fetch('/api/site-config/bulk', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newConfig)
});
```

```typescript
// ✅ CORRECT - Using apiRequest helper
const response = await apiRequest('PATCH', '/api/site-config/bulk', config);
```

**❌ NEVER USE POST METHOD**:
```typescript
// ❌ WRONG - DO NOT USE POST (will cause 405 Method Not Allowed)
const response = await fetch('/api/site-config/bulk', {
  method: 'POST', // This will fail!
  body: JSON.stringify(config)
});
```

#### Available Endpoints

**GET `/api/site-config`**
- Returns complete merged configuration (defaults + overrides)
- Used for initial data loading
- Always returns full SiteConfig structure

**PATCH `/api/site-config/bulk`**
- Updates configuration overrides
- Supports partial updates (deep merge with existing config)
- Returns updated complete configuration
- Triggers atomic file persistence

**GET `/api/site-config/overrides`**
- Returns only custom overrides (without defaults)
- Used for debugging and admin interfaces

### Configuration Structure

**Core SiteConfig Interface**:
```typescript
interface SiteConfig {
  contact: {
    business: BusinessInfo;
    methods: ContactMethods;
    hours: BusinessHours;
  };
  home: {
    hero: HeroConfiguration;
    servicesOverview: ServicesConfiguration;
    testimonials: TestimonialsSection;
    privateGallery: PrivateGallerySection;
  };
  portfolio: {
    featured: FrontPageSettings;
  };
  gradients: {
    [sectionName: string]: {
      startColor: string;
      middleColor: string;
      endColor: string;
      direction: string;
      textColors: {
        primary: string;
        secondary: string;
        tertiary: string;
      };
    };
  };
}
```

### Data Flow Patterns

#### Admin Panel → API → Storage
```typescript
// 1. User changes in admin panel
const handleConfigChange = (newConfig: SiteConfig) => {
  setConfig(newConfig);
  setHasUnsavedChanges(true);
};

// 2. Save via mutation
const saveMutation = useMutation({
  mutationFn: async (config: SiteConfig) => {
    const response = await fetch('/api/site-config/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return response.json();
  },
  onSuccess: () => {
    setHasUnsavedChanges(false);
    queryClient.invalidateQueries(['/api/site-config']);
  }
});

// 3. Server processes and persists
await saveConfigOverrides(overrides);
```

#### Frontend Data Access
```typescript
// React Query integration
const { data: config, isLoading } = useQuery({
  queryKey: ['/api/site-config'],
  queryFn: async () => {
    const response = await fetch('/api/site-config');
    return response.json() as SiteConfig;
  }
});

// Custom hooks for specific sections
const frontPageSettings = useFrontPageSettings(); // Portfolio settings
const { gradient, updateGradient } = useGradient('services'); // Section gradients
```

### Component Integration Patterns

#### Homepage Settings Component **(CURRENT FORWARD MODEL)**
**File**: `/client/src/components/admin/page-settings/homepage-settings.tsx`

**Admin Panel Navigation**:
```
Admin Dashboard → Site Management Tab → Homepage Card → Component with Tabs
```

**Tab Structure**:
- **Hero Slides**: Slide management (no Section Colors - fullscreen)
- **Services**: GradientPicker with showTextColors=true
- **Private Gallery**: GradientPicker with showTextColors=true
- **Testimonials**: GradientPicker with showTextColors=true
- **Company Info**: GradientPicker with showTextColors=true

#### Portfolio Management Component **(LEGACY - MARKED FOR CLEANUP)**
**File**: `/client/src/components/admin/front-page-settings.tsx`

**⚠️ LEGACY IMPLEMENTATION**: Standalone implementation with grid controls + text controls
- Maintains portfolio-specific settings (imageCount, borderRadius, etc.)
- Includes complete text color controls using GradientPicker methodology
- Direct integration with GradientBackground component
- **TODO**: Refactor to follow Homepage Settings pattern

#### State Management Pattern
```typescript
// Consistent pattern across all admin components
export function SectionSettings() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  
  const saveMutation = useMutation({
    mutationFn: async (newConfig: SiteConfig) => {
      const response = await fetch('/api/site-config/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      return response.json();
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      toast({ title: "Changes saved successfully!" });
    }
  });
  
  const handleSave = () => saveMutation.mutate(config);
  
  return (
    // Component JSX with save button and unsaved changes tracking
  );
}
```

### File Upload System

**Upload Endpoint**: `POST /api/upload`
**Storage Location**: `/public/uploads/`
**Naming Convention**: `{originalName}_{timestamp}.{extension}`

```typescript
// File upload integration
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const { filename } = await response.json();
  return `/uploads/${filename}`;
};

// Usage in admin components
const handleImageUpload = async (file: File) => {
  const imagePath = await uploadFile(file);
  updateConfig({
    ...config,
    home: {
      ...config.home,
      hero: {
        ...config.home.hero,
        slides: [...slides, { image: imagePath, title: '', description: '' }]
      }
    }
  });
};
```

### Error Handling & Recovery

#### Server-Side Error Recovery
```typescript
// Graceful fallback to defaults if config file is corrupted
const loadConfigOverrides = async (): Promise<any> => {
  try {
    const data = await fs.readFile(CONFIG_OVERRIDES_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('Failed to load config overrides, using empty overrides:', error);
    return {}; // Return empty object, let deep merge handle defaults
  }
};
```

#### Client-Side Error Boundaries
```typescript
// Error handling in React Query mutations
const saveMutation = useMutation({
  mutationFn: saveConfig,
  onError: (error) => {
    toast({
      title: "Save Failed",
      description: "Unable to save changes. Please try again.",
      variant: "destructive"
    });
    console.error('Config save error:', error);
  }
});
```

### Performance Optimizations

#### Debounced Auto-Save
```typescript
// Optional debounced saving for frequently changing controls
const { debouncedSave } = useDebouncedApiSave({
  delay: 2000,
  onSuccess: () => setHasUnsavedChanges(false),
  onError: (error) => toast({ title: "Auto-save failed", variant: "destructive" })
});

// Use in frequently changing controls like sliders
const handleSliderChange = (value: number) => {
  updateLocalSettings({ imagePadding: value });
  debouncedSave(localSettings);
};
```

#### React Query Optimizations
```typescript
// Optimistic updates for immediate UI response
const saveMutation = useMutation({
  mutationFn: saveConfig,
  onMutate: async (newConfig) => {
    await queryClient.cancelQueries(['/api/site-config']);
    const previousConfig = queryClient.getQueryData(['/api/site-config']);
    queryClient.setQueryData(['/api/site-config'], newConfig);
    return { previousConfig };
  },
  onError: (err, newConfig, context) => {
    queryClient.setQueryData(['/api/site-config'], context.previousConfig);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['/api/site-config']);
  }
});
```

### Testing & Validation

#### API Endpoint Testing
```bash
# Test PATCH endpoint
curl -X PATCH http://localhost:3000/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d '{"home":{"hero":{"slides":[]}}}'

# Test GET endpoint
curl http://localhost:3000/api/site-config

# Verify file persistence
cat server/data/site-config-overrides.json
```

#### Component Testing Patterns
```typescript
// Test gradient picker integration
describe('GradientPicker', () => {
  test('applies text colors to CSS variables', () => {
    const mockGradient = {
      textColors: {
        primary: '#ffffff',
        secondary: '#e2e8f0',
        tertiary: '#94a3b8'
      }
    };
    
    render(
      <GradientBackground section="services">
        <TestComponent />
      </GradientBackground>
    );
    
    const element = screen.getByTestId('gradient-background');
    expect(element.style.getPropertyValue('--services-text-primary')).toBe('#ffffff');
  });
});
```

---

## 📋 About Page Implementation Plan (NEW)

### **Admin Panel Structure Pattern** (Following Homepage Model)

**Navigation Hierarchy**:
```
Admin Dashboard → Site Management Tab → About Card → AboutSettings Component → Section Tabs
```

**Page Selection Grid** (in `admin-content.tsx`):
Located at lines 2019-2084, displays clickable cards:
- **Homepage** → `setActivePageSettings('homepage')` → `<HomepageSettings />` ✅ **CURRENT FORWARD MODEL**
- **Portfolio** → `setActivePageSettings('portfolio')` → `<PortfolioSettings />` ⚠️ **LEGACY - MARKED FOR CLEANUP**
- **Photography** → `setActivePageSettings('photography')` → `<PhotographySettings />` ✅ **CURRENT FORWARD MODEL**
- **Contact** → `setActivePageSettings('contact')` → `<ContactSettings />` ✅ **CURRENT FORWARD MODEL**
- **About** → Currently disabled (opacity-50, no onClick handler) → **TO BE IMPLEMENTED**

### **About Page Current Structure Analysis**

Based on `/client/src/pages/about.tsx`:

**Section 1: Hero Section** (lines 71-97)
**Abstractable Elements:**
- Title: "About SlyFox Studios"
- Description: "Founded in the heart of Durban..."
- Stats Array: 4 statistics with number, label, icon

**Section 2: Our Story** (lines 99-146) 
**Abstractable Elements:**
- Title: "Our Story"
- Story paragraphs: 4 paragraph content blocks

**Section 3: Our Values** (lines 147-175)
**Abstractable Elements:**
- Title: "Our Values"  
- Description: "The principles that guide..."
- Values Array: 4 values with icon, title, description

**Section 4: Meet Our Team** (lines 176-230)
**Abstractable Elements:**
- Title: "Meet Our Team"
- Description: "Get to know the creative..."
- Team Array: 3 members with name, role, email, image, description

**Section 5: CTA Section** (lines 232-250)
**Abstractable Elements:**
- Title: "Ready to Work Together?"
- Description: "Let's create something amazing..."
- Button text: "Get In Touch"

### **Implementation Execution Plan**

**Phase 1: Admin Panel Integration** (30 min)
1. **Enable About button** in `admin-content.tsx` (line 2054)
   - Add `onClick={() => setActivePageSettings('about')}`
   - Remove `opacity-50` class
   - Add hover border color

2. **Create AboutSettings component** in `/client/src/components/admin/page-settings/about-settings.tsx`
   - Import pattern from homepage-settings.tsx
   - Add to admin-content.tsx imports

3. **Add conditional render** in admin-content.tsx
   - Pattern: `{activePageSettings === 'about' && (<AboutSettings />)}`

**Phase 2: About Settings Component** (60 min)
1. **Create component structure** with 5 tabs:
   - **Hero & Stats**: Title, description, 4 statistics
   - **Our Story**: Title, 4 paragraphs  
   - **Our Values**: Title, description, 4 values array
   - **Meet Our Team**: Title, description, 3 team members array
   - **Call to Action**: Title, description, button text

2. **Implement state management**:
   - `useState` for form data initialized from `config?.about || defaults`
   - `handleInputChange` for field updates
   - `handleSave` with `updateConfigBulk({about: pageData})`

3. **Add array management** for stats, values, team:
   - Add/remove/reorder functionality
   - Image upload for team member photos
   - Icon selection for stats and values

**Phase 3: Target Page Integration** (30 min)
1. **Update about.tsx** to use `useSiteConfig()` hook
2. **Replace hardcoded content** with config paths:
   - `config?.about?.hero?.title || 'About SlyFox Studios'`
   - `config?.about?.story?.paragraphs || defaultParagraphs`
   - `config?.about?.team?.members || defaultTeam`

3. **Test data flow** from admin to live page

**Phase 4: Testing & Validation** (20 min)
1. **Verify admin panel navigation** works
2. **Test all form fields** save correctly
3. **Confirm live page** displays saved content
4. **Test fallback behavior** when no custom data exists

### **Data Structure Specification**

**Config Path: `about`**
```typescript
interface AboutConfig {
  hero: {
    title: string;
    description: string;
    stats: Array<{
      id: string;
      number: string;
      label: string;
      icon: string;
    }>;
  };
  story: {
    title: string;
    paragraphs: string[];
  };
  values: {
    title: string;
    description: string;
    items: Array<{
      id: string;
      icon: string;
      title: string;
      description: string;
    }>;
  };
  team: {
    title: string;
    description: string;
    members: Array<{
      id: string;
      name: string;
      role: string;
      email: string;
      image: string;
      description: string;
    }>;
  };
  cta: {
    title: string;
    description: string;
    buttonText: string;
  };
}
```

---

## 🎯 Implementation Checklist

### For New Sections (Using GradientPicker) - **CURRENT FORWARD MODEL**
- [ ] Add section to `GradientBackgroundProps` union type
- [ ] Create gradient function: `function SectionGradientSection() { ... }`
- [ ] Set `showTextColors={true}` in GradientPicker
- [ ] Add CSS mappings in `index.css` for section-specific text colors
- [ ] Test text color controls update actual section elements
- [ ] Verify gradient background applies correctly

### For Standalone Implementations (Like Portfolio) - **⚠️ LEGACY - MARKED FOR CLEANUP**
- [ ] Create section-specific interface extending base patterns
- [ ] Implement text color controls using GradientPicker methodology
- [ ] Add CSS mappings with section-specific variables
- [ ] Connect to GradientBackground component for CSS variable application
- [ ] Test integration with existing gradient/background systems
- [ ] Ensure backwards compatibility with existing data structures

### For API Integration
- [ ] Always use PATCH method for configuration updates
- [ ] Implement proper error handling and user feedback
- [ ] Add optimistic updates for better UX
- [ ] Test atomic file persistence and recovery
- [ ] Validate configuration schema and data integrity

### About Page Quality Assurance Checklist
- [ ] Admin panel navigation works (About button enabled and functional)
- [ ] AboutSettings component renders with all 5 tabs
- [ ] All form fields save to correct config paths
- [ ] Live about page reads from config with proper fallbacks
- [ ] Image uploads work for team member photos
- [ ] Array management (add/remove/reorder) functions correctly
- [ ] Data persists across browser sessions
- [ ] No console errors in admin or live page
- [ ] Responsive design maintained on both admin and live page

---

## 📚 Complete Files Reference

### **Configuration Storage Files** ⭐ **CRITICAL**

#### **Primary Configuration Files**
- **`/server/data/site-config-overrides.json`** ⭐ **MAIN STORAGE** - All admin settings persist here
  - Homepage (hero slides, services, testimonials, private gallery)
  - Contact (business info, methods, hours, response times, service areas)
  - About (hero, story, values, team, CTA)
  - Portfolio (featured settings, layout controls)
  - Photography categories (weddings, corporate, portraits, events, products, graduation)
  - Gradients (section-specific colors for all sections)

- **`/shared/types/category-config.ts`** ⭐ **CATEGORY FALLBACKS** - Default content for category pages
  - Contains `defaultCategoryPageConfig` structure
  - Used when no saved category data exists
  - **⚠️ CRITICAL**: Contains "Cape Town" references that should be "Durban"

#### **Backup & Recovery Files**
- `/server/data/site-config-backup-*.json` - Deployment backups (automatic)
- `/tmp/dev-config-backup.json` - Manual sync backups

### **Admin Dashboard Components**

#### **Current Forward Model** ✅ **RECOMMENDED PATTERN**
- **`/client/src/components/admin/page-settings/homepage-settings.tsx`** - Homepage management
  - Manages: Hero slides, services, testimonials, private gallery, company info
  - Config Paths: `home.hero`, `home.servicesOverview`, `home.testimonials`, `home.privateGallery`

- **`/client/src/components/admin/page-settings/contact-settings.tsx`** - Contact management
  - Manages: Business info, contact methods, hours, response times, service areas
  - Config Paths: `contact.business`, `contact.methods`, `contact.hours`, `contact.responseTimes`, `contact.serviceAreas`, `contact.emergency`

- **`/client/src/components/admin/page-settings/about-settings.tsx`** - About page management
  - Manages: Hero stats, story paragraphs, values, team members, CTA
  - Config Paths: `about.hero`, `about.story`, `about.values`, `about.team`, `about.cta`

- **`/client/src/components/admin/page-settings/category-page-settings.tsx`** - Category management
  - Manages: All photography/videography category content
  - Config Paths: `categoryPages.photography.[category]`, `categoryPages.videography.[category]`
  - Fallbacks: Uses `/shared/types/category-config.ts`

- **`/client/src/components/admin/page-settings/photography-settings.tsx`** - Photography coordinator
  - Provides tab interface for 6 photography categories
  - Delegates to CategoryPageSettings component

- **`/client/src/components/admin/page-settings/portfolio-settings.tsx`** - Portfolio management
  - Manages: Featured portfolio section settings
  - Config Paths: `portfolio.featured`

#### **Legacy Components** ⚠️ **MARKED FOR CLEANUP**
- **`/client/src/components/admin/front-page-settings.tsx`** - Legacy portfolio admin
  - Direct API calls instead of hooks
  - Scheduled for refactoring to current pattern

### **Target Page Components**

#### **Homepage Target Components** (URL: `/`)
- **`/client/src/components/sections/enhanced-hero-slider.tsx`**
  - Config: `config.home.hero.slides[]` | Admin: HomepageSettings → Hero Slides tab
- **`/client/src/components/sections/services-overview.tsx`**
  - Config: `config.home.servicesOverview` | Admin: HomepageSettings → Services tab
- **`/client/src/components/sections/testimonials.tsx`**
  - Config: `config.home.testimonials` | Admin: HomepageSettings → Testimonials tab
- **`/client/src/components/sections/client-gallery-access.tsx`**
  - Config: `config.home.privateGallery` | Admin: HomepageSettings → Private Gallery tab
- **`/client/src/components/sections/portfolio-showcase.tsx`**
  - Config: `config.portfolio.featured` | Admin: PortfolioSettings
- **`/client/src/components/sections/contact-section.tsx`**
  - Config: `config.contact.*` | Admin: ContactSettings

#### **Category Page Templates**
- **`/client/src/pages/photography-category.tsx`** - Dynamic template for all photography categories
  - Config: `config.categoryPages.photography.[category]` | Admin: CategoryPageSettings
  - Fallbacks: `defaultCategoryPageConfig` from category-config.ts
  - URLs: `/photography/weddings`, `/photography/corporate`, etc.

- **Individual Category Pages**: `/client/src/pages/photography-{category}.tsx`
  - weddings, corporate, portraits, events, products, graduation
  - Each uses the dynamic template with category-specific data

#### **About Page Components** (URL: `/about`)
- **`/client/src/pages/about.tsx`** - About page template
  - Config: `config.about.*` | Admin: AboutSettings
  - Sections: Hero stats, story, values, team, CTA

#### **Contact Page Components** (URL: `/contact`)
- **`/client/src/pages/contact.tsx`** - Contact page template
  - Config: `config.contact.*` | Admin: ContactSettings
  - Integration: Contact form + reCAPTCHA + business info

### **Component Architecture Files**

#### **Core UI Components**
- **`/client/src/components/ui/gradient-picker.tsx`** - Reusable Section Colors component
- **`/client/src/components/ui/text-color-picker.tsx`** - Text color picker components
- **`/client/src/components/common/gradient-background.tsx`** - CSS variable application
- **`/client/src/components/shared/category-featured-grid.tsx`** - Category image grids

#### **Hook Files**
- **`/client/src/hooks/use-site-config.tsx`** ⭐ **PRIMARY HOOK** - All components use this
- **`/client/src/hooks/use-gradient.tsx`** - Gradient state management
- **`/client/src/hooks/use-front-page-settings.tsx`** ⚠️ **LEGACY** - Portfolio settings access

#### **API & Server Files**
- **`/server/site-config-api.ts`** - Configuration API endpoints and data merging
- **`/server/routes.ts`** - Main API routing including `/api/site-config/bulk`
- **`/server/storage.ts`** - File upload handling for images

#### **Styling Files**
- **`/client/src/index.css`** - Section-specific CSS variable mappings (lines 1624+)
  - Maps GradientBackground sections to CSS variables
  - Defines text color inheritance patterns

### **Critical File Dependencies Map**

```
Admin Component → Config File → API → Target Page
├── HomepageSettings → site-config-overrides.json → /api/site-config → Homepage sections
├── ContactSettings → site-config-overrides.json → /api/site-config → Contact page
├── AboutSettings → site-config-overrides.json → /api/site-config → About page
├── CategoryPageSettings → site-config-overrides.json → /api/site-config → Category pages
│                      ↳ category-config.ts (fallbacks)
└── PortfolioSettings → site-config-overrides.json → /api/site-config → Portfolio section
```

### **Static Files** (No Admin Management)
- `/pages/pricing.tsx` - Static pricing content
- `/components/layout/footer.tsx` - Static footer content  
- `/components/layout/navigation.tsx` - Static navigation structure
- `/pages/photography.tsx`, `/pages/videography.tsx` - Static overview pages

This guide serves as the complete reference for implementing and extending the site management system. All information is current as of the latest implementation and reflects the actual working methodology.

**FORWARD MODEL**: Follow Homepage Settings pattern for all new implementations  
**LEGACY CLEANUP**: Portfolio section and front-page-settings.tsx marked for future refactoring