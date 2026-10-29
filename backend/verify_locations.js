const scraper = require('./scraper.js');

async function testLocations() {
  await scraper.initBrowser();
  
  console.log('\n=== TESTING CHENNAI (13.0418, 80.2341) ===');
  const latC = '13.0418', lonC = '80.2341', pinC = '600017';
  
  const bc = await scraper.scrapeBlinkit('milk', latC, lonC, pinC);
  console.log('Blinkit Chennai:', bc ? bc.slice(0,2).map(x => x.name) : 'null');
  
  const zc = await scraper.scrapeZepto('milk', latC, lonC, pinC);
  console.log('Zepto Chennai:', zc ? zc.slice(0,2).map(x => x.name) : 'null');

  const bbc = await scraper.scrapeBigBasket('milk', latC, lonC, pinC);
  console.log('BigBasket Chennai:', bbc ? bbc.slice(0,2).map(x => x.name) : 'null');

  console.log('\n=== TESTING DELHI (28.7041, 77.1025) ===');
  const latD = '28.7041', lonD = '77.1025', pinD = '110001';
  
  const bd = await scraper.scrapeBlinkit('milk', latD, lonD, pinD);
  console.log('Blinkit Delhi:', bd ? bd.slice(0,2).map(x => x.name) : 'null');
  
  const zd = await scraper.scrapeZepto('milk', latD, lonD, pinD);
  console.log('Zepto Delhi:', zd ? zd.slice(0,2).map(x => x.name) : 'null');

  const bbd = await scraper.scrapeBigBasket('milk', latD, lonD, pinD);
  console.log('BigBasket Delhi:', bbd ? bbd.slice(0,2).map(x => x.name) : 'null');
  
  process.exit(0);
}

testLocations();
