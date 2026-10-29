const https = require('https');
const axios = require('axios');

async function resolveDoH(hostname) {
  return new Promise((resolve, reject) => {
    https.get(`https://dns.google/resolve?name=${hostname}&type=A`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.Answer) {
            // Find the first A record (type 1)
            const aRecord = j.Answer.find(r => r.type === 1);
            if (aRecord) resolve(aRecord.data);
            else resolve(null);
          } else resolve(null);
        } catch(e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function test() {
  console.log('Resolving via DoH...');
  const ip = await resolveDoH('api.zeptonow.com');
  console.log('IP:', ip);
  
  if (!ip) return;
  
  // Now use this IP for axios
  const lat = '13.136285', lon = '80.22024';
  try {
    const res = await axios.post(`https://${ip}/api/v1/config/layout/`, {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      pageType: 'HOME',
      tenantId: 'ZEPTO'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'tenant-id': 'ZEPTO',
        'app-version': '12.2.14',
        'User-Agent': 'Mozilla/5.0',
        'Host': 'api.zeptonow.com'
      },
      httpsAgent: new https.Agent({ servername: 'api.zeptonow.com' }), // SNI is required for Cloudflare!
      timeout: 5000
    });
    console.log('Store:', res.data.storeIds || res.data.storeId);
  } catch(e) {
    console.log('Error:', e.message);
  }
}
test();
