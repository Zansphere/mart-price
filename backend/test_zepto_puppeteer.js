const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.zeptonow.com', ['geolocation']);
  
  const page = await browser.newPage();
  const lat = 13.136285, lon = 80.22024;
  await page.setGeolocation({ latitude: lat, longitude: lon });

  let storeId = null;
  page.on('response', async res => {
    if (res.url().includes('/api/v1/config/layout/')) {
      try {
        const j = await res.json();
        if (j.storeIds) storeId = j.storeIds;
      } catch(e) {}
    }
  });

  await page.goto('https://www.zeptonow.com/', { waitUntil: 'networkidle2' });
  
  // Wait a bit to let React app finish
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Zepto Auto Store ID:', storeId);
  const cookies = await page.cookies();
  console.log('Zepto Cookie Store ID:', cookies.find(c => c.name === 'storeId')?.value);

  await browser.close();
}
run();
