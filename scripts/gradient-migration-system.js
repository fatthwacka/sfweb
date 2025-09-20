#!/usr/bin/env node

/**
 * Gradient Migration System
 * Systematically verifies and migrates all gradient configurations
 * from production to development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  productionUrl: 'https://slyfox.co.za',
  developmentUrl: 'http://localhost:3000',
  configFile: path.join(__dirname, '../server/data/site-config-overrides.json'),
  outputDir: path.join(__dirname, 'migration-reports'),
  logFile: path.join(__dirname, 'migration-reports/migration.log')
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Page and section mapping
const SITE_STRUCTURE = {
  photography: {
    categories: ['weddings', 'portraits', 'corporate', 'events', 'products', 'graduation'],
    sections: ['hero', 'services', 'packages', 'recent-work', 'seo']
  },
  videography: {
    categories: ['weddings', 'corporate', 'events'],
    sections: ['hero', 'services', 'packages', 'recent-work', 'seo']
  },
  staticPages: {
    home: ['hero', 'services', 'portfolio', 'testimonials', 'cta'],
    about: ['hero', 'story', 'team', 'values', 'location', 'cta'],
    pricing: ['hero', 'photography', 'videography', 'additional', 'cta'],
    contact: ['hero', 'form', 'info', 'map', 'cta'],
    portfolio: ['hero', 'gallery', 'categories', 'cta'],
    'web-apps': ['hero', 'services', 'portfolio', 'process', 'cta'],
    'social-media': ['hero', 'services', 'packages', 'portfolio', 'cta']
  }
};

class GradientMigrationSystem {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      totalSections: 0,
      verified: [],
      mismatches: [],
      missing: [],
      errors: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
  }

  async fetchJson(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      this.log(`Failed to fetch ${url}: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Step 1: Generate complete section inventory
   */
  generateSectionInventory() {
    const inventory = [];
    
    // Photography categories
    SITE_STRUCTURE.photography.categories.forEach(category => {
      SITE_STRUCTURE.photography.sections.forEach(section => {
        const sectionKey = `photography-${category.replace(/s$/, '')}-${section}`;
        inventory.push({
          page: `/photography/${category}`,
          section,
          sectionKey,
          type: 'photography',
          category
        });
      });
    });

    // Videography categories
    SITE_STRUCTURE.videography.categories.forEach(category => {
      SITE_STRUCTURE.videography.sections.forEach(section => {
        const sectionKey = `videography-${category.replace(/s$/, '')}-${section}`;
        inventory.push({
          page: `/videography/${category}`,
          section,
          sectionKey,
          type: 'videography',
          category
        });
      });
    });

    // Static pages
    Object.entries(SITE_STRUCTURE.staticPages).forEach(([page, sections]) => {
      sections.forEach(section => {
        const sectionKey = page === 'home' ? section : `${page}-${section}`;
        inventory.push({
          page: page === 'home' ? '/' : `/${page}`,
          section,
          sectionKey,
          type: 'static',
          category: null
        });
      });
    });

    this.report.totalSections = inventory.length;
    return inventory;
  }

  /**
   * Step 2: Fetch all gradient data
   */
  async fetchAllGradients() {
    this.log('Fetching production configuration...');
    const prodConfig = await this.fetchJson(`${CONFIG.productionUrl}/api/site-config`);
    
    this.log('Fetching development gradients...');
    const devGradients = await this.fetchJson(`${CONFIG.developmentUrl}/api/gradients`);
    
    this.log('Reading local config file...');
    const localConfig = JSON.parse(fs.readFileSync(CONFIG.configFile, 'utf8'));
    
    return {
      production: prodConfig,
      development: devGradients,
      local: localConfig
    };
  }

  /**
   * Step 3: Extract gradient from config
   */
  extractGradient(config, pageInfo) {
    try {
      if (pageInfo.type === 'photography' || pageInfo.type === 'videography') {
        const categoryData = config?.categoryPages?.[pageInfo.type]?.[pageInfo.category];
        
        // Map section names to config keys
        const sectionMap = {
          'hero': 'hero',
          'services': 'serviceOverview',
          'packages': 'packages',
          'recent-work': 'recentWork',
          'seo': 'seoContent'
        };
        
        const configSection = sectionMap[pageInfo.section];
        return categoryData?.[configSection]?.gradients || null;
      } else {
        // Static pages - check gradients config
        return config?.gradients?.[pageInfo.sectionKey] || null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Step 4: Compare gradients
   */
  compareGradients(prod, dev) {
    if (!prod || !dev) return false;
    
    // Normalize colors for comparison
    const normalize = (color) => {
      if (!color) return '';
      return color.toLowerCase().replace(/\s/g, '');
    };
    
    return normalize(prod.startColor) === normalize(dev.startColor) &&
           normalize(prod.middleColor) === normalize(dev.middleColor) &&
           normalize(prod.endColor) === normalize(dev.endColor);
  }

  /**
   * Step 5: Generate migration commands
   */
  generateMigrationCommand(sectionKey, gradient) {
    if (!gradient) return null;
    
    const data = {
      gradientConfig: {
        startColor: gradient.startColor,
        middleColor: gradient.middleColor,
        endColor: gradient.endColor,
        direction: gradient.direction || '135deg',
        opacity: gradient.opacity || 0.9,
        textColors: gradient.textColors || {
          primary: '#ffffff',
          secondary: '#e2e8f0',
          tertiary: '#94a3b8'
        }
      }
    };
    
    return `curl -X PUT ${CONFIG.developmentUrl}/api/gradients/${sectionKey} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(data, null, 2)}'`;
  }

  /**
   * Main verification process
   */
  async verify() {
    this.log('Starting gradient migration system...');
    
    // Step 1: Generate inventory
    const inventory = this.generateSectionInventory();
    this.log(`Generated inventory: ${inventory.length} sections`);
    
    // Step 2: Fetch all data
    const data = await this.fetchAllGradients();
    if (!data.production || !data.development) {
      this.log('Failed to fetch required data', 'error');
      return;
    }
    
    // Step 3: Verify each section
    const migrationCommands = [];
    
    for (const item of inventory) {
      const prodGradient = this.extractGradient(data.production, item);
      const localGradient = this.extractGradient(data.local, item);
      const devGradient = data.development[item.sectionKey];
      
      // Use local config if available, otherwise fall back to production
      const sourceGradient = localGradient || prodGradient;
      
      if (!sourceGradient) {
        this.report.missing.push({
          ...item,
          reason: 'No gradient data in production/local config'
        });
      } else if (!devGradient) {
        this.report.missing.push({
          ...item,
          reason: 'No gradient in dev database',
          migration: this.generateMigrationCommand(item.sectionKey, sourceGradient)
        });
        migrationCommands.push({
          sectionKey: item.sectionKey,
          command: this.generateMigrationCommand(item.sectionKey, sourceGradient)
        });
      } else if (!this.compareGradients(sourceGradient, devGradient)) {
        this.report.mismatches.push({
          ...item,
          production: sourceGradient,
          development: devGradient,
          migration: this.generateMigrationCommand(item.sectionKey, sourceGradient)
        });
        migrationCommands.push({
          sectionKey: item.sectionKey,
          command: this.generateMigrationCommand(item.sectionKey, sourceGradient)
        });
      } else {
        this.report.verified.push(item);
      }
    }
    
    // Step 4: Generate reports
    this.generateReports(migrationCommands);
  }

  /**
   * Generate comprehensive reports
   */
  generateReports(migrationCommands) {
    // Summary report
    const summary = {
      ...this.report,
      stats: {
        total: this.report.totalSections,
        verified: this.report.verified.length,
        mismatches: this.report.mismatches.length,
        missing: this.report.missing.length,
        needsMigration: this.report.mismatches.length + this.report.missing.length
      }
    };
    
    fs.writeFileSync(
      path.join(CONFIG.outputDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    // Migration script
    if (migrationCommands.length > 0) {
      const script = `#!/bin/bash
# Gradient Migration Script
# Generated: ${new Date().toISOString()}
# Total migrations: ${migrationCommands.length}

set -e

echo "Starting gradient migration..."

${migrationCommands.map(cmd => cmd.command).join('\n\n')}

echo "Migration complete!"
`;
      
      fs.writeFileSync(
        path.join(CONFIG.outputDir, 'migrate.sh'),
        script
      );
      
      fs.chmodSync(path.join(CONFIG.outputDir, 'migrate.sh'), '755');
    }
    
    // Detailed CSV report
    const csv = [
      'Page,Section,Section Key,Status,Issue',
      ...this.report.verified.map(item => 
        `${item.page},${item.section},${item.sectionKey},✓ Verified,`
      ),
      ...this.report.mismatches.map(item =>
        `${item.page},${item.section},${item.sectionKey},⚠️ Mismatch,Colors don't match`
      ),
      ...this.report.missing.map(item =>
        `${item.page},${item.section},${item.sectionKey},❌ Missing,${item.reason}`
      )
    ].join('\n');
    
    fs.writeFileSync(
      path.join(CONFIG.outputDir, 'verification-report.csv'),
      csv
    );
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('GRADIENT VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Sections: ${summary.stats.total}`);
    console.log(`✓ Verified: ${summary.stats.verified}`);
    console.log(`⚠️  Mismatches: ${summary.stats.mismatches}`);
    console.log(`❌ Missing: ${summary.stats.missing}`);
    console.log(`📦 Needs Migration: ${summary.stats.needsMigration}`);
    console.log('='.repeat(60));
    console.log('\nReports generated in:', CONFIG.outputDir);
    
    if (migrationCommands.length > 0) {
      console.log('\n🚀 To migrate all gradients, run:');
      console.log(`   bash ${path.join(CONFIG.outputDir, 'migrate.sh')}`);
    }
  }

  /**
   * Run verification only (no migration)
   */
  async checkOnly() {
    await this.verify();
  }

  /**
   * Run migration
   */
  async migrate() {
    const scriptPath = path.join(CONFIG.outputDir, 'migrate.sh');
    if (!fs.existsSync(scriptPath)) {
      this.log('No migration script found. Run verify first.', 'error');
      return;
    }
    
    this.log('Executing migration script...');
    try {
      execSync(`bash ${scriptPath}`, { stdio: 'inherit' });
      this.log('Migration completed successfully!');
    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error');
    }
  }
}

// CLI Interface
async function main() {
  const system = new GradientMigrationSystem();
  const command = process.argv[2];
  
  switch (command) {
    case 'verify':
      await system.checkOnly();
      break;
    case 'migrate':
      await system.migrate();
      break;
    case 'full':
      await system.verify();
      console.log('\nWould you like to run the migration? (y/n)');
      // For automation, we'll just generate the script
      break;
    default:
      console.log('Usage: node gradient-migration-system.js [verify|migrate|full]');
      console.log('  verify  - Check all gradients and generate report');
      console.log('  migrate - Run migration script if available');
      console.log('  full    - Verify and prompt for migration');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { GradientMigrationSystem };