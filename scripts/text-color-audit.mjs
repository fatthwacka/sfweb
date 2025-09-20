#!/usr/bin/env node

/**
 * Text Color Mapping Audit Script
 * 
 * Systematically inspects every page, section, and text element to ensure:
 * 1. Proper CSS variable usage from gradient system
 * 2. Correct text hierarchy mapping (primary, secondary, tertiary)
 * 3. No hardcoded colors or global CSS overrides
 * 4. All gradient picker text controls are connected
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Text Color Mapping Audit - Comprehensive Site Analysis\n');

// Text hierarchy standards
const TEXT_HIERARCHY = {
  primary: ['h1', 'h2', 'main titles', 'hero headings'],
  secondary: ['h3', 'h4', 'p', 'subtitles', 'descriptions'], 
  tertiary: ['small text', 'features', 'labels', 'metadata']
};

// Expected CSS variable patterns
const CSS_VARIABLE_PATTERNS = {
  primary: /var\(--([^-]+)-text-primary\)/g,
  secondary: /var\(--([^-]+)-text-secondary\)/g,
  tertiary: /var\(--([^-]+)-text-tertiary\)/g
};

// Problem patterns to identify
const PROBLEM_PATTERNS = {
  hardcodedColors: /#[0-9a-fA-F]{3,6}/g,
  globalCSS: /text-(white|slate|gray|blue|red|green|yellow|purple|pink|indigo)/g,
  hslColors: /hsl\([^)]+\)/g,
  rgbColors: /rgb\([^)]+\)/g
};

// Get all page files
const getPageFiles = () => {
  const pagesDir = '/Volumes/KLEANDOC/Origin Dropbox/SLYFOX/ADMIN/WEBSITE/2025/sfweb/client/src/pages';
  const files = fs.readdirSync(pagesDir)
    .filter(file => file.endsWith('.tsx'))
    .map(file => path.join(pagesDir, file));
  
  return files;
};

// Get all gradient sections from Supabase
const getGradientSections = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/gradients');
    const gradients = await response.json();
    
    return Object.keys(gradients).sort();
  } catch (error) {
    console.warn('⚠️  Could not fetch gradient sections from API');
    return [];
  }
};

// Analyze text patterns in file content
const analyzeTextPatterns = (filePath, content) => {
  const fileName = path.basename(filePath, '.tsx');
  const analysis = {
    file: fileName,
    path: filePath,
    gradientBackgrounds: [],
    textElements: {
      primary: [],
      secondary: [],
      tertiary: [],
      problematic: []
    },
    issues: []
  };

  // Find GradientBackground sections
  const gradientBgRegex = /<GradientBackground\s+section="([^"]+)"/g;
  let match;
  while ((match = gradientBgRegex.exec(content)) !== null) {
    analysis.gradientBackgrounds.push(match[1]);
  }

  // Find text elements and their styling
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for hardcoded colors
    if (PROBLEM_PATTERNS.hardcodedColors.test(line)) {
      const matches = line.match(PROBLEM_PATTERNS.hardcodedColors) || [];
      matches.forEach(color => {
        analysis.issues.push({
          type: 'hardcoded_color',
          line: lineNum,
          content: line.trim(),
          color: color,
          severity: 'high'
        });
      });
    }

    // Check for global CSS classes
    if (PROBLEM_PATTERNS.globalCSS.test(line)) {
      const matches = line.match(PROBLEM_PATTERNS.globalCSS) || [];
      matches.forEach(cssClass => {
        analysis.issues.push({
          type: 'global_css',
          line: lineNum,
          content: line.trim(),
          class: cssClass,
          severity: 'medium'
        });
      });
    }

    // Check for HSL/RGB colors
    if (PROBLEM_PATTERNS.hslColors.test(line) || PROBLEM_PATTERNS.rgbColors.test(line)) {
      analysis.issues.push({
        type: 'inline_color',
        line: lineNum,
        content: line.trim(),
        severity: 'high'
      });
    }

    // Check for proper CSS variable usage
    Object.entries(CSS_VARIABLE_PATTERNS).forEach(([level, pattern]) => {
      if (pattern.test(line)) {
        const matches = line.match(pattern) || [];
        matches.forEach(variable => {
          analysis.textElements[level].push({
            line: lineNum,
            content: line.trim(),
            variable: variable
          });
        });
      }
    });

    // Check for text elements that should use CSS variables
    if (/<h[1-2][^>]*>/i.test(line) && !CSS_VARIABLE_PATTERNS.primary.test(line)) {
      analysis.textElements.problematic.push({
        type: 'missing_primary',
        line: lineNum,
        content: line.trim(),
        suggestion: 'Should use primary text color variable'
      });
    }

    if (/<h[3-4][^>]*>|<p[^>]*>/i.test(line) && !CSS_VARIABLE_PATTERNS.secondary.test(line)) {
      analysis.textElements.problematic.push({
        type: 'missing_secondary', 
        line: lineNum,
        content: line.trim(),
        suggestion: 'Should use secondary text color variable'
      });
    }
  });

  return analysis;
};

// Generate recommendations
const generateRecommendations = (analysis, gradientSections) => {
  const recommendations = [];

  // Check if page has gradient sections but no CSS variables
  if (analysis.gradientBackgrounds.length > 0 && 
      Object.values(analysis.textElements).every(arr => arr.length === 0)) {
    recommendations.push({
      priority: 'high',
      type: 'missing_text_variables',
      message: `Page has ${analysis.gradientBackgrounds.length} gradient sections but no text color variables`,
      action: 'Add CSS variable classes to text elements'
    });
  }

  // Check for mismatched section names
  analysis.gradientBackgrounds.forEach(section => {
    if (!gradientSections.includes(section)) {
      recommendations.push({
        priority: 'medium',
        type: 'unknown_section',
        message: `Section "${section}" not found in gradient system`,
        action: 'Verify section key or add to gradient system'
      });
    }
  });

  // High severity issues
  const highIssues = analysis.issues.filter(issue => issue.severity === 'high');
  if (highIssues.length > 0) {
    recommendations.push({
      priority: 'high',
      type: 'hardcoded_colors',
      message: `${highIssues.length} hardcoded colors found`,
      action: 'Replace with CSS variables from gradient system'
    });
  }

  return recommendations;
};

// Main audit function
const auditTextColors = async () => {
  console.log('📋 Getting gradient sections from Supabase...');
  const gradientSections = await getGradientSections();
  console.log(`✅ Found ${gradientSections.length} gradient sections\n`);

  console.log('📁 Analyzing page files...');
  const pageFiles = getPageFiles();
  console.log(`✅ Found ${pageFiles.length} page files\n`);

  const results = [];
  const summary = {
    totalFiles: pageFiles.length,
    filesWithIssues: 0,
    totalIssues: 0,
    issuesByType: {},
    sectionsAudited: 0
  };

  for (const filePath of pageFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const analysis = analyzeTextPatterns(filePath, content);
      const recommendations = generateRecommendations(analysis, gradientSections);
      
      analysis.recommendations = recommendations;
      results.push(analysis);

      summary.sectionsAudited += analysis.gradientBackgrounds.length;
      
      if (analysis.issues.length > 0 || recommendations.length > 0) {
        summary.filesWithIssues++;
        summary.totalIssues += analysis.issues.length;
        
        analysis.issues.forEach(issue => {
          summary.issuesByType[issue.type] = (summary.issuesByType[issue.type] || 0) + 1;
        });
      }

      console.log(`📄 ${analysis.file}: ${analysis.gradientBackgrounds.length} sections, ${analysis.issues.length} issues`);
      
    } catch (error) {
      console.error(`❌ Error analyzing ${filePath}:`, error.message);
    }
  }

  return { results, summary };
};

// Generate detailed report
const generateReport = ({ results, summary }) => {
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEXT COLOR MAPPING AUDIT REPORT');
  console.log('='.repeat(80));

  console.log('\n📈 Summary Statistics:');
  console.log(`   • Files analyzed: ${summary.totalFiles}`);
  console.log(`   • Files with issues: ${summary.filesWithIssues}`);
  console.log(`   • Total issues found: ${summary.totalIssues}`);
  console.log(`   • Gradient sections audited: ${summary.sectionsAudited}`);

  if (Object.keys(summary.issuesByType).length > 0) {
    console.log('\n🚨 Issues by Type:');
    Object.entries(summary.issuesByType).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} occurrences`);
    });
  }

  console.log('\n📋 Detailed File Analysis:');
  console.log('-'.repeat(80));

  results.forEach(analysis => {
    if (analysis.issues.length > 0 || analysis.recommendations.length > 0) {
      console.log(`\n📄 ${analysis.file.toUpperCase()}`);
      console.log(`   Path: ${analysis.path}`);
      console.log(`   Gradient sections: ${analysis.gradientBackgrounds.join(', ') || 'None'}`);
      
      if (analysis.issues.length > 0) {
        console.log(`   Issues (${analysis.issues.length}):`);
        analysis.issues.slice(0, 5).forEach(issue => { // Show first 5 issues
          console.log(`     • Line ${issue.line}: ${issue.type} - ${issue.content.substring(0, 60)}...`);
        });
        if (analysis.issues.length > 5) {
          console.log(`     ... and ${analysis.issues.length - 5} more issues`);
        }
      }

      if (analysis.recommendations.length > 0) {
        console.log(`   Recommendations:`);
        analysis.recommendations.forEach(rec => {
          console.log(`     🔧 [${rec.priority.toUpperCase()}] ${rec.message}`);
          console.log(`        Action: ${rec.action}`);
        });
      }
    }
  });

  console.log('\n🎯 Priority Actions:');
  console.log('-'.repeat(40));
  
  const priorityActions = [];
  results.forEach(analysis => {
    analysis.recommendations?.forEach(rec => {
      if (rec.priority === 'high') {
        priorityActions.push(`${analysis.file}: ${rec.message}`);
      }
    });
  });

  if (priorityActions.length > 0) {
    priorityActions.slice(0, 10).forEach((action, index) => {
      console.log(`${index + 1}. ${action}`);
    });
  } else {
    console.log('✅ No high-priority actions required!');
  }

  console.log('\n💡 Next Steps:');
  console.log('1. Fix high-priority hardcoded colors first');
  console.log('2. Add CSS variable classes to text elements');
  console.log('3. Verify all gradient sections have proper text mapping');
  console.log('4. Test admin dashboard text color controls');
  console.log('5. Update pricing card sections with proper variables');

  return results;
};

// Run the audit
try {
  const auditResults = await auditTextColors();
  const detailedResults = generateReport(auditResults);
  
  console.log('\n🎉 Text color audit completed!');
  console.log('📄 Results can be used to systematically fix text color mappings');
  
} catch (error) {
  console.error('❌ Audit failed:', error);
  process.exit(1);
}