#!/usr/bin/env node

/**
 * SEMANTIC HEADER HIERARCHY SCRIPT
 * 
 * Applies consistent color hierarchy across all gradient sections:
 * - PRIMARY (h1, h2): Section titles
 * - SECONDARY (h3, h4): Section subtitles  
 * - TERTIARY (h5, h6, p, .text-muted-foreground): Body text, features
 * 
 * EXCLUDES hero sections (they only need title color, no background)
 */

const fs = require('fs');
const path = require('path');

// All gradient sections found in the codebase
const ALL_SECTIONS = [
  'aboutCta', 'aboutLocation', 'aboutStory', 'aboutTeam', 'aboutValues',
  'contact', 'portfolio', 'privateGallery', 'services', 'testimonials',
  'photography-corporate-packages', 'photography-corporate-recent-work', 'photography-corporate-seo', 'photography-corporate-services',
  'photography-event-packages', 'photography-event-recent-work', 'photography-event-seo', 'photography-event-services',
  'photography-graduation-packages', 'photography-graduation-recent-work', 'photography-graduation-seo', 'photography-graduation-services',
  'photography-portrait-packages', 'photography-portrait-recent-work', 'photography-portrait-seo', 'photography-portrait-services',
  'photography-product-packages', 'photography-product-recent-work', 'photography-product-seo', 'photography-product-services',
  'photography-wedding-packages', 'photography-wedding-recent-work', 'photography-wedding-seo', 'photography-wedding-services',
  'social-media-cta', 'social-media-process', 'social-media-services', 'social-media-why-choose-us',
  'videography-category-packages', 'videography-category-recent-work', 'videography-category-services',
  'videography-landing-cta', 'videography-landing-portfolio', 'videography-landing-services',
  'web-apps-cta', 'web-apps-process', 'web-apps-services'
];

// HERO sections to skip (they don't need background colors, only title color)
const HERO_SECTIONS = [
  'hero', 'social-media-hero', 'web-apps-hero'
];

// Non-hero sections to update
const SECTIONS_TO_UPDATE = ALL_SECTIONS.filter(section => !HERO_SECTIONS.includes(section));

const CSS_FILE = path.join(__dirname, '../client/src/index.css');

/**
 * Generate semantic hierarchy CSS for a section
 */
function generateSectionCSS(sectionName) {
  return `
[data-gradient-section="${sectionName}"] h1,
[data-gradient-section="${sectionName}"] h2 {
  color: var(--${sectionName}-text-primary, #ffffff) !important;
}

[data-gradient-section="${sectionName}"] h3:not(.studio-card-title-accent),
[data-gradient-section="${sectionName}"] h4 {
  color: var(--${sectionName}-text-secondary, #e2e8f0) !important;
}

[data-gradient-section="${sectionName}"] h5,
[data-gradient-section="${sectionName}"] h6,
[data-gradient-section="${sectionName}"] p,
[data-gradient-section="${sectionName}"] .text-muted-foreground {
  color: var(--${sectionName}-text-tertiary, #94a3b8) !important;
}`;
}

/**
 * Remove existing CSS rules for a section
 */
function removeExistingCSS(cssContent, sectionName) {
  // Pattern to match any CSS rules for this section
  const sectionPattern = new RegExp(
    `\\[data-gradient-section="${sectionName}"\\][^}]+}`,
    'g'
  );
  
  return cssContent.replace(sectionPattern, '');
}

/**
 * Main execution
 */
function main() {
  console.log('🎨 APPLYING SEMANTIC HEADER HIERARCHY');
  console.log(`📋 Processing ${SECTIONS_TO_UPDATE.length} sections`);
  console.log(`⏭️  Skipping ${HERO_SECTIONS.length} hero sections: ${HERO_SECTIONS.join(', ')}`);
  
  // Read CSS file
  let cssContent = fs.readFileSync(CSS_FILE, 'utf8');
  console.log(`📖 Read CSS file: ${CSS_FILE}`);
  
  // Process each section
  let updatedSections = 0;
  let newCSS = '';
  
  for (const section of SECTIONS_TO_UPDATE) {
    console.log(`🔄 Processing: ${section}`);
    
    // Remove existing CSS for this section
    cssContent = removeExistingCSS(cssContent, section);
    
    // Generate new CSS
    newCSS += generateSectionCSS(section);
    updatedSections++;
  }
  
  // Add new CSS to the end of the file
  const finalCSS = cssContent + '\n\n/* SEMANTIC HEADER HIERARCHY - AUTO GENERATED */\n' + newCSS;
  
  // Write updated CSS
  fs.writeFileSync(CSS_FILE, finalCSS);
  
  console.log(`✅ SUCCESS: Updated ${updatedSections} sections`);
  console.log(`📁 Output: ${CSS_FILE}`);
  console.log('');
  console.log('🎯 HIERARCHY APPLIED:');
  console.log('   📢 PRIMARY (h1, h2): Section titles');
  console.log('   📝 SECONDARY (h3, h4): Section subtitles');  
  console.log('   📄 TERTIARY (h5, h6, p, .text-muted-foreground): Body text');
  console.log('');
  console.log('⚠️  MANUAL TASKS REMAINING:');
  console.log('   1. Update HTML: Change section subtitles from <p> to <h3>');
  console.log('   2. Test color mapping with gradient picker');
  console.log('   3. Remove hero section gradient pickers if desired');
}

if (require.main === module) {
  main();
}

module.exports = { generateSectionCSS, SECTIONS_TO_UPDATE, HERO_SECTIONS };