const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testStorageInjection() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://www.zeptonow.com/', { waitUntil: 'domcontentloaded' });
  
  const lat = 13.136285, lon = 80.22024;
  await page.evaluate((lat, lon) => {
    localStorage.setItem('userLocation', JSON.stringify({ lat, lon }));
    localStorage.setItem('selectedAddress', JSON.stringify({
      latitude: lat,
      longitude: lon,
      formatted_address: 'Chennai'
    }));
  }, lat, lon);

  console.log('Navigating to search page...');
  
  let fetchedStoreId = null;
  page.on('response', async res => {
    if (res.url().includes('/api/v1/config/layout/')) {
      try {
        const j = await res.json();
        if (j.storeIds) fetchedStoreId = j.storeIds;
      } catch(e) {}
    }
  });

  await page.goto('https://www.zeptonow.com/search?query=milk', { waitUntil: 'networkidle2' });
  
  console.log('Store ID from intercept:', fetchedStoreId);
  const cookies = await page.cookies();
  console.log('Store ID from cookies:', cookies.find(c => c.name === 'storeId')?.value);
  
  const pageStoreId = await page.evaluate(() => localStorage.getItem('storeId'));
  console.log('Store ID from localStorage:', pageStoreId);
  
  await browser.close();
}

testStorageInjection();
