const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function fetchStoreIdInBrowser(lat, lon) {
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: [
      '--no-sandbox',
      '--enable-features=dns-over-https',
      '--dns-over-https-templates=https://chrome.cloudflare-dns.com/dns-query'
    ] 
  });
  const page = await browser.newPage();
  
  console.log("Navigating to zepto...");
  await page.goto('https://www.zepto.com/', { waitUntil: 'domcontentloaded' });
  
  console.log("Injecting fetch request inside browser context...");
  const storeId = await page.evaluate(async (latitude, longitude) => {
    try {
      const res = await fetch('https://api.zeptonow.com/api/v1/config/layout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': 'ZEPTO',
          'app-version': '12.2.14'
        },
        body: JSON.stringify({
          lat: latitude,
          lon: longitude,
          pageType: 'HOME',
          tenantId: 'ZEPTO'
        })
      });
      const data = await res.json();
      return data.storeIds || data.storeId;
    } catch (e) {
      return "ERROR: " + e.message;
    }
  }, lat, lon);
  
  console.log("Extracted Store ID via Browser:", storeId);
  await browser.close();
}

// Test with Tambaram coordinates
fetchStoreIdInBrowser(12.92447, 80.11945);
