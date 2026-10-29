const https = require('https');

https.get({
  host: 'cloudflare-dns.com',
  path: '/dns-query?name=du5xxallcgiip.cloudfront.net&type=A',
  headers: { 'accept': 'application/dns-json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Cloudflare DNS CNAME Resolve:', data);
  });
});
