const axios = require('axios');

async function testFetch() {
  try {
    const res = await axios.post('https://api.zepto.com/api/v1/config/layout/', {
      lat: 12.92447,
      lon: 80.11945,
      pageType: 'HOME',
      tenantId: 'ZEPTO'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'tenant-id': 'ZEPTO',
        'app-version': '12.2.14'
      }
    });
    console.log("Success:", res.data.storeIds || res.data.storeId);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
testFetch();
