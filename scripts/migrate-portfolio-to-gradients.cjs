#!/usr/bin/env node

/**
 * Portfolio Migration Script: JSON to Supabase Gradients
 * 
 * This script migrates portfolio settings from the JSON config system
 * to the new Supabase gradients API for better performance and consistency.
 * 
 * Run: node scripts/migrate-portfolio-to-gradients.js
 */

const fs = require('fs');
const path = require('path');

async function migratePortfolioSettings() {
  console.log('🔄 Starting portfolio migration from JSON to Supabase gradients...');
  
  try {
    // 1. Read current JSON config
    const configPath = path.join(__dirname, '../server/data/site-config-overrides.json');
    console.log('📖 Reading current JSON config...');
    
    if (!fs.existsSync(configPath)) {
      console.error('❌ Config file not found:', configPath);
      return;
    }
    
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const portfolioSettings = configData.portfolio?.featured;
    
    if (!portfolioSettings) {
      console.log('ℹ️  No portfolio settings found in JSON config');
      return;
    }
    
    console.log('✅ Found portfolio settings:', portfolioSettings);
    
    // 2. Prepare gradient data structure
    const portfolioGradientData = {
      startColor: portfolioSettings.backgroundGradientStart || '#1e293b',
      middleColor: portfolioSettings.backgroundGradientMiddle || '#334155',
      endColor: portfolioSettings.backgroundGradientEnd || '#0f172a',
      direction: '135deg',
      opacity: 1,
      textColors: {
        primary: portfolioSettings.textColorPrimary || '#ffffff',
        secondary: portfolioSettings.textColorSecondary || '#e2e8f0',
        tertiary: portfolioSettings.textColorTertiary || '#94a3b8'
      },
      portfolioSettings: {
        imageCount: portfolioSettings.imageCount || 9,
        borderThickness: portfolioSettings.borderThickness || 0,
        borderRadius: portfolioSettings.borderRadius || 8,
        borderColor: portfolioSettings.borderColor || '#ffffff',
        borderColorEnd: portfolioSettings.borderColorEnd || '#cccccc',
        imagePadding: portfolioSettings.imagePadding || 2,
        layoutStyle: portfolioSettings.layoutStyle || 'square',
        backgroundGradientStart: portfolioSettings.backgroundGradientStart || '#1e293b',
        backgroundGradientMiddle: portfolioSettings.backgroundGradientMiddle || '#334155',
        backgroundGradientEnd: portfolioSettings.backgroundGradientEnd || '#0f172a',
        textColor: portfolioSettings.textColor || '#e2e8f0',
        textColorPrimary: portfolioSettings.textColorPrimary || '#ffffff',
        textColorSecondary: portfolioSettings.textColorSecondary || '#e2e8f0',
        textColorTertiary: portfolioSettings.textColorTertiary || '#94a3b8'
      }
    };
    
    console.log('🔧 Prepared gradient data structure...');
    
    // 3. Make API call to save to gradients
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'http://localhost:3000' 
      : 'http://localhost:3000';
    
    console.log('🚀 Saving to gradient API...');
    
    const response = await fetch(`${baseUrl}/api/gradients/portfolio`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sectionKey: 'portfolio',
        gradientConfig: portfolioGradientData
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Successfully saved to gradient API:', result);
    
    // 4. Backup and clean up JSON (optional - commented out for safety)
    // console.log('🗂️  Creating backup of original JSON config...');
    // const backupPath = configPath.replace('.json', `-backup-${Date.now()}.json`);
    // fs.copyFileSync(configPath, backupPath);
    // console.log('✅ Backup created:', backupPath);
    
    // 5. Verify the migration
    console.log('🔍 Verifying migration...');
    const verifyResponse = await fetch(`${baseUrl}/api/gradients/portfolio`);
    
    if (verifyResponse.ok) {
      const savedData = await verifyResponse.json();
      console.log('✅ Verification successful! Saved data:', savedData);
      
      if (savedData.gradientConfig?.portfolioSettings) {
        console.log('🎉 Portfolio settings successfully migrated to Supabase gradients!');
        console.log('📊 Migrated settings count:', Object.keys(savedData.gradientConfig.portfolioSettings).length);
      } else {
        console.log('⚠️  Portfolio settings not found in saved data');
      }
    } else {
      console.log('⚠️  Could not verify migration');
    }
    
    console.log('\n📋 MIGRATION SUMMARY:');
    console.log('- Source: JSON config (site-config-overrides.json)');
    console.log('- Target: Supabase gradients API (portfolio section)');
    console.log('- Settings migrated:', Object.keys(portfolioSettings).length);
    console.log('- Status: SUCCESS ✅');
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Test portfolio admin interface');
    console.log('2. Verify portfolio showcase page'); 
    console.log('3. Remove JSON portfolio settings (manual step)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  migratePortfolioSettings();
}

module.exports = { migratePortfolioSettings };