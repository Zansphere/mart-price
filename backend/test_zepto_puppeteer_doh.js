const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: [
      '--no-sandbox',
      '--enable-features=AsyncDns',
      // Force DoH using Cloudflare
      '--force-fieldtrials=DnsOverHttps/Enabled',
      '--force-fieldtrial-params=DnsOverHttps.Enabled:server/https%3A%2F%2Fcloudflare-dns.com%2Fdns-query/method/POST'
    ] 
  });
  const page = await browser.newPage();
  
  await page.goto('https://www.zeptonow.com/robots.txt', { waitUntil: 'domcontentloaded' });

  const lat = '13.136285', lon = '80.22024';

  const storeId = await page.evaluate(async (lat, lon) => {
    try {
      const res = await fetch('https://api.zeptonow.com/api/v1/config/layout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': 'ZEPTO',
          'app-version': '12.2.14'
        },
        body: JSON.stringify({
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          pageType: 'HOME',
          tenantId: 'ZEPTO'
        })
      });
      const data = await res.json();
      return data.storeIds || data.storeId || null;
    } catch(e) {
      return e.message;
    }
  }, lat, lon);

  console.log('Zepto Store ID via Puppeteer DoH:', storeId);
  await browser.close();
}
run();
