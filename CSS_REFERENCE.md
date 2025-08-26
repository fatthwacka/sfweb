# SlyFox Studios - CSS Design System Reference

A comprehensive guide to fonts, colors, components, and styling patterns for consistent development.

## 🎨 Typography System

### Font Families
```css
.font-saira          /* Saira Condensed (600,700,800,900) - Primary headings & body */
.font-quicksand      /* Quicksand (300,400,500,600,700) - Clean, readable text */
.font-barlow         /* Barlow Semi Condensed (400,500,600) - Buttons & UI elements */
.font-vibes          /* Great Vibes - Elegant script */
.font-forum          /* Forum - Serif for formal text */
.font-righteous      /* Righteous - Bold display font */
.font-corinthia      /* Corinthia (400,700) - Elegant cursive accents */
```

### Global Defaults
- **Body**: `font-saira antialiased` (applied to html/body)
- **Default weight**: Normal
- **Default color**: `text-foreground` (95% white)

### Heading System
```css
h1               /* font-quicksand font-light text-5xl text-white (Global default) */
.text-gradient   /* Reusable orange-to-cyan animated gradient effect */
h2               /* font-quicksand font-light (inherits size) */
.script-tagline  /* font-corinthia text-white (elegant script accent) */
```

### Text Utilities
```css
.text-gold       /* Gold accent color */
.text-salmon     /* Primary brand color */
.text-white      /* Pure white */
.text-cyan       /* Cyan accent */
```

## 🎨 Color System

### Brand Colors
- **Primary**: `--salmon` (hsl(16, 100%, 73%)) - Salmon/coral
- **Secondary**: `--cyan` (hsl(180, 100%, 50%)) - Bright cyan
- **Accent**: `--gold` (hsl(45, 100%, 70%)) - Gold highlights

### Background System
- **Primary**: `--background` (hsl(260, 30%, 8%)) - Dark purple-gray
- **Foreground**: `--foreground` (hsl(0, 0%, 95%)) - Near white
- **Muted**: Various gray tones for secondary content

## 🔘 Button System

### Primary Buttons
```css
.btn-salmon      /* Salmon gradient with white text */
.btn-cyan        /* Cyan gradient with white text */
.btn-gold        /* Gold gradient with dark text */
.btn-outline     /* Transparent with colored border */
```

### Card Buttons
```css
.card-btn-salmon /* Full-width card footer button */
.card-btn-cyan   /* Alternative card button style */
```

### Button Features
- Font: `font-barlow font-semibold text-lg`
- Shape: `rounded-full` with `px-8 py-4` padding
- Effects: Smooth gradients with hover state changes
- Transitions: `transition-all duration-300`

## 📦 Card System

### Studio Cards
```css
.studio-card     /* Premium card with gradient background and glow */
```
- Background: Dark gradient (260°, 25%, 12% → 220°, 20%, 10%)
- Border: Salmon accent (rgba(255, 107, 107, 0.3))
- Effects: Shadow, glow, hover scale transform
- Padding: `p-8`, rounded: `rounded-2xl`

## 🖼️ Layout Components

### Navigation
- Font: `font-light` for menu items
- Transitions: `duration-300` for color changes
- Mobile: Overlay with dark background

### Hero Sections
- Large text: `text-4xl md:text-6xl lg:text-7xl`
- Weight: `font-bold` for titles, `font-medium` for subtitles
- Colors: `text-white` titles, `text-gold` subtitles

### Gallery Components
- Grid layouts with responsive breakpoints
- Hover effects with scale and opacity changes
- Badge system for image counts and status

## 🎭 Animation Classes

### Custom Animations
```css
.animate-float           /* Floating scroll indicator */
.animate-slide-up-delay-100  /* Staggered content entrance */
.animate-slide-up-delay-200
.animate-slide-up-delay-300
```

### Transition Patterns
- **Standard**: `transition-all duration-300`
- **Slow**: `duration-500` for major state changes
- **Hover effects**: Scale transforms (`hover:scale-105`)

## 🧩 Component Patterns

### Form Elements
- Inputs: Dark backgrounds with salmon focus states
- Labels: `font-medium` weight
- Validation: Color-coded feedback

### Modal/Dialog System
- Backdrop: Dark overlay
- Content: Card-style with studio-card base
- Headers: `font-saira font-bold`

### Gallery Systems
- Aspect ratio utilities for image consistency
- Masonry layouts with precise gap control
- Color picker components with swatch system

## 📱 Responsive Design

### Breakpoints (Tailwind defaults)
- **sm**: 640px
- **md**: 768px  
- **lg**: 1024px
- **xl**: 1280px

### Common Patterns
- Mobile-first responsive typography scaling
- Hide/show elements based on screen size
- Adjust padding/margins for mobile optimization

## 🎯 Usage Guidelines

### Font Selection
- **Headings**: Use `font-saira` for strong, condensed impact
- **Body text**: Default `font-saira` works well
- **Buttons/UI**: Use `font-barlow` for readability
- **Accents**: Use `font-corinthia` sparingly for elegance

### Color Usage
- **Salmon**: Primary actions, brand elements
- **Cyan**: Secondary actions, highlights
- **Gold**: Special accents, success states
- **White**: Main text on dark backgrounds

### Component Consistency
- Always use predefined button classes
- Maintain consistent card styling with `.studio-card`
- Apply standard transition classes for smooth interactions
- Use the established grid and spacing system

## 🧹 Clean CSS Strategy (CRITICAL)

### Core Philosophy: NO OVERRIDES
**Never fight CSS specificity with `!important` or more specific selectors unless absolutely necessary.**

### Clean Code Methodology
1. **Define Global Defaults**: Set base styles for HTML elements (h1, h2, etc.) in global CSS
2. **Remove Inline Overrides**: Systematically remove all inline classes that override global styles
3. **Use Semantic Classes**: Create reusable utility classes (.text-gradient, .script-tagline)
4. **Ask Before Override**: If no clean solution exists, explicitly ask before using `!important` or specificity hacks

### Implementation Process
When changing typography or styling:
1. Update the global CSS definition
2. Search for all inline overrides (e.g., `text-5xl`, `text-cyan`)  
3. Remove overrides systematically, file by file
4. Test that global styles apply correctly
5. Only then consider component-specific classes if needed

### Examples of Clean vs. Dirty Code
```css
/* ❌ DIRTY: Fighting overrides with !important */
h1 {
  font-size: 1.5rem !important;
}

/* ✅ CLEAN: Global default + removed inline overrides */
h1 {
  @apply font-quicksand font-light text-5xl text-white;
}
```

```jsx
{/* ❌ DIRTY: Inline override */}
<h1 className="text-7xl lg:text-8xl font-bold">

{/* ✅ CLEAN: Uses global h1 styling */}  
<h1 className="mb-6">
```

## 🔧 Development Notes

### CSS Architecture
- Uses Tailwind CSS with custom component layer
- PostCSS for processing
- CSS variables for theme colors
- Component-scoped styling in React files
- **Global-first approach**: HTML elements have consistent defaults site-wide

### Performance
- Fonts preloaded in index.html
- Critical CSS inlined
- Optimized for fast loading and rendering
- Minimal CSS specificity conflicts = faster rendering

---

*This reference should be consulted before adding new styles or modifying existing components to maintain visual consistency across the SlyFox Studios platform.*