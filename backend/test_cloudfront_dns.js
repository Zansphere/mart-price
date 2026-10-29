const dns = require('dns').promises;

async function test() {
  try {
    const records = await dns.resolve4('du5xxallcgiip.cloudfront.net');
    console.log('Cloudfront IP:', records);
  } catch(e) {
    console.log('Error:', e.message);
  }
}
test();
