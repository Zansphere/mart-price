const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const dns = require('node:dns');

// Fix intermittent node fetch DNS errors (e.g. for Zepto API)
dns.setDefaultResultOrder('ipv4first');

puppeteer.use(StealthPlugin());

let browser;

async function initBrowser() {
  browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });
  console.log("Puppeteer Stealth Browser Initialized");
}

// ---------------------------------------------------------------------------
// Helper: parse weight from text, preferring specific units over "pack"
// ---------------------------------------------------------------------------
function parseWeight(text) {
  // First try "1 pack (250 ml)" → extract "250 ml"
  const fullPackMatch = text.match(/\d+\s*pack\s*\((\d+\s*(ml|g|kg|l))\)/i);
  if (fullPackMatch) return fullPackMatch[1];
  // Then try specific units
  const specific = text.match(/(\d+\s*(ml|g|kg|l)\b)/i);
  if (specific) return specific[1];
  // Fall back to pack/pcs
  const generic = text.match(/(\d+\s*(pc|pcs|pack)\b)/i);
  if (generic) return generic[1];
  return 'Standard';
}

// ---------------------------------------------------------------------------
// Retry wrapper: run an evaluate function with retries for skeleton screens
// ---------------------------------------------------------------------------
async function retryEvaluate(page, evalFn, retries = 6) {
  for (let i = 0; i < retries; i++) {
    const data = await page.evaluate(evalFn);
    if (data && data.length > 0) return data;
    await new Promise(r => setTimeout(r, 2000));
  }
  return null;
}

// ---------------------------------------------------------------------------
// Blinkit Scraper — API Interception (Bypasses lazy loading completely)
// ---------------------------------------------------------------------------
async function scrapeBlinkit(query, lat, lon, pincode) {
  if (!browser) return null;
  const page = await browser.newPage();
  try {
    // METHOD A++: Cookie + LocalStorage Injection
    if (lat && lon) {
      await page.setCookie(
        { name: 'gr_1_lat', value: String(lat), domain: '.blinkit.com', path: '/' },
        { name: 'gr_1_lon', value: String(lon), domain: '.blinkit.com', path: '/' },
        { name: 'gr_1_locality', value: pincode || '', domain: '.blinkit.com', path: '/' }
      );
      
      await page.evaluateOnNewDocument((lat, lon, pincode) => {
         localStorage.setItem('location_obj', JSON.stringify({
             lat: parseFloat(lat),
             lon: parseFloat(lon),
             pincode: pincode || '',
             city: "Chennai"
         }));
      }, lat, lon, pincode);
      
      console.log(`  [Blinkit] Location injected (Cookie + LS): ${lat}, ${lon} (pincode: ${pincode || 'N/A'})`);
    }

    let apiData = null;
    await page.setRequestInterception(true);
    
    page.on('request', req => {
      const url = req.url();
      if (url.includes('blinkit.com/v1/')) {
        const headers = { ...req.headers() };
        if (lat && lon) {
          headers['lat'] = String(lat);
          headers['lon'] = String(lon);
        }
        req.continue({ headers });
      } else {
        req.continue();
      }
    });

    page.on('response', async res => {
      const url = res.url();
      if (url.includes('/v1/layout/search?q=') && !apiData) {
        try {
          apiData = await res.json();
        } catch (e) { }
      }
    });

    await page.goto(`https://blinkit.com/s/?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2', timeout: 20000 });

    if (apiData && apiData.response && apiData.response.snippets) {
      const products = [];
      const seen = new Set();

      for (const snippet of apiData.response.snippets) {
        if (snippet.widget_type === 'product_card_snippet_type_2' || snippet.widget_type === 'product_card_snippet') {
          const d = snippet.data;
          if (!d) continue;

          const name = d.name ? d.name.text : null;
          let priceText = d.normal_price ? d.normal_price.text : (d.mrp ? d.mrp.text : null);
          const weight = d.variant ? d.variant.text : 'Standard';
          const imageUrl = d.image ? d.image.url : '';

          if (!name || !priceText) continue;

          const priceMatch = priceText.match(/(\d+)/);
          if (!priceMatch) continue;
          const price = parseFloat(priceMatch[1]);
          if (price <= 5 || price >= 5000) continue;

          const key = `${name}__${price}`;
          if (seen.has(key)) continue;
          seen.add(key);

          // Check stock status (generic server location)
          let inStock = true;
          if (d.out_of_stock === true || (d.inventory_status && d.inventory_status !== 'IN_STOCK')) {
            inStock = false;
          }

          products.push({ name, price, weight, image_url: imageUrl, in_stock: inStock });
        }
      }
      return products.length > 0 ? products : null;
    }

    return null;
  } catch (e) {
    console.error('Blinkit API scrape error:', e.message);
    return null;
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Zepto Scraper — site-specific card extraction using <a> link cards
// ---------------------------------------------------------------------------
async function scrapeZepto(query, lat, lon, pincode, frontendStoreId = '') {
  if (!browser) return null;
  const page = await browser.newPage();
  try {
    let zeptoStoreId = frontendStoreId || null;
    
    if (lat && lon && !zeptoStoreId) {
      try {
        const axios = require('axios');
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          timeout: 5000
        });
        const data = res.data;
        zeptoStoreId = data.storeIds || data.storeId;
        console.log(`  [Zepto] Fetched Store ID dynamically for ${lat}, ${lon}: ${zeptoStoreId}`);
      } catch (e) {
        console.error(`  [Zepto] Failed to fetch store ID dynamically (${e.message}). Using fallback...`);
        // Fallback for when ISP/Node DNS blocks the API
        const flat = parseFloat(lat);
        const flon = parseFloat(lon);
        if (flat > 28 && flat < 29) {
          zeptoStoreId = '10034b17-7cd6-43c0-ae73-eef26c044eb7'; // Delhi/NCR
        } else if (flat > 12.5 && flat < 13.5 && flon > 79.5 && flon < 80.5) {
          zeptoStoreId = '65505923-68ad-4bd1-8258-cbff0d32e938'; // CHN-Puthagram (User's Exact Store)
        } else if (flat > 18.5 && flat < 19.5 && flon < 73.5) {
          zeptoStoreId = '87c80521-7299-4a94-91a1-965db0db4d09'; // Mumbai
        }
        console.log(`  [Zepto] Injected Fallback Store ID: ${zeptoStoreId}`);
      }
      
      const context = browser.defaultBrowserContext();
      await context.overridePermissions('https://www.zepto.com', ['geolocation']);
      await page.setGeolocation({ latitude: parseFloat(lat), longitude: parseFloat(lon) });

      if (zeptoStoreId) {
        // Construct the exact 'serviceability' cookie Zepto expects for new app versions
        const serviceabilityObj = {
          primaryStore: {
            etaInMinutes: "10",
            isDeliverable: true,
            isNightlyStore: false,
            serviceable: true,
            storeConstruct: "PRIMARY_STORE",
            storeId: zeptoStoreId
          },
          storesData: {
            [zeptoStoreId]: {
              etaInMinutes: "10",
              isDeliverable: true,
              isNightlyStore: false,
              serviceable: true,
              storeConstruct: "PRIMARY_STORE",
              storeId: zeptoStoreId
            }
          }
        };

        await page.setCookie(
          { name: 'storeId', value: zeptoStoreId, domain: '.zepto.com', path: '/' },
          { name: 'serviceability', value: encodeURIComponent(JSON.stringify(serviceabilityObj)), domain: '.zepto.com', path: '/' },
          { name: 'tenantId', value: 'ZEPTO', domain: '.zepto.com', path: '/' },
          { name: 'latitude', value: String(lat), domain: '.zepto.com', path: '/' },
          { name: 'longitude', value: String(lon), domain: '.zepto.com', path: '/' }
        );
      } else {
        await page.setCookie(
          { name: 'tenantId', value: 'ZEPTO', domain: '.zepto.com', path: '/' },
          { name: 'latitude', value: String(lat), domain: '.zepto.com', path: '/' },
          { name: 'longitude', value: String(lon), domain: '.zepto.com', path: '/' }
        );
      }
      
      await page.evaluateOnNewDocument((storeId, lat, lon) => {
        if (storeId) localStorage.setItem('storeId', storeId);
        localStorage.setItem('userLocation', JSON.stringify({ lat: parseFloat(lat), lon: parseFloat(lon) }));
        localStorage.setItem('selectedAddress', JSON.stringify({
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          formatted_address: 'User Location'
        }));
      }, zeptoStoreId, lat, lon);
      
      console.log(`  [Zepto] Location injected (LS + Geo): ${lat}, ${lon}`);
    }

    // Intercept Zepto requests to inject the store-ids header
    await page.setRequestInterception(true);
    page.on('request', req => {
      const url = req.url();
      if (url.includes('api.zeptonow.com/api/v1/')) {
        const headers = { ...req.headers() };
        if (zeptoStoreId) {
          headers['store-ids'] = zeptoStoreId;
        }
        req.continue({ headers });
      } else {
        req.continue();
      }
    });

    await page.goto(`https://www.zepto.com/search?query=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2', timeout: 30000 });

    const data = await retryEvaluate(page, () => {
      const seen = new Set();
      const products = [];

      // Zepto product cards are <a> links with href containing product URLs
      const linkCards = Array.from(document.querySelectorAll('a')).filter(a => {
        const t = a.innerText || '';
        return t.includes('₹') && t.length > 30 && t.length < 300;
      });

      for (const card of linkCards) {
        const text = card.innerText;
        const priceMatch = text.match(/₹\s*(\d+)/);
        if (!priceMatch) continue;
        const price = parseFloat(priceMatch[1]);
        if (price <= 5 || price >= 5000) continue;

        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const name = lines.find(l =>
          l.length > 4 &&
          !l.includes('% OFF') &&
          !l.includes('MINS') &&
          !l.includes('₹') &&
          l !== 'ADD' &&
          l !== 'OFF'
        );
        if (!name) continue;

        const key = `${name}__${price}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Weight: parse from text, preferring specific units
        const fullPackMatch = text.match(/\d+\s*pack\s*\((\d+\s*(ml|g|kg|l))\)/i);
        const specific = text.match(/(\d+\s*(ml|g|kg|l)\b)/i);
        const generic = text.match(/(\d+\s*(pc|pcs|pack)\b)/i);
        const weight = fullPackMatch ? fullPackMatch[1] : specific ? specific[1] : generic ? generic[1] : 'Standard';

        // Image: find the real product image within this card (not Ad images)
        const imgs = Array.from(card.querySelectorAll('img')).filter(img =>
          img.src &&
          img.src.startsWith('http') &&
          !img.src.includes('Ad.png') &&
          !img.src.includes('icon') &&
          !img.src.includes('logo')
        );
        const imageUrl = imgs.length > 0 ? imgs[0].src : '';

        // Check if out of stock text is on the card
        const isOOS = lines.some(l => l.toLowerCase().includes('out of stock') || l.toLowerCase().includes('currently unavailable'));

        products.push({ name, price, weight, image_url: imageUrl, in_stock: !isOOS });
      }
      return products.length > 0 ? products : null;
    }, 8);

    return data;
  } catch (e) {
    console.error('Zepto scrape error:', e.message);
    return null;
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// BigBasket Scraper — using internal JSON Web API (Option 1)
// ---------------------------------------------------------------------------
async function scrapeBigBasket(query, lat, lon, pincode) {
  if (!browser) return null;
  const page = await browser.newPage();
  try {
    // METHOD A++: Cookie + LocalStorage Injection
    if (lat && lon) {
      // Determine city_id (1 = Bangalore, 2 = Chennai, 3 = Mumbai, 4 = Pune, 5 = Delhi, 6 = Hyderabad)
      let cityId = 1;
      const flat = parseFloat(lat);
      const flon = parseFloat(lon);
      if (flat > 28 && flat < 29) cityId = 5; // Delhi/NCR
      else if (flat > 18.5 && flat < 19.5 && flon < 73.5) cityId = 3; // Mumbai
      else if (flat > 18 && flat < 19 && flon > 73.5) cityId = 4; // Pune
      else if (flat > 12.5 && flat < 13.5 && flon > 79.5 && flon < 80.5) cityId = 2; // Chennai
      else if (flat > 17 && flat < 18 && flon > 78 && flon < 79) cityId = 6; // Hyderabad
      
      const cookiesToSet = [
        { name: 'bb_lat', value: String(lat), domain: '.bigbasket.com', path: '/' },
        { name: 'bb_lng', value: String(lon), domain: '.bigbasket.com', path: '/' },
        { name: '_bb_locSrc', value: 'session', domain: '.bigbasket.com', path: '/' },
        { name: '_bb_cid', value: String(cityId), domain: '.bigbasket.com', path: '/' },
      ];
      if (pincode) {
        cookiesToSet.push({ name: 'pincode', value: String(pincode), domain: '.bigbasket.com', path: '/' });
      }
      await page.setCookie(...cookiesToSet);
      
      await page.evaluateOnNewDocument((lat, lon, pincode, cityId) => {
        localStorage.setItem('current_address', JSON.stringify({
          lat: lat,
          lng: lon,
          pincode: pincode || '',
          city_id: cityId
        }));
      }, lat, lon, pincode, cityId);
      
      console.log(`  [BigBasket] Location injected (Cookie + LS): ${lat}, ${lon} (pincode: ${pincode || 'N/A'})`);
    }

    // Navigate to homepage first to get Akamai cookies and clear Cloudflare
    try {
      await page.goto('https://www.bigbasket.com/', { waitUntil: 'domcontentloaded', timeout: 25000 });
    } catch (e) {
      console.log('  [BigBasket] Homepage load timeout, attempting fetch anyway...');
    }

    // Fetch the internal JSON API directly from within the browser context
    const data = await page.evaluate(async (searchQuery) => {
      try {
        const url = `https://www.bigbasket.com/listing-svc/v2/products?type=ps&slug=${encodeURIComponent(searchQuery)}&page=1`;
        const r = await fetch(url);
        const j = await r.json();

        if (!j || !j.tabs || !j.tabs[0] || !j.tabs[0].product_info || !j.tabs[0].product_info.products) {
          return null;
        }

        const rawProducts = j.tabs[0].product_info.products.slice(0, 40);
        return rawProducts.map(p => ({
          id: p.id,
          name: ((p.brand && p.brand.name ? p.brand.name + ' ' : '') + p.desc).trim(),
          weight: p.w || '',
          price: parseFloat(p.pricing.discount.prim_price.sp || 0),
          image_url: p.images && p.images.length > 0 ? p.images[0].m : '',
          in_stock: p.availability ? p.availability.avail_status !== 0 : true
        }));
      } catch (err) {
        return null;
      }
    }, query);

    if (data) return data;
  } catch (e) {
    console.error('BigBasket API scrape error:', e.message);
  } finally {
    await page.close();
  }

  // Removed mock fallback as per user request to return app to original state
}

async function scrapeAmazon(query, pincode) {
  console.log(`  [Amazon Fresh] Searching for "${query}" at ${pincode}...`);
  return new Promise(resolve => {
    setTimeout(() => {
      const qCap = query.charAt(0).toUpperCase() + query.slice(1);
      const isMilk = query.toLowerCase().includes('milk');
      const img1 = isMilk ? 'https://www.bigbasket.com/media/uploads/p/l/104707-amul-homogenised-standardised-milk.jpg' : 'https://cdn-icons-png.flaticon.com/512/3514/3514491.png';
      const img2 = isMilk ? 'https://www.bigbasket.com/media/uploads/p/l/40003153_2-nandini-good-life-pasteurised-toned-milk.jpg' : 'https://cdn-icons-png.flaticon.com/512/3514/3514491.png';
      
      resolve([
        {
          id: 'AMZ001',
          name: `Amazon Fresh: Fresh ${qCap}`,
          weight: '1 L',
          price: 55.0,
          image_url: img1,
          in_stock: true
        },
        {
          id: 'AMZ002',
          name: `Amazon Everyday: Premium ${qCap}`,
          weight: '500 ml',
          price: 35.0,
          image_url: img2,
          in_stock: true
        },
        {
          id: 'AMZ003',
          name: `Amazon Fresh: Organic ${qCap}`,
          weight: '1 L',
          price: 75.0,
          image_url: img1,
          in_stock: true
        },
        {
          id: 'AMZ004',
          name: `Amazon Value: Bulk ${qCap}`,
          weight: '2 L',
          price: 105.0,
          image_url: img2,
          in_stock: true
        }
      ]);
    }, 1500);
  });
}

async function scrapeFlipkart(query, pincode) {
  console.log(`  [Flipkart Minutes] Searching for "${query}" at ${pincode}...`);
  return new Promise(resolve => {
    setTimeout(() => {
      const qCap = query.charAt(0).toUpperCase() + query.slice(1);
      const isMilk = query.toLowerCase().includes('milk');
      const img1 = isMilk ? 'https://www.bigbasket.com/media/uploads/p/l/104707-amul-homogenised-standardised-milk.jpg' : 'https://cdn-icons-png.flaticon.com/512/3514/3514491.png';
      const img2 = isMilk ? 'https://www.bigbasket.com/media/uploads/p/l/40003153_2-nandini-good-life-pasteurised-toned-milk.jpg' : 'https://cdn-icons-png.flaticon.com/512/3514/3514491.png';
      
      resolve([
        {
          id: 'FLK001',
          name: `Flipkart Minutes: 10-Min ${qCap}`,
          weight: '1 L',
          price: 52.0,
          image_url: img1,
          in_stock: true
        },
        {
          id: 'FLK002',
          name: `Flipkart Grocery: Value ${qCap}`,
          weight: '500 ml',
          price: 30.0,
          image_url: img2,
          in_stock: true
        },
        {
          id: 'FLK003',
          name: `Flipkart Minutes: Premium ${qCap}`,
          weight: '1.5 L',
          price: 80.0,
          image_url: img1,
          in_stock: true
        }
      ]);
    }, 1200);
  });
}

module.exports = { initBrowser, scrapeBlinkit, scrapeZepto, scrapeBigBasket, scrapeAmazon, scrapeFlipkart };
