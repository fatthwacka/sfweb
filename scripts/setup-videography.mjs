#!/usr/bin/env node

/**
 * Videography Setup Script
 * Option 1: Unified color scheme for all videography pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  developmentUrl: 'http://localhost:3000'
};

// Videography gradient configuration
const VIDEOGRAPHY_GRADIENTS = {
  // Landing page gradients (/videography)
  'videography-landing-hero': {
    startColor: '#1a1a2e',
    middleColor: '#16213e', 
    endColor: '#0f3460',
    direction: 'to right',
    opacity: 0.9,
    textColors: { primary: '#ffffff', secondary: '#e2e8f0', tertiary: '#94a3b8' }
  },
  'videography-landing-services': {
    startColor: '#2d1b42',
    middleColor: '#1a0f2e',
    endColor: '#0a051a',
    direction: 'to right',
    opacity: 0.9,
    textColors: { primary: '#ffffff', secondary: '#e2e8f0', tertiary: '#94a3b8' }
  },
  'videography-landing-portfolio': {
    startColor: '#42241d',
    middleColor: '#2e0f1a',
    endColor: '#1a050a',
    direction: 'to right',
    opacity: 0.9,
    textColors: { primary: '#ffffff', secondary: '#e2e8f0', tertiary: '#94a3b8' }
  },
  'videography-landing-testimonials': {
    startColor: '#1d2442',
    middleColor: '#0f1a2e',
    endColor: '#050a1a',
    direction: 'to right',
    opacity: 0.9,
    textColors: { primary: '#ffffff', secondary: '#e2e8f0', tertiary: '#94a3b8' }
  },
  'videography-landing-cta': {
    startColor: '#241d42',
    middleColor: '#1a0f2e',
    endColor: '#0a051a',
    direction: 'to right',
    opacity: 0.9,
    textColors: { primary: '#ffffff', secondary: '#e2e8f0', tertiary: '#94a3b8' }
  },

  // Category pages gradients (shared by all 6 categories)
  'videography-category-hero': {
    startColor: '#3d1a4d',
    middleColor: '#2a1133',
    endColor: '#1a0826',
    direction: 'to right',
    opacity: 0.9,
    textColors: { primary: '#ffffff', secondary: '#e2e8f0', tertiary: '#94a3b8' }
  },
  'videography-category-services': {
    startColor: '#4d1a3d',
    middleColor: '#331129',
    endColor: '#26081a',
    direction: 'to right',
    opacity: 0.9,
    textColors: { primary: '#ffffff', secondary: '#e2e8f0', tertiary: '#94a3b8' }
  },
  'videography-category-packages': {
    startColor: '#1a4d3d',
    middleColor: '#113325',
    endColor: '#08261a',
    direction: 'to right',
    opacity: 0.9,
    textColors: { primary: '#ffffff', secondary: '#e2e8f0', tertiary: '#94a3b8' }
  },
  'videography-category-recent-work': {
    startColor: '#4d3d1a',
    middleColor: '#332511',
    endColor: '#261a08',
    direction: 'to right',
    opacity: 0.9,
    textColors: { primary: '#ffffff', secondary: '#e2e8f0', tertiary: '#94a3b8' }
  },
  'videography-category-seo': {
    startColor: '#282c34',
    middleColor: '#21252b',
    endColor: '#1b1d23',
    direction: 'to right',
    opacity: 1.0,
    textColors: { primary: '#ffffff', secondary: '#e2e8f0', tertiary: '#94a3b8' }
  }
};

async function updateGradient(sectionKey, gradientData) {
  const payload = {
    gradientConfig: gradientData
  };
  
  try {
    const response = await fetch(`${CONFIG.developmentUrl}/api/gradients/${sectionKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log(`✅ Updated ${sectionKey}`);
      return true;
    } else {
      console.log(`❌ Failed to update ${sectionKey}: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error updating ${sectionKey}: ${error.message}`);
    return false;
  }
}

async function setupVideographyGradients() {
  console.log('\n🎬 VIDEOGRAPHY SETUP - UNIFIED COLOR SCHEME');
  console.log('═'.repeat(70));
  console.log('📄 Landing Page: /videography (5 sections)');
  console.log('📄 Category Pages: /videography/* (5 sections shared by 6 categories)');
  console.log('🎯 Strategy: Unified colors for professional consistency');
  console.log('═'.repeat(70));

  let updated = 0;
  let failed = 0;

  // Landing page gradients
  console.log('\n📍 LANDING PAGE GRADIENTS (/videography)');
  console.log('─'.repeat(50));
  for (const [sectionKey, gradientData] of Object.entries(VIDEOGRAPHY_GRADIENTS)) {
    if (sectionKey.startsWith('videography-landing-')) {
      const success = await updateGradient(sectionKey, gradientData);
      if (success) updated++; else failed++;
    }
  }

  // Category pages gradients  
  console.log('\n📍 CATEGORY PAGES GRADIENTS (shared by all 6 categories)');
  console.log('─'.repeat(50));
  for (const [sectionKey, gradientData] of Object.entries(VIDEOGRAPHY_GRADIENTS)) {
    if (sectionKey.startsWith('videography-category-')) {
      const success = await updateGradient(sectionKey, gradientData);
      if (success) updated++; else failed++;
    }
  }

  console.log('\n📊 SETUP RESULTS');
  console.log('═'.repeat(70));
  console.log(`✅ Successfully updated: ${updated}`);
  console.log(`❌ Failed to update: ${failed}`);
  console.log(`📈 Success rate: ${Math.round((updated / (updated + failed)) * 100)}%`);

  // Show the 6 categories that will share the category colors
  console.log('\n📄 Categories using shared colors:');
  const categories = ['weddings', 'corporate', 'events', 'products', 'social', 'animation'];
  categories.forEach(cat => {
    console.log(`   • /videography/${cat}`);
  });

  console.log('\n🌐 Test URLs:');
  console.log(`   Landing: ${CONFIG.developmentUrl}/videography`);
  console.log(`   Category: ${CONFIG.developmentUrl}/videography/weddings`);
  console.log(`   Admin: ${CONFIG.developmentUrl}/admin?tab=videography`);

  console.log('\n📋 Next Steps:');
  console.log('   1. Add GradientBackground components to videography pages');
  console.log('   2. Create admin interface with 2 tabs (landing + categories)');
  console.log('   3. Test gradient changes in admin dashboard');
  console.log('═'.repeat(70));
}

// Color scheme preview
async function showColorScheme() {
  console.log('\n🎨 VIDEOGRAPHY COLOR SCHEME PREVIEW');
  console.log('═'.repeat(70));
  
  console.log('\n🏠 Landing Page Colors:');
  Object.entries(VIDEOGRAPHY_GRADIENTS).forEach(([key, data]) => {
    if (key.startsWith('videography-landing-')) {
      const section = key.replace('videography-landing-', '');
      console.log(`   ${section.padEnd(12)}: ${data.startColor} → ${data.middleColor} → ${data.endColor}`);
    }
  });

  console.log('\n📂 Category Pages Colors (shared):');
  Object.entries(VIDEOGRAPHY_GRADIENTS).forEach(([key, data]) => {
    if (key.startsWith('videography-category-')) {
      const section = key.replace('videography-category-', '');
      console.log(`   ${section.padEnd(12)}: ${data.startColor} → ${data.middleColor} → ${data.endColor}`);
    }
  });
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'preview':
      await showColorScheme();
      break;
    case 'setup':
    default:
      await setupVideographyGradients();
      break;
  }
}

main().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});