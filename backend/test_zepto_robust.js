const dns = require('dns').promises;
const https = require('https');

async function robustZeptoFetch(lat, lon) {
  try {
    const host = 'api.zeptonow.com';
    let ip = null;
    try {
      const records = await dns.resolve4(host);
      if (records && records.length > 0) {
        ip = records[0];
        console.log(`Resolved ${host} to IPv4: ${ip}`);
      }
    } catch (e) {
      console.log(`DNS resolve4 failed for ${host}:`, e.message);
    }
    
    // Fallback to fetch using IP if DNS fails or is flaky
    const url = ip ? `https://${ip}/api/v1/config/layout/` : `https://${host}/api/v1/config/layout/`;
    
    const payload = JSON.stringify({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      pageType: 'HOME',
      tenantId: 'ZEPTO'
    });

    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': 'ZEPTO',
          'app-version': '12.2.14',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Host': host, // CRUCIAL for SNI and Cloudflare
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 5000,
        servername: host // CRUCIAL for TLS SNI
      };

      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            resolve(j.storeIds || j.storeId || null);
          } catch(e) {
            resolve(null);
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.write(payload);
      req.end();
    });
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function test() {
  const store = await robustZeptoFetch('13.136285', '80.22024');
  console.log('Robust Zepto Store ID:', store);
}
test();
