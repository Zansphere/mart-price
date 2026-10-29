import urllib.request
import json
import ssl

url = 'https://api.zeptonow.com/api/v1/config/layout/'
payload = json.dumps({
    "lat": 13.136285,
    "lon": 80.22024,
    "pageType": "HOME",
    "tenantId": "ZEPTO"
}).encode('utf-8')

# Using a public free proxy list (we'll try one)
proxy_url = 'http://167.172.248.53:3128' # A random free proxy, hopefully works
proxy_handler = urllib.request.ProxyHandler({'https': proxy_url})
opener = urllib.request.build_opener(proxy_handler)

req = urllib.request.Request(url, data=payload, method='POST')
req.add_header('Content-Type', 'application/json')
req.add_header('tenant-id', 'ZEPTO')
req.add_header('app-version', '12.2.14')
req.add_header('User-Agent', 'Mozilla/5.0')

try:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    with opener.open(req, timeout=10) as response:
        data = json.loads(response.read().decode('utf-8'))
        print(data.get('storeIds', data.get('storeId')))
except Exception as e:
    print("Error:", str(e))
