const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testAmazon() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const query = 'milk';
  const url = `https://www.amazon.in/s?k=${query}&i=nowstore`;
  
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const products = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('[data-component-type="s-search-result"]');
    for (const item of items) {
      const nameEl = item.querySelector('h2 a span');
      const name = nameEl ? nameEl.textContent.trim() : null;
      
      const priceWholeEl = item.querySelector('.a-price-whole');
      const priceWhole = priceWholeEl ? priceWholeEl.textContent.trim().replace(/,/g, '') : null;
      const price = priceWhole ? parseFloat(priceWhole) : null;
      
      const imgEl = item.querySelector('.s-image');
      const imgUrl = imgEl ? imgEl.getAttribute('src') : '';
      
      const id = item.getAttribute('data-asin');
      
      let weight = '';
      if (name) {
        const match = name.match(/(\d+\s*(?:kg|g|ml|l|L|pack|pcs))/i);
        if (match) weight = match[1];
      }
      
      if (name && price) {
        results.push({ id, name, price, weight: weight || 'N/A', image_url: imgUrl, in_stock: true });
      }
    }
    return results;
  });
  
  console.log('Found', products.length, 'products');
  console.log(products.slice(0, 3));
  
  await browser.close();
}

testAmazon();
