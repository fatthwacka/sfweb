#!/usr/bin/env node

/**
 * Fix Graduation Page Gradients
 * Simple interactive script to update graduation gradients
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  developmentUrl: 'http://localhost:3000'
};

// Color conversion utility
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Production graduation gradients (converted to HEX)
const PRODUCTION_GRADIENTS = {
  'photography-graduation-services': {
    startColor: hslToHex(50, 100, 15),  // #4d4000
    middleColor: hslToHex(40, 70, 12),  // #342609  
    endColor: hslToHex(30, 60, 10),     // #291a0a
    direction: 'to right',
    opacity: 0.9,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  },
  'photography-graduation-packages': {
    startColor: hslToHex(40, 100, 15),  // #4d3300
    middleColor: hslToHex(30, 70, 12),  // #341f09
    endColor: hslToHex(20, 60, 10),     // #291407
    direction: 'to right',
    opacity: 0.8,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  },
  'photography-graduation-recent-work': {
    startColor: hslToHex(20, 100, 15),  // #4d1a00
    middleColor: hslToHex(10, 70, 12),  // #340f09
    endColor: hslToHex(0, 60, 10),      // #290a0a
    direction: 'to right',
    opacity: 0.7,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  },
  'photography-graduation-seo': {
    startColor: hslToHex(220, 13, 18),  // #282a30
    middleColor: hslToHex(220, 13, 15), // #21232a
    endColor: hslToHex(220, 13, 12),    // #1b1d23
    direction: 'to right',
    opacity: 1.0,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
  },
  'photography-graduation-hero': {
    // Hero has no gradient in production, using a graduation-appropriate default
    startColor: '#2d1810',  // Dark brown
    middleColor: '#1f100a',  // Darker brown
    endColor: '#120804',     // Very dark brown
    direction: 'to right',
    opacity: 0.9,
    textColors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      tertiary: '#94a3b8'
    }
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

async function checkCurrentColors() {
  console.log('🔍 CURRENT GRADUATION COLORS IN DEV DATABASE:');
  console.log('═'.repeat(60));
  
  try {
    const response = await fetch(`${CONFIG.developmentUrl}/api/gradients`);
    const gradients = await response.json();
    
    Object.keys(PRODUCTION_GRADIENTS).forEach(key => {
      const current = gradients[key];
      const production = PRODUCTION_GRADIENTS[key];
      
      console.log(`\n📦 ${key}:`);
      if (current) {
        console.log(`   Current: ${current.startColor} → ${current.middleColor} → ${current.endColor}`);
        console.log(`   Should:  ${production.startColor} → ${production.middleColor} → ${production.endColor}`);
        
        const matches = current.startColor === production.startColor && 
                       current.middleColor === production.middleColor && 
                       current.endColor === production.endColor;
        console.log(`   Status:  ${matches ? '✅ MATCH' : '❌ DIFFERENT'}`);
      } else {
        console.log(`   Current: ❌ NOT FOUND`);
        console.log(`   Should:  ${production.startColor} → ${production.middleColor} → ${production.endColor}`);
      }
    });
  } catch (error) {
    console.log(`❌ Error fetching gradients: ${error.message}`);
  }
}

async function updateAllGradients() {
  console.log('\n🚀 UPDATING ALL GRADUATION GRADIENTS...');
  console.log('═'.repeat(60));
  
  let updated = 0;
  
  for (const [sectionKey, gradientData] of Object.entries(PRODUCTION_GRADIENTS)) {
    const success = await updateGradient(sectionKey, gradientData);
    if (success) updated++;
  }
  
  console.log(`\n📊 Updated ${updated}/${Object.keys(PRODUCTION_GRADIENTS).length} gradients`);
}

async function main() {
  console.log('\n🎓 GRADUATION PAGE GRADIENT FIXER');
  console.log('═'.repeat(60));
  console.log('📄 Target: /photography/graduation');
  console.log('🎯 Goal: Match production colors exactly');
  console.log('═'.repeat(60));
  
  // Show current state
  await checkCurrentColors();
  
  // Update all gradients
  await updateAllGradients();
  
  // Show final state
  console.log('\n🔍 VERIFICATION - UPDATED COLORS:');
  await checkCurrentColors();
  
  console.log('\n✅ GRADUATION PAGE UPDATE COMPLETE!');
  console.log('\n🌐 Test the results:');
  console.log(`   Live: https://slyfox.co.za/photography/graduation`);
  console.log(`   Dev:  http://localhost:3000/photography/graduation`);
  console.log(`   Admin: http://localhost:3000/admin?tab=photography-graduation`);
  
  console.log('\n📋 What to check:');
  console.log('   1. Colors should match between live and dev');
  console.log('   2. Admin dashboard should load current colors');
  console.log('   3. Changing colors in admin should update the page');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});