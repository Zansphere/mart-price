const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testFlipkart() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const query = 'milk';
  const url = `https://www.flipkart.com/search?q=${query}`;
  
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.evaluate(() => document.body.outerHTML);
  const fs = require('fs');
  fs.writeFileSync('flipkart_search.html', html);
  console.log('Saved flipkart_search.html');
  
  await browser.close();
}

testFlipkart();
