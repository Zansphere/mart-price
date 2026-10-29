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
  
  const products = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('[data-id]');
    for (const item of items) {
      const aTag = item.querySelector('a[target="_blank"]');
      if (!aTag) continue;
      
      const titleEl = item.querySelector('.s1Q9rs, .IRpwTa, ._4rR01T, [title], a[title]');
      let title = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent.trim()) : '';
      if (!title && aTag.getAttribute('title')) title = aTag.getAttribute('title');
      if (!title) title = aTag.textContent.trim();
      
      const priceEl = item.querySelector('._30jeq3, .Nx9bqj');
      const priceText = priceEl ? priceEl.textContent.replace(/[^\d.]/g, '') : null;
      const price = priceText ? parseFloat(priceText) : null;
      
      const imgEl = item.querySelector('img');
      const imgUrl = imgEl ? imgEl.getAttribute('src') : '';
      
      const id = item.getAttribute('data-id');
      
      if (title && price) {
        results.push({ id, title, price, imgUrl });
      }
    }
    return results;
  });
  
  console.log('Found', products.length, 'products');
  console.log(products.slice(0, 3));
  
  await browser.close();
}

testFlipkart();
