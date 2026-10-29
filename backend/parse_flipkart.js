const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('flipkart_search.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const products = [];
// Flipkart usually uses specific obfuscated classes, but we can look for 'a' tags with specific shapes
const links = document.querySelectorAll('a[target="_blank"]');
for (const item of links) {
  const titleEl = item.querySelector('.s1Q9rs, .IRpwTa, ._4rR01T, [title]'); // Common flipkart title classes
  let title = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent.trim()) : null;
  
  if (!title && item.getAttribute('title')) {
    title = item.getAttribute('title');
  }

  const priceEl = item.querySelector('._30jeq3, ._1_WHN1');
  const priceText = priceEl ? priceEl.textContent.replace(/[^\d.]/g, '') : null;
  const price = priceText ? parseFloat(priceText) : null;
  
  const imgEl = item.querySelector('img');
  const imgUrl = imgEl ? imgEl.getAttribute('src') : null;
  
  if (title && price && title.toLowerCase().includes('milk')) {
    products.push({ title, price, imgUrl });
  }
}

console.log('Found', products.length, 'products');
console.log(products.slice(0, 3));
