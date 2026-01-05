#!/usr/bin/env node
/**
 * Verification script for static blog generation
 * Run this to check if static files are being generated correctly
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyStaticGeneration() {
  console.log('🔍 Verifying Static Blog Generation...\n');

  // Check if stories directory exists
  const storiesDir = path.join(__dirname, 'public', 'stories');
  
  try {
    await fs.access(storiesDir);
    console.log('✅ Stories directory exists:', storiesDir);
    
    // List static files
    const files = await fs.readdir(storiesDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    if (htmlFiles.length > 0) {
      console.log(`✅ Found ${htmlFiles.length} static blog files:`);
      htmlFiles.forEach(file => {
        console.log(`   📄 ${file}`);
      });
      
      // Check one file's content
      const firstFile = path.join(storiesDir, htmlFiles[0]);
      const content = await fs.readFile(firstFile, 'utf8');
      
      console.log('\n🔍 Content verification for', htmlFiles[0], ':');
      console.log('   Meta tags:', content.includes('<meta name="description"') ? '✅' : '❌');
      console.log('   Open Graph:', content.includes('<meta property="og:') ? '✅' : '❌');
      console.log('   Structured Data:', content.includes('application/ld+json') ? '✅' : '❌');
      console.log('   Article Content:', content.includes('itemprop="articleBody"') ? '✅' : '❌');
      
    } else {
      console.log('❌ No static HTML files found in stories directory');
      console.log('   Try publishing a blog post to generate static files');
    }
  } catch (error) {
    console.log('❌ Stories directory does not exist yet:', storiesDir);
    console.log('   This is normal if no posts have been published yet');
  }

  // Check sitemap
  const sitemapPath = path.join(__dirname, 'public', 'sitemap.xml');
  try {
    const sitemap = await fs.readFile(sitemapPath, 'utf8');
    const blogUrls = (sitemap.match(/\/stories\//g) || []).length;
    console.log(`\n📋 Sitemap check:`);
    console.log(`   ✅ Sitemap exists: ${sitemapPath}`);
    console.log(`   📄 Blog URLs in sitemap: ${blogUrls}`);
  } catch (error) {
    console.log('\n❌ Sitemap not found or error reading it');
  }

  // Instructions
  console.log('\n📚 Next Steps:');
  console.log('1. Go to /admin -> Blog Management');
  console.log('2. Open an existing post, make a small edit, save it');
  console.log('3. Ensure status is "Published" and click "Publish"');
  console.log('4. Look for console logs showing static file generation');
  console.log('5. Run this script again to verify files were created');
  console.log('6. Visit /stories/your-post-slug to see the static file served');
  console.log('\n💡 Use the "📄 Generate Static Files" button in admin to bulk-generate all published posts');
}

verifyStaticGeneration().catch(console.error);