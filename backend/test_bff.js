const axios = require('axios');

async function testFetch() {
  try {
    const res = await axios.get('https://bff-gateway.zepto.com/lms/api/v2/get_page?latitude=12.92447&longitude=80.11945&page_type=HOME', {
      headers: {
        'tenant-id': 'ZEPTO',
        'app-version': '12.2.14'
      }
    });
    console.log("Success:", Object.keys(res.data));
    console.log("Response headers:", res.headers['set-cookie']);
    // Check if store info is in the response body
    if (res.data.store_info) {
        console.log("Store ID:", res.data.store_info.store_id);
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}
testFetch();
