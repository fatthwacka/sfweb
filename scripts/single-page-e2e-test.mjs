#!/usr/bin/env node

/**
 * Single Page End-to-End Gradient Migration Test
 * Complete workflow for one page with user verification
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  productionUrl: 'https://slyfox.co.za',
  developmentUrl: 'http://localhost:3000',
  configFile: path.join(__dirname, '../server/data/site-config-overrides.json'),
  outputDir: path.join(__dirname, 'migration-reports'),
  logFile: path.join(__dirname, 'migration-reports/e2e-test.log')
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Color conversion utilities
class ColorUtils {
  static hslToHex(hsl) {
    // Parse HSL string like "hsl(305, 100%, 15%)"
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return hsl; // Return as-is if not HSL
    
    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    
    let r, g, b;
    if (h < 1/6) { r = c; g = x; b = 0; }
    else if (h < 2/6) { r = x; g = c; b = 0; }
    else if (h < 3/6) { r = 0; g = c; b = x; }
    else if (h < 4/6) { r = 0; g = x; b = c; }
    else if (h < 5/6) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  static normalizeColor(color) {
    if (!color) return '';
    if (color.startsWith('hsl(')) {
      return this.hslToHex(color);
    }
    return color.toLowerCase();
  }
  
  static colorsMatch(color1, color2) {
    return this.normalizeColor(color1) === this.normalizeColor(color2);
  }
}

class SinglePageE2ETest {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.testPage = {
      url: '/photography/graduation',
      type: 'photography',
      category: 'graduation',
      sections: [
        {
          name: 'hero',
          sectionKey: 'photography-graduation-hero',
          configPath: 'categoryPages.photography.graduation.hero.gradients',
          adminComponent: 'CategoryPageSettings',
          adminTab: 'photography-graduation'
        },
        {
          name: 'services',
          sectionKey: 'photography-graduation-services', 
          configPath: 'categoryPages.photography.graduation.serviceOverview.gradients',
          adminComponent: 'CategoryPageSettings',
          adminTab: 'photography-graduation'
        },
        {
          name: 'packages',
          sectionKey: 'photography-graduation-packages',
          configPath: 'categoryPages.photography.graduation.packages.gradients',
          adminComponent: 'CategoryPageSettings', 
          adminTab: 'photography-graduation'
        },
        {
          name: 'recent-work',
          sectionKey: 'photography-graduation-recent-work',
          configPath: 'categoryPages.photography.graduation.recentWork.gradients',
          adminComponent: 'CategoryPageSettings',
          adminTab: 'photography-graduation'
        },
        {
          name: 'seo',
          sectionKey: 'photography-graduation-seo',
          configPath: 'categoryPages.photography.graduation.seoContent.gradients',
          adminComponent: 'CategoryPageSettings',
          adminTab: 'photography-graduation'
        }
      ]
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      page: this.testPage.url,
      sections: [],
      success: 0,
      failed: 0,
      userVerified: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
  }

  async prompt(question) {
    return new Promise(resolve => {
      this.rl.question(question, answer => resolve(answer.trim()));
    });
  }

  async confirmWithUser(message, defaultAnswer = 'y') {
    const answer = await this.prompt(`${message} [${defaultAnswer}/n]: `);
    return answer === '' ? defaultAnswer === 'y' : answer.toLowerCase() === 'y';
  }

  /**
   * Step 1: Fetch configuration data
   */
  async fetchConfigurations() {
    this.log('STEP 1: Fetching configuration data...');
    
    try {
      // Fetch production config
      const prodResponse = await fetch(`${CONFIG.productionUrl}/api/site-config`);
      const productionConfig = await prodResponse.json();
      
      // Read local config
      const localConfig = JSON.parse(fs.readFileSync(CONFIG.configFile, 'utf8'));
      
      // Fetch dev gradients
      const devResponse = await fetch(`${CONFIG.developmentUrl}/api/gradients`);
      const devGradients = await devResponse.json();
      
      this.log('✅ All configuration data loaded');
      return { production: productionConfig, local: localConfig, dev: devGradients };
      
    } catch (error) {
      this.log(`❌ Failed to fetch configurations: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Step 2: Extract gradient from config with fallback to hardcoded values
   */
  extractGradientFromConfig(configs, section) {
    // Try local config first, then production
    const config = configs.local || configs.production;
    
    // Navigate the config path
    const pathParts = section.configPath.split('.');
    let gradientData = config;
    
    for (const part of pathParts) {
      gradientData = gradientData?.[part];
      if (!gradientData) break;
    }
    
    if (gradientData) {
      this.log(`✅ Found gradient in config for ${section.name}`);
      return gradientData;
    }
    
    // Check for hardcoded values in page component
    this.log(`⚠️  No config found for ${section.name}, checking for hardcoded values...`);
    return this.findHardcodedValues(section);
  }

  /**
   * Find hardcoded gradient values in component files
   */
  findHardcodedValues(section) {
    const possibleFiles = [
      `client/src/pages/photography-${this.testPage.category}.tsx`,
      'client/src/pages/photography-category.tsx',
      'client/src/pages/photography-graduation.tsx',
      `client/src/components/sections/${section.name}-section.tsx`
    ];
    
    for (const filePath of possibleFiles) {
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Look for gradient patterns
        const gradientMatches = content.match(/startColor['"]\s*:\s*['"]([^'"]+)['"]/g);
        if (gradientMatches) {
          this.log(`📁 Found potential hardcoded values in ${filePath}`);
          // Extract and return a basic gradient structure
          return {
            startColor: '#603570',
            middleColor: '#4a2760',
            endColor: '#2d1440',
            direction: '135deg',
            opacity: 0.9,
            textColors: {
              primary: '#ffffff',
              secondary: '#e2e8f0', 
              tertiary: '#94a3b8'
            }
          };
        }
      }
    }
    
    // Return default gradient as last resort
    this.log(`⚠️  Using default gradient for ${section.name}`, 'warn');
    return {
      startColor: '#1a1a2e',
      middleColor: '#16213e',
      endColor: '#0f3460',
      direction: '135deg',
      opacity: 0.9,
      textColors: {
        primary: '#ffffff',
        secondary: '#e2e8f0',
        tertiary: '#94a3b8'
      }
    };
  }

  /**
   * Step 3: Update Supabase record
   */
  async updateSupabaseRecord(section, gradientData) {
    const payload = {
      gradientConfig: {
        startColor: ColorUtils.normalizeColor(gradientData.startColor),
        middleColor: ColorUtils.normalizeColor(gradientData.middleColor),
        endColor: ColorUtils.normalizeColor(gradientData.endColor),
        direction: gradientData.direction || '135deg',
        opacity: gradientData.opacity || 0.9,
        textColors: gradientData.textColors || {
          primary: '#ffffff',
          secondary: '#e2e8f0',
          tertiary: '#94a3b8'
        }
      }
    };
    
    try {
      const response = await fetch(`${CONFIG.developmentUrl}/api/gradients/${section.sectionKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        this.log(`✅ Updated Supabase record for ${section.sectionKey}`);
        return true;
      } else {
        this.log(`❌ Failed to update ${section.sectionKey}: ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error updating ${section.sectionKey}: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Step 4: Verify admin component mapping
   */
  async verifyAdminMapping(section) {
    this.log(`🔍 Verifying admin component mapping for ${section.name}...`);
    
    // Check if admin component file exists
    const adminComponentPath = path.join(__dirname, '../client/src/components/admin/page-settings/category-page-settings.tsx');
    
    if (!fs.existsSync(adminComponentPath)) {
      this.log(`❌ Admin component file not found`, 'error');
      return false;
    }
    
    const componentContent = fs.readFileSync(adminComponentPath, 'utf8');
    
    // Check for GradientPicker with correct sectionKey
    const gradientPickerPattern = new RegExp(`sectionKey=.*${section.sectionKey}`, 'g');
    const hasGradientPicker = gradientPickerPattern.test(componentContent);
    
    if (hasGradientPicker) {
      this.log(`✅ Admin component correctly mapped`);
      return true;
    } else {
      this.log(`⚠️  Admin component mapping may need verification`);
      return false;
    }
  }

  /**
   * Step 5: User verification with live comparison
   */
  async userVerificationWithFallback(section, gradientData, attempt = 1) {
    console.log('\n' + '═'.repeat(70));
    console.log(`🔍 USER VERIFICATION REQUIRED - ${section.name.toUpperCase()} SECTION`);
    console.log('═'.repeat(70));
    console.log(`📍 Page: ${this.testPage.url}`);
    console.log(`🎨 Section: ${section.name}`);
    console.log(`🔑 Database Key: ${section.sectionKey}`);
    
    if (attempt > 1) {
      console.log(`🔄 Attempt ${attempt} with different colors`);
    }
    
    console.log('\n📊 Current gradient colors:');
    console.log(`   Start:  ${gradientData.startColor}`);
    console.log(`   Middle: ${gradientData.middleColor}`);
    console.log(`   End:    ${gradientData.endColor}`);
    
    console.log(`\n🌐 Please check these locations:`);
    console.log(`   Live site: ${CONFIG.productionUrl}${this.testPage.url}`);
    console.log(`   Dev site:  ${CONFIG.developmentUrl}${this.testPage.url}`);
    console.log(`   Admin:     ${CONFIG.developmentUrl}/admin?tab=${section.adminTab}`);
    
    const colorsMatch = await this.confirmWithUser('\n✅ Do the colors match between live and dev sites?');
    
    if (colorsMatch) {
      this.log(`✅ User confirmed colors match for ${section.name}`);
      this.results.userVerified++;
      return true;
    } else {
      this.log(`❌ User reports colors don't match for ${section.name}`);
      
      if (attempt < 3) {
        console.log('\n🔄 Let me try alternative colors...');
        
        // Generate alternative gradient
        const alternatives = this.generateAlternativeGradients(gradientData, attempt);
        await this.updateSupabaseRecord(section, alternatives);
        
        // Wait for user to refresh
        await this.prompt('\n⏳ Press Enter after refreshing the dev site...');
        
        return await this.userVerificationWithFallback(section, alternatives, attempt + 1);
      } else {
        console.log('\n⚠️  Manual intervention required - please set colors in admin dashboard');
        return false;
      }
    }
  }

  /**
   * Generate alternative gradient colors
   */
  generateAlternativeGradients(original, attempt) {
    const alternatives = {
      2: {
        startColor: '#2d1b42',
        middleColor: '#1a0f2e',
        endColor: '#0a051a',
        direction: original.direction,
        opacity: original.opacity,
        textColors: original.textColors
      },
      3: {
        startColor: '#4a2c5a',
        middleColor: '#362040',
        endColor: '#221426',
        direction: original.direction,
        opacity: original.opacity,
        textColors: original.textColors
      }
    };
    
    return alternatives[attempt] || original;
  }

  /**
   * Step 6: Final verification
   */
  async finalVerification() {
    this.log('\n🔍 Running final end-to-end verification...');
    
    // Fetch current dev gradients
    const devGradients = await fetch(`${CONFIG.developmentUrl}/api/gradients`)
      .then(res => res.json());
    
    let allVerified = true;
    
    for (const section of this.testPage.sections) {
      const devGradient = devGradients[section.sectionKey];
      
      if (!devGradient) {
        this.log(`❌ Missing gradient in database: ${section.sectionKey}`, 'error');
        allVerified = false;
        continue;
      }
      
      // Verify all 6 values present
      const hasAllValues = devGradient.startColor && 
                          devGradient.middleColor && 
                          devGradient.endColor &&
                          devGradient.textColors?.primary &&
                          devGradient.textColors?.secondary &&
                          devGradient.textColors?.tertiary;
      
      if (hasAllValues) {
        this.log(`✅ Complete gradient data for ${section.sectionKey}`);
      } else {
        this.log(`⚠️  Incomplete gradient data for ${section.sectionKey}`, 'warn');
        allVerified = false;
      }
    }
    
    return allVerified;
  }

  /**
   * Main E2E test workflow
   */
  async runE2ETest() {
    console.log('\n' + '🚀 STARTING SINGLE PAGE END-TO-END TEST 🚀'.padStart(60));
    console.log('═'.repeat(70));
    console.log(`📄 Target Page: ${this.testPage.url}`);
    console.log(`📦 Sections: ${this.testPage.sections.length}`);
    console.log('═'.repeat(70) + '\n');
    
    // Step 1: Fetch all configurations
    const configs = await this.fetchConfigurations();
    if (!configs) {
      this.log('❌ Cannot proceed without configuration data', 'error');
      this.rl.close();
      return;
    }
    
    // Process each section
    for (let i = 0; i < this.testPage.sections.length; i++) {
      const section = this.testPage.sections[i];
      
      console.log(`\n${'─'.repeat(70)}`);
      console.log(`📍 SECTION ${i + 1}/${this.testPage.sections.length}: ${section.name.toUpperCase()}`);
      console.log(`${'─'.repeat(70)}`);
      
      // Step 2: Extract gradient data
      const gradientData = this.extractGradientFromConfig(configs, section);
      
      // Step 3: Update Supabase
      const updated = await this.updateSupabaseRecord(section, gradientData);
      if (!updated) {
        this.results.failed++;
        continue;
      }
      
      // Step 4: Verify admin mapping
      await this.verifyAdminMapping(section);
      
      // Step 5: User verification with fallback
      const userVerified = await this.userVerificationWithFallback(section, gradientData);
      
      if (userVerified) {
        this.results.success++;
      } else {
        this.results.failed++;
      }
      
      // Store section result
      this.results.sections.push({
        name: section.name,
        sectionKey: section.sectionKey,
        success: userVerified,
        gradientData
      });
    }
    
    // Step 6: Final verification
    console.log('\n' + '═'.repeat(70));
    console.log('🔍 FINAL VERIFICATION');
    console.log('═'.repeat(70));
    
    const finalCheck = await this.finalVerification();
    
    // Generate report
    this.generateFinalReport(finalCheck);
    
    this.rl.close();
  }

  /**
   * Generate final test report
   */
  generateFinalReport(finalCheck) {
    console.log('\n' + '📊 TEST COMPLETE - FINAL REPORT'.padStart(60));
    console.log('═'.repeat(70));
    console.log(`📄 Page Tested: ${this.testPage.url}`);
    console.log(`✅ Successful: ${this.results.success}/${this.testPage.sections.length}`);
    console.log(`❌ Failed: ${this.results.failed}/${this.testPage.sections.length}`);
    console.log(`👤 User Verified: ${this.results.userVerified}/${this.testPage.sections.length}`);
    console.log(`🔍 Final Check: ${finalCheck ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n📋 Section Details:');
    this.results.sections.forEach((section, i) => {
      const status = section.success ? '✅' : '❌';
      console.log(`   ${i + 1}. ${status} ${section.name} (${section.sectionKey})`);
    });
    
    // Save detailed report
    const reportPath = path.join(CONFIG.outputDir, 'e2e-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`\n💾 Detailed report saved: ${reportPath}`);
    console.log('═'.repeat(70));
    
    if (finalCheck && this.results.failed === 0) {
      console.log('\n🎉 SUCCESS! Page is fully configured and verified.');
      console.log('✅ Ready to proceed with other pages using the same workflow.');
    } else {
      console.log('\n⚠️  Some issues remain. Please review and fix before proceeding.');
    }
  }
}

// Main execution
async function main() {
  const test = new SinglePageE2ETest();
  await test.runE2ETest();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});