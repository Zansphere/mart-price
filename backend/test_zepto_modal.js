const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function dumpModal() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://www.zepto.com/', { waitUntil: 'domcontentloaded' });
  
  console.log('Clicking user-address...');
  await page.waitForSelector('[data-testid="user-address"]');
  await page.click('[data-testid="user-address"]');
  
  console.log('Waiting for input...');
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 }).catch(e => console.log('No placeholder search'));
  await page.waitForSelector('input', { timeout: 10000 });
  
  console.log('Typing address...');
  const inputs = await page.$$('input');
  await inputs[0].type('Tambaram');
  
  await new Promise(r => setTimeout(r, 3000));
  
  const html = await page.evaluate(() => document.body.outerHTML);
  const fs = require('fs');
  fs.writeFileSync('zepto_modal.html', html);
  console.log('Saved zepto_modal.html');
  
  await browser.close();
}

dumpModal();
