const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function findZeptoApi() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('zepto.com') && (res.request().resourceType() === 'fetch' || res.request().resourceType() === 'xhr')) {
      console.log('API Call:', url);
    }
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.zepto.com', ['geolocation']);
  await page.setGeolocation({ latitude: 13.136285, longitude: 80.22024 });

  console.log('Navigating to zepto...');
  await page.goto('https://www.zepto.com/', { waitUntil: 'networkidle2' });
  
  await browser.close();
}

findZeptoApi();
