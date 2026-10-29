const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function dumpZeptoHTML() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://www.zepto.com/', { waitUntil: 'networkidle2' });
  
  const html = await page.evaluate(() => document.body.outerHTML);
  const fs = require('fs');
  fs.writeFileSync('zepto_body.html', html);
  
  console.log('Saved zepto_body.html');
  await browser.close();
}

dumpZeptoHTML();
