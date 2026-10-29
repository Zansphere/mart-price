const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function checkURLs() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  console.log("Checking Amazon Tez...");
  await page.goto('https://www.amazon.in/tez/browse/explore/category?qcbrand=qqfsWw9RkO&nodeId=215540425031', { waitUntil: 'domcontentloaded' });
  let html = await page.evaluate(() => document.body.innerText);
  console.log("Amazon length:", html.length);
  console.log("Amazon content snippet:", html.substring(0, 200).replace(/\n/g, ' '));
  
  console.log("Checking Flipkart Hyperlocal...");
  await page.goto('https://www.flipkart.com/hyperlocal-grocery-new-ab-at-store?marketplace=HYPERLOCAL&pageUID=1790250175279', { waitUntil: 'domcontentloaded' });
  html = await page.evaluate(() => document.body.innerText);
  console.log("Flipkart length:", html.length);
  console.log("Flipkart content snippet:", html.substring(0, 200).replace(/\n/g, ' '));
  
  await browser.close();
}

checkURLs();
