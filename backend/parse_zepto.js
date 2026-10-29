const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('zepto_body.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const elements = Array.from(document.querySelectorAll('*'));
for (const el of elements) {
  if (el.tagName === 'BUTTON' || el.tagName === 'A') {
    const text = (el.textContent || '').trim().toLowerCase();
    if (text.includes('location') || text.includes('address') || text.includes('select') || text.includes('type manually')) {
      console.log(el.tagName, el.className, text);
    }
  }
}
