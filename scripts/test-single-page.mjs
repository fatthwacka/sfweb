#!/usr/bin/env node

/**
 * Single Page Test Script
 * Test any page to validate the complete E2E workflow
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  productionUrl: 'https://slyfox.co.za',
  developmentUrl: 'http://localhost:3000'
};

// Available test pages
const TEST_PAGES = {
  'photography-corporate': {
    url: '/photography/corporate',
    type: 'photography',
    category: 'corporate',
    adminTab: 'photography-corporate',
    sections: ['hero', 'services', 'packages', 'recent-work', 'seo']
  },
  'photography-events': {
    url: '/photography/events',
    type: 'photography', 
    category: 'events',
    adminTab: 'photography-events',
    sections: ['hero', 'services', 'packages', 'recent-work', 'seo']
  },
  'photography-portraits': {
    url: '/photography/portraits',
    type: 'photography',
    category: 'portraits',
    adminTab: 'photography-portraits',
    sections: ['hero', 'services', 'packages', 'recent-work', 'seo']
  },
  'photography-products': {
    url: '/photography/products',
    type: 'photography',
    category: 'products',
    adminTab: 'photography-products',
    sections: ['hero', 'services', 'packages', 'recent-work', 'seo']
  },
  'photography-weddings': {
    url: '/photography/weddings',
    type: 'photography',
    category: 'weddings',
    adminTab: 'photography-weddings',
    sections: ['hero', 'services', 'packages', 'recent-work', 'seo']
  },
  'videography-weddings': {
    url: '/videography/weddings',
    type: 'videography',
    category: 'weddings', 
    adminTab: 'videography-weddings',
    sections: ['hero', 'services', 'packages', 'recent-work', 'seo']
  },
  'home': {
    url: '/',
    type: 'static',
    category: null,
    adminTab: 'home',
    sections: ['hero', 'services', 'portfolio', 'testimonials', 'cta']
  },
  'about': {
    url: '/about',
    type: 'static',
    category: null,
    adminTab: 'about', 
    sections: ['hero', 'story', 'team', 'values', 'location', 'cta']
  }
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

function normalizeColor(color) {
  if (!color) return '';
  if (color.startsWith('hsl(')) {
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      return hslToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    }
  }
  return color.toLowerCase();
}

function colorsMatch(color1, color2) {
  return normalizeColor(color1) === normalizeColor(color2);
}

class SinglePageTest {
  constructor(pageKey) {
    this.page = TEST_PAGES[pageKey];
    if (!this.page) {
      throw new Error(`Unknown page: ${pageKey}. Available: ${Object.keys(TEST_PAGES).join(', ')}`);
    }
    this.pageKey = pageKey;
  }

  async fetchConfigurations() {
    console.log('🔍 Fetching configurations...');
    
    try {
      // Fetch production config
      const prodResponse = await fetch(`${CONFIG.productionUrl}/api/site-config`);
      const productionConfig = await prodResponse.json();
      
      // Fetch dev gradients
      const devResponse = await fetch(`${CONFIG.developmentUrl}/api/gradients`);
      const devGradients = await devResponse.json();
      
      return { production: productionConfig, dev: devGradients };
    } catch (error) {
      console.log(`❌ Failed to fetch configurations: ${error.message}`);
      return null;
    }
  }

  extractGradientFromConfig(config, sectionName) {
    try {
      if (this.page.type === 'photography' || this.page.type === 'videography') {
        const categoryData = config?.categoryPages?.[this.page.type]?.[this.page.category];
        
        const sectionMap = {
          'hero': 'hero',
          'services': 'serviceOverview', 
          'packages': 'packages',
          'recent-work': 'recentWork',
          'seo': 'seoContent'
        };
        
        const configSection = sectionMap[sectionName];
        return categoryData?.[configSection]?.gradients;
      } else {
        // Static pages - check gradients config
        const sectionKey = this.page.url === '/' ? sectionName : `${this.pageKey}-${sectionName}`;
        return config?.gradients?.[sectionKey];
      }
    } catch (error) {
      return null;
    }
  }

  generateSectionKey(sectionName) {
    if (this.page.type === 'photography' || this.page.type === 'videography') {
      const singularCategory = this.page.category.replace(/s$/, '');
      return `${this.page.type}-${singularCategory}-${sectionName}`;
    } else {
      return this.page.url === '/' ? sectionName : `${this.pageKey}-${sectionName}`;
    }
  }

  async updateGradient(sectionKey, gradientData) {
    const payload = {
      gradientConfig: {
        startColor: normalizeColor(gradientData.startColor),
        middleColor: normalizeColor(gradientData.middleColor), 
        endColor: normalizeColor(gradientData.endColor),
        direction: gradientData.direction || 'to right',
        opacity: gradientData.opacity || 0.9,
        textColors: gradientData.textColors || {
          primary: '#ffffff',
          secondary: '#e2e8f0',
          tertiary: '#94a3b8'
        }
      }
    };
    
    try {
      const response = await fetch(`${CONFIG.developmentUrl}/api/gradients/${sectionKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      return response.ok;
    } catch (error) {
      console.log(`❌ Error updating ${sectionKey}: ${error.message}`);
      return false;
    }
  }

  async testPage() {
    console.log('\n' + '🧪 SINGLE PAGE TEST'.padStart(50));
    console.log('═'.repeat(70));
    console.log(`📄 Testing: ${this.page.url} (${this.pageKey})`);
    console.log(`📦 Sections: ${this.page.sections.length}`);
    console.log(`🎯 Type: ${this.page.type}`);
    console.log('═'.repeat(70));

    // Step 1: Fetch configurations
    const configs = await this.fetchConfigurations();
    if (!configs) {
      console.log('❌ Cannot proceed without configuration data');
      return;
    }

    let results = {
      tested: 0,
      foundInProduction: 0,
      mismatches: 0, 
      updated: 0,
      missing: 0
    };

    // Step 2: Test each section
    for (const sectionName of this.page.sections) {
      const sectionKey = this.generateSectionKey(sectionName);
      
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📍 SECTION: ${sectionName.toUpperCase()}`);
      console.log(`🔑 Key: ${sectionKey}`);
      console.log(`${'─'.repeat(60)}`);
      
      results.tested++;

      // Extract production gradient
      const prodGradient = this.extractGradientFromConfig(configs.production, sectionName);
      
      if (!prodGradient) {
        console.log(`⚠️  No gradient in production config`);
        results.missing++;
        
        // Check if it exists in dev anyway
        const devGradient = configs.dev[sectionKey];
        if (devGradient) {
          console.log(`✅ Found in dev database (using dev colors)`);
          console.log(`   Dev: ${devGradient.startColor} → ${devGradient.middleColor} → ${devGradient.endColor}`);
        } else {
          console.log(`❌ Not found in dev database either`);
        }
        continue;
      }

      results.foundInProduction++;
      console.log(`✅ Found in production:`);
      console.log(`   Prod: ${prodGradient.startColor} → ${prodGradient.middleColor} → ${prodGradient.endColor}`);

      // Check dev database
      const devGradient = configs.dev[sectionKey];
      
      if (!devGradient) {
        console.log(`❌ Missing in dev database`);
        console.log(`📝 Creating from production...`);
        
        const updated = await this.updateGradient(sectionKey, prodGradient);
        if (updated) {
          console.log(`✅ Created successfully`);
          results.updated++;
        } else {
          console.log(`❌ Failed to create`);
        }
        continue;
      }

      // Compare colors
      console.log(`📊 Found in dev:`);
      console.log(`   Dev:  ${devGradient.startColor} → ${devGradient.middleColor} → ${devGradient.endColor}`);
      
      const startMatch = colorsMatch(prodGradient.startColor, devGradient.startColor);
      const middleMatch = colorsMatch(prodGradient.middleColor, devGradient.middleColor);
      const endMatch = colorsMatch(prodGradient.endColor, devGradient.endColor);
      
      if (startMatch && middleMatch && endMatch) {
        console.log(`✅ Colors match perfectly`);
      } else {
        console.log(`❌ Colors don't match`);
        console.log(`📝 Updating from production...`);
        results.mismatches++;
        
        const updated = await this.updateGradient(sectionKey, prodGradient);
        if (updated) {
          console.log(`✅ Updated successfully`);
          results.updated++;
        } else {
          console.log(`❌ Failed to update`);
        }
      }
    }

    // Step 3: Generate report
    console.log('\n' + '📊 TEST RESULTS'.padStart(50));
    console.log('═'.repeat(70));
    console.log(`📄 Page: ${this.page.url}`);
    console.log(`🧪 Sections tested: ${results.tested}`);
    console.log(`✅ Found in production: ${results.foundInProduction}/${results.tested}`);
    console.log(`⚠️  Mismatches found: ${results.mismatches}`);
    console.log(`❌ Missing from production: ${results.missing}`);
    console.log(`📝 Updates applied: ${results.updated}`);
    
    const successRate = results.tested > 0 ? Math.round((results.foundInProduction / results.tested) * 100) : 0;
    console.log(`📈 Success rate: ${successRate}%`);

    console.log('\n🌐 Test URLs:');
    console.log(`   Live: ${CONFIG.productionUrl}${this.page.url}`);
    console.log(`   Dev:  ${CONFIG.developmentUrl}${this.page.url}`);
    console.log(`   Admin: ${CONFIG.developmentUrl}/admin?tab=${this.page.adminTab}`);
    
    console.log('═'.repeat(70));
    
    if (results.mismatches === 0 && results.missing === 0) {
      console.log('🎉 SUCCESS! All sections properly configured.');
    } else if (results.updated > 0) {
      console.log('✅ IMPROVED! Applied fixes to mismatched sections.');
    } else {
      console.log('⚠️  Some issues remain - may need manual intervention.');
    }
  }
}

// Main execution
async function main() {
  const pageKey = process.argv[2];
  
  if (!pageKey) {
    console.log('Usage: node test-single-page.mjs <page-key>');
    console.log('\nAvailable pages:');
    Object.keys(TEST_PAGES).forEach(key => {
      const page = TEST_PAGES[key];
      console.log(`  ${key.padEnd(20)} - ${page.url} (${page.sections.length} sections)`);
    });
    return;
  }

  try {
    const test = new SinglePageTest(pageKey);
    await test.testPage();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();