const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function getStoreId() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  let storeId = null;
  page.on('response', async res => {
    if (res.url().includes('/api/v1/config/layout/')) {
      try {
        const j = await res.json();
        if (j.storeIds || j.storeId) {
          storeId = j.storeIds || j.storeId;
          console.log('Intercepted Store ID:', storeId);
        }
      } catch(e) {}
    }
  });

  console.log('Navigating to zepto...');
  await page.goto('https://www.zeptonow.com/', { waitUntil: 'networkidle2' });
  
  try {
    console.log('Looking for location selector...');
    // The main location button is usually top left
    // We can just find the button containing text "Location" or similar
    // Since we don't know the exact class, let's look for the svg icon or just click the location text
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent === 'Select Location' || e.textContent === 'Type manually');
      if (el) el.click();
    });

    await new Promise(r => setTimeout(r, 2000));
    
    // Now there should be an input field for location
    const inputs = await page.$$('input');
    if (inputs.length > 0) {
      console.log('Typing address...');
      await inputs[0].type('Chennai');
      await new Promise(r => setTimeout(r, 2000));
      
      // Hit Enter or click the first suggestion
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      console.log('Waiting for network...');
      await new Promise(r => setTimeout(r, 4000));
    } else {
      console.log('No input found!');
    }
  } catch(e) {
    console.log('Error automating UI:', e.message);
  }

  console.log('Final Extracted Store ID:', storeId);
  await browser.close();
}

getStoreId();
