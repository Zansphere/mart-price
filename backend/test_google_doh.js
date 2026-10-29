const https = require('https');

https.get('https://dns.google/resolve?name=api.zeptonow.com&type=A', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Google DoH:', data);
  });
});
