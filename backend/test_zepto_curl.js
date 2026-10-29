const { execSync } = require('child_process');

function fetchZeptoCurl(lat, lon) {
  try {
    const payload = JSON.stringify({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      pageType: 'HOME',
      tenantId: 'ZEPTO'
    });
    
    // Windows curl requires escaping double quotes inside the payload
    const escapedPayload = payload.replace(/"/g, '\\"');
    
    const cmd = `curl -s -X POST "https://api.zeptonow.com/api/v1/config/layout/" -H "Content-Type: application/json" -H "tenant-id: ZEPTO" -H "app-version: 12.2.14" -H "User-Agent: Mozilla/5.0" -d "${escapedPayload}"`;
    
    console.log('Running curl...');
    const result = execSync(cmd, { encoding: 'utf-8', timeout: 5000 });
    const j = JSON.parse(result);
    console.log('Zepto Store ID:', j.storeIds || j.storeId);
  } catch(e) {
    console.log('Curl error:', e.message);
  }
}

fetchZeptoCurl('13.136285', '80.22024');
