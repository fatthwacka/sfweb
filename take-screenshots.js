import { chromium } from 'playwright';

async function takeScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    // Test portfolio page performance
    console.log('Testing portfolio page performance...');
    const page1 = await context.newPage();
    
    const startTime = Date.now();
    console.log('⏱️ Starting navigation...');
    
    await page1.goto('http://localhost:3000/portfolio');
    console.log(`⏱️ Page response received: ${Date.now() - startTime}ms`);
    
    // Wait for React app to render
    await page1.waitForSelector('#root', { timeout: 10000 });
    console.log(`⏱️ React root rendered: ${Date.now() - startTime}ms`);
    
    // Wait for portfolio page specifically
    await page1.waitForSelector('h1', { timeout: 10000 });
    console.log(`⏱️ Page heading rendered: ${Date.now() - startTime}ms`);
    
    // Wait for network to settle (all images loaded)
    await page1.waitForLoadState('networkidle', { timeout: 20000 });
    console.log(`⏱️ Network settled (all content loaded): ${Date.now() - startTime}ms`);
    
    await page1.screenshot({ path: '/tmp/portfolio-final.png', fullPage: true });
    console.log('✓ Portfolio screenshot saved: /tmp/portfolio-final.png');
    await page1.close();

    // Take screenshot of party-kit project page
    console.log('Navigating to party-kit project page...');
    const page2 = await context.newPage();
    await page2.goto('http://localhost:3000/project/party-kit');
    await page2.waitForLoadState('networkidle');
    await page2.screenshot({ path: '/tmp/party-kit-final.png', fullPage: true });
    console.log('✓ Screenshot saved: /tmp/party-kit-final.png');
    await page2.close();

  } catch (error) {
    console.error('Error taking screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

takeScreenshots().then(() => {
  console.log('All screenshots completed successfully!');
}).catch((error) => {
  console.error('Screenshot process failed:', error);
  process.exit(1);
});