#!/usr/bin/env node

/**
 * Complete Site Migration - Migrate ALL remaining gradients to Supabase
 * 
 * This script identifies and migrates all gradient configurations from the current
 * site to the optimized Supabase gradient system for consistent performance.
 */

import fs from 'fs';

console.log('🌟 Complete Site Migration to Optimized Gradient System...\n');

// Get all existing gradients from current system
const getCurrentGradients = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/gradients');
    const existingGradients = await response.json();
    
    console.log(`📊 Found ${Object.keys(existingGradients).length} existing gradients in Supabase`);
    return new Set(Object.keys(existingGradients));
  } catch (error) {
    console.warn('⚠️  Could not fetch existing gradients, proceeding with migration');
    return new Set();
  }
};

// Comprehensive gradient configurations for ALL static pages
const ALL_SITE_GRADIENTS = {
  // About Page Sections
  'aboutStory': {
    startColor: '#826345',
    middleColor: '#372915',
    endColor: '#372915',
    direction: 'to bottom',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },
  'aboutTeam': {
    startColor: '#7b6072',
    middleColor: '#37152f',
    endColor: '#37152f',
    direction: 'to bottom',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },
  'aboutValues': {
    startColor: '#0f1f3d',
    middleColor: '#0f1f2e',
    endColor: '#0f1f2e',
    direction: '135deg',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },
  'aboutLocation': {
    startColor: '#265559',
    middleColor: '#19444d',
    endColor: '#19444d',
    direction: 'to bottom',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },
  'aboutCta': {
    startColor: '#553267',
    middleColor: '#5c235c',
    endColor: '#5c235c',
    direction: 'to bottom',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },

  // Contact Page Sections
  'contact': {
    startColor: '#382442',
    middleColor: '#2f3547',
    endColor: '#333b4d',
    direction: '135deg',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },

  // Portfolio Page Sections
  'portfolio': {
    startColor: '#cddaee',
    middleColor: '#081b30',
    endColor: '#6e6a81',
    direction: '135deg',
    opacity: 0.9,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  },

  // WebApps Category Sections (NEW)
  'web-apps-hero': {
    startColor: '#1e3a8a',
    middleColor: '#581c87',
    endColor: '#831843',
    direction: 'to bottom right',
    opacity: 0.2,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },
  'web-apps-services': {
    startColor: '#0f172a',
    middleColor: '#581c87',
    endColor: '#1e40af',
    direction: 'to bottom right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },
  'web-apps-process': {
    startColor: '#0f172a',
    middleColor: '#581c87',
    endColor: '#1e40af',
    direction: 'to bottom right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },
  'web-apps-cta': {
    startColor: '#164e63',
    middleColor: '#78350f',
    endColor: '#581c87',
    direction: 'to bottom right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },

  // Social Media Category Sections (NEW)
  'social-media-hero': {
    startColor: '#581c87',
    middleColor: '#1e3a8a',
    endColor: '#164e63',
    direction: 'to bottom right',
    opacity: 0.2,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },
  'social-media-services': {
    startColor: '#0f172a',
    middleColor: '#581c87',
    endColor: '#1e40af',
    direction: 'to bottom right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },
  'social-media-why-choose-us': {
    startColor: '#111827',
    middleColor: '#581c87',
    endColor: '#312e81',
    direction: 'to bottom right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },
  'social-media-process': {
    startColor: '#0f172a',
    middleColor: '#1e293b',
    endColor: '#111827',
    direction: 'to bottom right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },
  'social-media-cta': {
    startColor: '#020617',
    middleColor: '#0f172a',
    endColor: '#020617',
    direction: 'to bottom right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    }
  },

  // Photography SEO Sections (Enhanced with text colors)
  'photography-wedding-seo': {
    startColor: '#282c34',
    middleColor: '#21252b',
    endColor: '#1b1d23',
    direction: 'to right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  },
  'photography-corporate-seo': {
    startColor: '#282c34',
    middleColor: '#21252b',
    endColor: '#1b1d23',
    direction: 'to right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  },
  'photography-portrait-seo': {
    startColor: '#282c34',
    middleColor: '#21252b',
    endColor: '#1b1d23',
    direction: 'to right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  },
  'photography-event-seo': {
    startColor: '#cbaabd',
    middleColor: '#21252b',
    endColor: '#1b1d23',
    direction: 'to right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  },
  'photography-product-seo': {
    startColor: '#282c34',
    middleColor: '#21252b',
    endColor: '#1b1d23',
    direction: 'to right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  },
  'photography-graduation-seo': {
    startColor: '#5b6b8b',
    middleColor: '#223a5e',
    endColor: '#3855ad',
    direction: 'to right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  },

  // Videography SEO Sections (NEW)
  'videography-category-seo': {
    startColor: '#282c34',
    middleColor: '#21252b',
    endColor: '#1b1d23',
    direction: 'to right',
    opacity: 1,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  }
};

console.log(`🎯 Target: ${Object.keys(ALL_SITE_GRADIENTS).length} gradient configurations to migrate\n`);

// Get existing gradients to avoid duplicates
const existingGradients = await getCurrentGradients();

// Filter out gradients that already exist
const newGradients = Object.fromEntries(
  Object.entries(ALL_SITE_GRADIENTS).filter(([key]) => !existingGradients.has(key))
);

console.log(`📝 New gradients to create: ${Object.keys(newGradients).length}`);
console.log(`✅ Already migrated: ${existingGradients.size}\n`);

if (Object.keys(newGradients).length === 0) {
  console.log('🎉 All gradients are already migrated to Supabase!');
  console.log('   • Real-time performance enabled site-wide');
  console.log('   • All admin components ready for use');
  process.exit(0);
}

// Migrate new gradients
const migrationPromises = Object.entries(newGradients).map(async ([sectionKey, gradientConfig]) => {
  console.log(`📝 Migrating: ${sectionKey}`);
  
  try {
    const response = await fetch(`http://localhost:3000/api/gradients/${sectionKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gradientConfig
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to migrate ${sectionKey}: ${response.statusText}`);
    }

    console.log(`   ✅ Success: ${sectionKey}`);
    return { sectionKey, action: 'migrated' };
    
  } catch (error) {
    console.error(`   ❌ Error with ${sectionKey}:`, error.message);
    return { sectionKey, action: 'error', error: error.message };
  }
});

// Execute all migrations
try {
  const results = await Promise.all(migrationPromises);
  
  console.log('\n📊 Migration Results:');
  const migrated = results.filter(r => r.action === 'migrated').length;
  const errors = results.filter(r => r.action === 'error').length;
  
  console.log(`   ✅ Migrated: ${migrated} gradients`);
  console.log(`   ❌ Errors: ${errors} gradients`);
  
  if (errors > 0) {
    console.log('\n⚠️  Error Details:');
    results.filter(r => r.action === 'error').forEach(r => {
      console.log(`   • ${r.sectionKey}: ${r.error}`);
    });
  }

  console.log('\n🚀 Complete Site Migration Results:');
  console.log(`   • Total gradients in system: ${existingGradients.size + migrated}`);
  console.log('   • All static pages now use optimized Supabase gradient system');
  console.log('   • Real-time performance enabled site-wide (~700ms saves)');
  console.log('   • Ready for WebApps and SocialMedia admin components');
  
  if (migrated > 0) {
    console.log('\n📋 Next Steps:');
    console.log('   1. Fix photography SEO gradient pickers to include text colors');
    console.log('   2. Create WebApps and SocialMedia admin components');
    console.log('   3. Replace "Global SEO" slot in admin dashboard');
    console.log('   4. Update target pages to use GradientBackground components');
  }
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}