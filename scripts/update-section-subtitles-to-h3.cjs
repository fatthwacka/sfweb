#!/usr/bin/env node

/**
 * SECTION SUBTITLE HTML UPDATER
 * 
 * Converts section subtitles from <p> to <h3> for semantic hierarchy:
 * - Finds patterns like: <p className="text-xl...>{description}</p>
 * - Converts to: <h3 className="text-xl">{description}</h3>
 * - Removes .text-muted-foreground class since h3 will get section colors
 */

const fs = require('fs');
const path = require('path');

// File patterns to search
const FILE_PATTERNS = [
  'client/src/pages/**/*.tsx',
  'client/src/components/**/*.tsx'
];

/**
 * Update section subtitle patterns in file content
 */
function updateSectionSubtitles(content, filename) {
  let updated = content;
  let changeCount = 0;
  
  // Pattern 1: <p className="text-xl text-muted-foreground ...>{description}</p>
  const pattern1 = /<p className="text-xl[^"]*text-muted-foreground[^"]*"[^>]*>\s*\{[^}]*description[^}]*\}\s*<\/p>/g;
  updated = updated.replace(pattern1, (match) => {
    changeCount++;
    console.log(`  📝 Found pattern 1 in ${filename}`);
    // Remove text-muted-foreground class and change p to h3
    return match
      .replace(/<p /, '<h3 ')
      .replace(/<\/p>/, '</h3>')
      .replace(/text-muted-foreground\s*/, '')
      .replace(/\s+className="/g, ' className="') // clean up spacing
      .replace(/className="\s+/g, 'className="'); // clean up className spacing
  });
  
  // Pattern 2: General subtitle patterns in section headers
  const pattern2 = /<p className="[^"]*text-xl[^"]*"[^>]*>\s*\{[^}]*subtitle[^}]*\}\s*<\/p>/g;
  updated = updated.replace(pattern2, (match) => {
    changeCount++;
    console.log(`  📝 Found pattern 2 in ${filename}`);
    return match
      .replace(/<p /, '<h3 ')
      .replace(/<\/p>/, '</h3>')
      .replace(/text-muted-foreground\s*/, '');
  });
  
  // Pattern 3: Description patterns in other components
  const pattern3 = /<p className="[^"]*text-xl[^"]*"[^>]*>\s*\{.*?description.*?\}\s*<\/p>/g;
  updated = updated.replace(pattern3, (match) => {
    // Only convert if it looks like a section subtitle (has text-xl)
    if (match.includes('text-xl')) {
      changeCount++;
      console.log(`  📝 Found pattern 3 in ${filename}`);
      return match
        .replace(/<p /, '<h3 ')
        .replace(/<\/p>/, '</h3>')
        .replace(/text-muted-foreground\s*/, '');
    }
    return match;
  });
  
  return { content: updated, changeCount };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: updatedContent, changeCount } = updateSectionSubtitles(content, path.basename(filePath));
    
    if (changeCount > 0) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated ${filePath} (${changeCount} changes)`);
      return changeCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Get all TSX files recursively
 */
function getAllTsxFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getAllTsxFiles(fullPath));
    } else if (item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Main execution
 */
function main() {
  console.log('🏷️  CONVERTING SECTION SUBTITLES TO H3 TAGS');
  console.log('📋 Searching for section subtitle patterns...');
  
  let totalFiles = 0;
  let updatedFiles = 0;
  let totalChanges = 0;
  
  // Get all TSX files from key directories
  const directories = [
    path.join(__dirname, '../client/src/pages'),
    path.join(__dirname, '../client/src/components')
  ];
  
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      const files = getAllTsxFiles(dir);
      
      for (const file of files) {
        totalFiles++;
        
        const changeCount = processFile(file);
        if (changeCount > 0) {
          updatedFiles++;
          totalChanges += changeCount;
        }
      }
    }
  }
  
  console.log('');
  console.log(`✅ SUMMARY:`);
  console.log(`   📁 Files scanned: ${totalFiles}`);
  console.log(`   📝 Files updated: ${updatedFiles}`);
  console.log(`   🔄 Total changes: ${totalChanges}`);
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('   1. Test the updated pages to ensure styling looks correct');
  console.log('   2. Verify gradient picker color mapping works as expected');
  console.log('   3. Check that h3 sections get secondary colors properly');
}

if (require.main === module) {
  main();
}