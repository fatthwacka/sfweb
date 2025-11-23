const { chromium } = require('playwright');

async function takeScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    // Take screenshot of pocas portfolio page
    console.log('Navigating to pocas portfolio page...');
    const page1 = await context.newPage();
    await page1.goto('http://localhost:3000/portfolio/pocas');
    await page1.waitForLoadState('networkidle');
    await page1.screenshot({ path: '/tmp/pocas-final.png', fullPage: true });
    console.log('✓ Screenshot saved: /tmp/pocas-final.png');
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