const scraper = require('./scraper.js');

async function testBB() {
  await scraper.initBrowser();
  const bb = await scraper.scrapeBigBasket('milk', '13.136285', '80.22024', '600110');
  console.log('BigBasket:', bb);
  process.exit(0);
}
testBB();
