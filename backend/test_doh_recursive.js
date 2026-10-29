const https = require('https');

async function resolveDoH(hostname) {
  return new Promise((resolve, reject) => {
    https.get(`https://dns.google/resolve?name=${hostname}&type=A`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.Answer) {
            // Find A record
            const aRecord = j.Answer.find(r => r.type === 1);
            if (aRecord) {
              resolve(aRecord.data);
            } else {
              // Find CNAME and recurse
              const cname = j.Answer.find(r => r.type === 5);
              if (cname) {
                resolveDoH(cname.data).then(resolve).catch(reject);
              } else {
                resolve(null);
              }
            }
          } else {
            resolve(null);
          }
        } catch(e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function test() {
  const ip = await resolveDoH('api.zeptonow.com');
  console.log('Final Zepto IP:', ip);
}
test();
