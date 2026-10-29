const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function getStoreId() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  let storeId = null;
  page.on('response', async res => {
    if (res.url().includes('/api/v1/config/layout/')) {
      try {
        const j = await res.json();
        if (j.storeIds || j.storeId) storeId = j.storeIds || j.storeId;
      } catch(e) {}
    }
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.zeptonow.com', ['geolocation']);
  await page.setGeolocation({ latitude: 13.136285, longitude: 80.22024 });

  console.log('Navigating to zepto...');
  await page.goto('https://www.zeptonow.com/', { waitUntil: 'networkidle2' });
  
  // Wait for the location button to appear and click it
  try {
    console.log('Looking for location selector...');
    // The location selector is usually a button that says "Select Location" or the current default location
    await page.waitForSelector('[data-testid="location-selector"]', { timeout: 5000 });
    await page.click('[data-testid="location-selector"]');
    console.log('Clicked location selector');
    
    // In the popup, there should be a "Use current location" or "Locate me" button
    await page.waitForSelector('[data-testid="use-current-location"]', { timeout: 5000 });
    await page.click('[data-testid="use-current-location"]');
    console.log('Clicked Use current location');
    
    // Wait for the store ID to be fetched
    await new Promise(r => setTimeout(r, 5000));
  } catch(e) {
    console.log('Error automating UI:', e.message);
  }

  console.log('Extracted Store ID:', storeId);
  const cookies = await page.cookies();
  console.log('Cookie Store ID:', cookies.find(c => c.name === 'storeId')?.value);
  
  await browser.close();
}

getStoreId();
