const scraper = require('./scraper.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testBBFast() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.setCookie(
    { name: 'bb_lat', value: '13.136285', domain: '.bigbasket.com', path: '/' },
    { name: 'bb_lng', value: '80.22024', domain: '.bigbasket.com', path: '/' },
    { name: '_bb_cid', value: '2', domain: '.bigbasket.com', path: '/' }
  );

  console.log('Going to robots.txt...');
  await page.goto('https://www.bigbasket.com/robots.txt', { waitUntil: 'domcontentloaded' });
  
  console.log('Fetching API...');
  const data = await page.evaluate(async () => {
    try {
      const r = await fetch('https://www.bigbasket.com/listing-svc/v2/products?type=ps&slug=milk&page=1');
      const j = await r.json();
      return j.tabs[0].product_info.products.slice(0, 2).map(p => p.desc);
    } catch(e) {
      return e.message;
    }
  });

  console.log('Result:', data);
  await browser.close();
}
testBBFast();
