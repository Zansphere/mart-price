const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function searchAmazon() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Amazon Fresh search usually uses the `i=nowstore` parameter
  const query = 'milk';
  const url = `https://www.amazon.in/s?k=${query}&i=nowstore`;
  
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  const html = await page.evaluate(() => document.body.outerHTML);
  const fs = require('fs');
  fs.writeFileSync('amazon_fresh.html', html);
  console.log('Saved amazon_fresh.html');
  
  await browser.close();
}

searchAmazon();
