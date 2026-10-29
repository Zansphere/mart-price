const https = require('https');

async function test() {
  https.get(`https://dns.google/resolve?name=api.zeptonow.com&type=A`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(data);
    });
  });
}
test();
