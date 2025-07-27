# SlyFox Studios - Organized Image Assets

## Directory Structure

### `/logos/`
- `slyfox-logo-black.png` - Main SlyFox Studios logo (black version)
- Replace with your actual logo files as needed

### `/backgrounds/`
- `hero-wedding-photography.jpg` - Main hero section background
- `photography-category-hero.jpg` - Photography category page hero background
- Replace with your professional photography backgrounds

### `/meta/`
- Reserved for favicon, og-image, and other meta images

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

### Current Image References:
- Navigation logo: `/images/logos/slyfox-logo-black.png`
- Hero background: `/images/backgrounds/hero-wedding-photography.jpg`
- Photography page: `/images/backgrounds/photography-category-hero.jpg`
- Favicon: `/favicon.png` (root level)
- OG Image: `/og-image.jpg` (root level)

## Notes
- All user gallery images are stored in Supabase (not in this directory)
- This directory is for static site assets only
- Images are served directly from the public directory