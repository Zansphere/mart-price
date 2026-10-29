const fs = require('fs');
const html = fs.readFileSync('zepto_body.html', 'utf8');

const buttonRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
let match;
while ((match = buttonRegex.exec(html)) !== null) {
  const content = match[1].toLowerCase();
  const attributes = match[0].substring(0, match[0].indexOf('>'));
  if (content.includes('location') || content.includes('address') || content.includes('select')) {
    console.log('Button:', attributes);
    console.log('Content:', match[1]);
    console.log('---');
  }
}
