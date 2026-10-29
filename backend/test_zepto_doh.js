const https = require('https');

async function getZeptoIP() {
  return new Promise((resolve, reject) => {
    https.get('https://dns.google/resolve?name=api.zeptonow.com&type=A', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.Answer && j.Answer.length > 0) {
            resolve(j.Answer[0].data);
          } else {
            resolve(null);
          }
        } catch(e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  const ip = await getZeptoIP();
  console.log('Zepto IP from Google DNS:', ip);
}
test();
