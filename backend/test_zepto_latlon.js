const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testLatLonCookies(lat, lon) {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.setCookie(
    { name: 'user_lat', value: lat.toString(), domain: '.zepto.com' },
    { name: 'user_lon', value: lon.toString(), domain: '.zepto.com' }
  );
  
  console.log("Navigating to zepto...");
  await page.goto('https://www.zepto.com/', { waitUntil: 'domcontentloaded' });
  
  await new Promise(r => setTimeout(r, 4000));
  
  const cookies = await page.cookies();
  const serv = cookies.find(c => c.name === 'serviceability');
  if (serv) {
    console.log("Serviceability cookie exists!");
    const data = JSON.parse(decodeURIComponent(serv.value));
    console.log("Store ID:", data.primaryStore?.storeId);
  } else {
    console.log("No serviceability cookie.");
  }
  
  await browser.close();
}

testLatLonCookies(12.92447, 80.11945); // Tambaram
