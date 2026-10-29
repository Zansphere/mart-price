const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const https = require('https');
const axios = require('axios');

// Custom lookup using Node's pure JS dns resolver which respects setServers
function customLookup(hostname, options, callback) {
  dns.resolve4(hostname, (err, addresses) => {
    if (err) {
      return callback(err);
    }
    if (addresses.length === 0) {
      return callback(new Error(`ENOTFOUND ${hostname}`));
    }
    callback(null, addresses[0], 4);
  });
}

const httpsAgent = new https.Agent({ lookup: customLookup });

async function testZepto() {
  const lat = '13.136285', lon = '80.22024';
  try {
    const res = await axios.post('https://api.zeptonow.com/api/v1/config/layout/', {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      pageType: 'HOME',
      tenantId: 'ZEPTO'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'tenant-id': 'ZEPTO',
        'app-version': '12.2.14',
        'User-Agent': 'Mozilla/5.0'
      },
      httpsAgent,
      timeout: 5000
    });
    console.log('Store:', res.data.storeIds || res.data.storeId);
  } catch(e) {
    console.log('Error:', e.message);
  }
}
testZepto();
