# SlyFox Studios - Organized Image Assets

## Directory Structure

### `/logos/`
- `slyfox-logo-black.png` ✅ - Main SlyFox Studios logo (black version)

### `/backgrounds/`
- `hero-wedding-photography.jpg` ✅ - Main hero section background
- `photography-category-hero.jpg` ✅ - Photography category page hero background
- `wedding-hero-background.jpg` ✅ - Wedding category page hero
- `portrait-hero-background.jpg` ✅ - Portrait category page hero
- `corporate-hero-background.jpg` ✅ - Corporate category page hero
- `event-hero-background.jpg` ✅ - Event category page hero
- `commercial-hero-background.jpg` ✅ - Commercial category page hero
- `family-hero-background.jpg` ✅ - Family category page hero

### `/portfolio/`
- `wedding-couple-1.jpg` ✅ - Wedding ceremony showcase
- `wedding-couple-2.jpg` ✅ - Wedding portraits showcase
- `wedding-couple-3.jpg` ✅ - Wedding reception showcase
- `portrait-professional-1.jpg` ✅ - Business headshot showcase
- `portrait-professional-2.jpg` ✅ - Creative portrait showcase
- `portrait-professional-3.jpg` ✅ - Outdoor portrait showcase

### `/gallery/`
- `wedding-gallery-1.jpg` through `wedding-gallery-6.jpg` ✅ - Wedding category examples
- `portrait-gallery-1.jpg` through `portrait-gallery-6.jpg` ✅ - Portrait category examples
- `corporate-gallery-1.jpg` through `corporate-gallery-6.jpg` ✅ - Corporate category examples
- `event-gallery-1.jpg` through `event-gallery-6.jpg` ✅ - Event category examples
- `commercial-gallery-1.jpg` through `commercial-gallery-6.jpg` ✅ - Commercial category examples
- `family-gallery-1.jpg` through `family-gallery-6.jpg` ✅ - Family category examples

### `/testimonials/`
- `client-sarah-jones.jpg` ✅ - Sarah Mitchell testimonial photo
- `client-mike-johnson.jpg` ✅ - Michael Thompson testimonial photo
- `client-emma-davis.jpg` ✅ - Emma Rodriguez testimonial photo

### `/services/`
- `photography-service-showcase.jpg` ✅ - General photography service image
- `about-photographer-portrait.jpg` ✅ - About section photographer image

### `/meta/`
- `/public/favicon.png` ✅ (root level)
- `/public/og-image.jpg` ✅ (root level)

## Usage Instructions

### To Replace Images:
1. **Keep the same filename** - this ensures no code changes are needed
2. **Maintain aspect ratios** - backgrounds should be landscape/wide format
3. **Optimize file sizes** - compress images for web use
4. **Use descriptive names** - makes management easier

### Adding New Images:
1. Create appropriate subdirectories in `/images/`
2. Use descriptive filenames like `portfolio-wedding-sample-01.jpg`
3. Reference them in code as `/images/category/filename.ext`

## ✅ CONVERSION COMPLETE: All Unsplash URLs Replaced

**ALL WEBSITE IMAGES NOW USE LOCAL FILES:**
- ✅ Navigation logo: `/images/logos/slyfox-logo-black.png`
- ✅ Hero backgrounds: `/images/backgrounds/hero-wedding-photography.jpg`
- ✅ Category page heroes: `/images/backgrounds/[category]-hero-background.jpg`
- ✅ Portfolio showcases: `/images/portfolio/[type]-[number].jpg`
- ✅ Gallery examples: `/images/gallery/[category]-gallery-[1-6].jpg`
- ✅ Testimonials: `/images/testimonials/client-[name].jpg`
- ✅ Services: `/images/services/[service]-showcase.jpg`
- ✅ Meta files: `/favicon.png` & `/og-image.jpg` (root level)

**PLACEHOLDER STATUS:**
All files currently contain placeholder images (logo) ready to be replaced with your actual photography. 

**REPLACEMENT WORKFLOW:**
1. Replace any image by dropping a new file with the exact same filename
2. Changes appear instantly across the website
3. No code changes needed

## Notes
- All user gallery images are stored in Supabase (not in this directory)
- This directory is for static site assets only
- Images are served directly from the public directory
- **Total files ready for replacement: 50+ image placeholders**