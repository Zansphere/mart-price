const https = require('https');

async function test() {
  https.get({
    host: 'cloudflare-dns.com',
    path: '/dns-query?name=api.zeptonow.com&type=A',
    headers: { 'accept': 'application/dns-json' }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Cloudflare DNS:', data);
    });
  });
}
test();
