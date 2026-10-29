const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function getDynamicStoreId(lat, lon, address = 'Chennai') {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  let storeId = null;
  page.on('response', async res => {
    if (res.url().includes('api.zeptonow.com/api/v1/config/layout/') || res.url().includes('api.zeptonow.com/api/v2/location/place')) {
      try {
        const j = await res.json();
        if (j.storeIds) storeId = j.storeIds;
        else if (j.storeId) storeId = j.storeId;
        else if (j.serviceability?.primaryStore?.storeId) storeId = j.serviceability.primaryStore.storeId;
      } catch(e) {}
    }
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.zepto.com', ['geolocation']);
  await page.setGeolocation({ latitude: parseFloat(lat), longitude: parseFloat(lon) });

  console.log('Navigating to zepto...');
  await page.goto('https://www.zepto.com/', { waitUntil: 'domcontentloaded' });
  
  try {
    console.log('Clicking location button...');
    await page.waitForSelector('[aria-label="Select Location"]', { timeout: 10000 });
    await page.click('[aria-label="Select Location"]');
    
    // Sometimes a location modal appears. We want the input.
    console.log('Waiting for input...');
    await page.waitForSelector('input', { timeout: 10000 });
    const inputs = await page.$$('input');
    console.log('Inputs found:', inputs.length);
    
    if (inputs.length > 0) {
      // Type the address
      await inputs[0].type(address);
      await new Promise(r => setTimeout(r, 2000));
      
      // Wait for suggestion list and click first item
      const suggestions = await page.$$('[data-testid="location-suggestion"], li, .pac-item'); // guess classes
      console.log('Suggestions:', suggestions.length);
      
      // If we don't know the class, just send down arrow and enter
      await page.keyboard.press('ArrowDown');
      await new Promise(r => setTimeout(r, 500));
      await page.keyboard.press('Enter');
      
      console.log('Waiting for layout network request...');
      await new Promise(r => setTimeout(r, 5000));
    }
  } catch(e) {
    console.log('UI automation error:', e.message);
  }

  // Fallback to checking localStorage or cookies
  const cookies = await page.cookies();
  const servCookie = cookies.find(c => c.name === 'serviceability');
  if (servCookie && !storeId) {
    try {
      const data = JSON.parse(decodeURIComponent(servCookie.value));
      storeId = data.primaryStore.storeId;
    } catch(e) {}
  }
  
  console.log('Extracted Dynamic Store ID:', storeId);
  await browser.close();
}

getDynamicStoreId(13.136285, 80.22024, 'Chennai');
