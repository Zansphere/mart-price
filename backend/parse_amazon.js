const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('amazon_fresh.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const products = [];
const items = document.querySelectorAll('[data-component-type="s-search-result"]');
for (const item of items) {
  const nameEl = item.querySelector('h2 a span');
  const name = nameEl ? nameEl.textContent.trim() : null;
  
  const priceWholeEl = item.querySelector('.a-price-whole');
  const priceWhole = priceWholeEl ? priceWholeEl.textContent.trim().replace(/,/g, '') : null;
  const price = priceWhole ? parseFloat(priceWhole) : null;
  
  const imgEl = item.querySelector('.s-image');
  const imgUrl = imgEl ? imgEl.getAttribute('src') : null;
  
  const idEl = item.getAttribute('data-asin');
  
  // Weight is usually in the name for Amazon Fresh
  let weight = '';
  if (name) {
    const match = name.match(/(\d+\s*(?:kg|g|ml|l|L|pack|pcs))/i);
    if (match) weight = match[1];
  }
  
  if (name && price) {
    products.push({
      id: idEl,
      name,
      price,
      weight: weight || 'N/A',
      image_url: imgUrl
    });
  }
}

console.log('Found', products.length, 'products');
console.log(products.slice(0, 3));
