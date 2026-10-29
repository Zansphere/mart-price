const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

async function testZepto() {
  const lat = 13.136285, lon = 80.22024;
  let storeId = null;
  for(let i=0; i<3; i++) {
    try {
      const res = await fetch('https://api.zeptonow.com/api/v1/config/layout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': 'ZEPTO',
          'app-version': '12.2.14',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          pageType: 'HOME',
          tenantId: 'ZEPTO'
        })
      });
      const data = await res.json();
      storeId = data.storeIds || data.storeId;
      if (storeId) break;
    } catch(e) {
      console.log('Retry', i, e.message);
    }
  }
  console.log('Zepto Store ID:', storeId);
}

testZepto();
