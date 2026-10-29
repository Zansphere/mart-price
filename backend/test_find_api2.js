const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function findApi() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('zepto.com') && (url.includes('api/') || url.includes('v1') || url.includes('v2'))) {
      if (url.includes('place') || url.includes('config') || url.includes('layout')) {
        console.log('INTERESTING API Call:', url);
        try {
          const json = await res.json();
          console.log(JSON.stringify(json).substring(0, 200));
        } catch(e) {}
      }
    }
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.zepto.com', ['geolocation']);
  await page.setGeolocation({ latitude: 12.92447, longitude: 80.11945 });

  console.log('Navigating to zepto...');
  await page.goto('https://www.zepto.com/', { waitUntil: 'domcontentloaded' });
  
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

findApi();
