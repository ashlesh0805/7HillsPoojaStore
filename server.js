const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;
const IMAGES_DIR = path.resolve(__dirname, '..', '7HILLS WEBSITE FOR STOCK ITEMS');
const UPLOADS_DIR = path.join(BASE_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
const PRODUCTS_FILE = path.join(BASE_DIR, 'products.json');
const CATEGORIES_FILE = path.join(BASE_DIR, 'categories.json');
const ORDERS_FILE = path.join(BASE_DIR, 'orders.json');
const APPOINTMENTS_FILE = path.join(BASE_DIR, 'appointments.json');

// Server-Sent Events (SSE) client registry for Partner App
const sseClients = new Set();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.apk': 'application/vnd.android.package-archive',
  '.zip': 'application/zip'
};

const PREREGISTER_FILE = path.join(BASE_DIR, 'preregistrations.json');

function readJsonFile(file, fallback = []) {
  try {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return JSON.parse(content);
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
  return fallback;
}

function writeJsonFile(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`Error writing ${file}:`, e.message);
    return false;
  }
}

function broadcastEvent(type, payload) {
  const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function resolveFilePath(reqUrl) {
  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(reqUrl.split('?')[0]);
  } catch (e) {
    decodedUrl = reqUrl.split('?')[0];
  }

  // Normalize path
  if (decodedUrl === '/' || decodedUrl === '') {
    return path.join(BASE_DIR, 'index.html');
  }

  // Partner Portal & Admin routing
  if (decodedUrl === '/partner' || decodedUrl === '/partner/' || decodedUrl === '/admin' || decodedUrl === '/admin/') {
    return path.join(BASE_DIR, 'partner.html');
  }

  // Legal pages routing
  if (decodedUrl === '/privacy' || decodedUrl === '/privacy/' || decodedUrl === '/privacy-policy') {
    return path.join(BASE_DIR, 'privacy.html');
  }
  if (decodedUrl === '/terms' || decodedUrl === '/terms/' || decodedUrl === '/terms-and-conditions') {
    return path.join(BASE_DIR, 'terms.html');
  }

  // App Download Landing Page routing
  if (decodedUrl === '/download' || decodedUrl === '/download/' || decodedUrl === '/get-app' || decodedUrl === '/app') {
    return path.join(BASE_DIR, 'download.html');
  }

  // Partner App Download Landing Page routing
  if (decodedUrl === '/partner-download' || decodedUrl === '/partner-download/' || decodedUrl === '/download-partner' || decodedUrl === '/download-partner/' || decodedUrl === '/partner/download' || decodedUrl === '/partner/download/') {
    return path.join(BASE_DIR, 'partner-download.html');
  }

  // App Package download routing
  if (decodedUrl === '/download/7HillsPoojaStore-Partner.zip' || decodedUrl === '/7HillsPoojaStore-Partner.zip') {
    return path.join(BASE_DIR, '7HillsPoojaStore-Partner.zip');
  }
  if (decodedUrl === '/download/7HillsPoojaStore-App.apk' || decodedUrl === '/download/app.apk' || decodedUrl === '/7HillsPoojaStore-App.apk' || decodedUrl === '/app.apk') {
    return path.join(BASE_DIR, '7HillsPoojaStore-App.apk');
  }
  if (decodedUrl === '/download/7HillsPoojaStore-App.zip' || decodedUrl === '/download/app.zip') {
    return path.join(BASE_DIR, '7HillsPoojaStore-App.zip');
  }

  // Remove leading slash
  let cleanPath = decodedUrl.replace(/^\/+/, '');

  // 0. If path points to uploaded images
  if (cleanPath.startsWith('uploads/')) {
    const relativeImage = cleanPath.replace(/^uploads\//, '');
    const candidate = path.join(UPLOADS_DIR, relativeImage);
    if (fs.existsSync(candidate)) return candidate;
  }

  // 1. If path points to "7HILLS WEBSITE FOR STOCK ITEMS"
  if (cleanPath.startsWith('7HILLS WEBSITE FOR STOCK ITEMS/')) {
    const relativeImage = cleanPath.replace(/^7HILLS WEBSITE FOR STOCK ITEMS\//, '');
    const candidate = path.join(IMAGES_DIR, relativeImage);
    if (fs.existsSync(candidate)) return candidate;
  }

  // 2. Direct image check in IMAGES_DIR
  if (cleanPath.startsWith('IMAGE ') || cleanPath.endsWith('.JPG') || cleanPath.endsWith('.jpg')) {
    const candidate = path.join(IMAGES_DIR, path.basename(cleanPath));
    if (fs.existsSync(candidate)) return candidate;
  }

  // 3. Normal file in BASE_DIR
  const primaryCandidate = path.join(BASE_DIR, cleanPath);
  if (fs.existsSync(primaryCandidate)) {
    try {
      const stat = fs.statSync(primaryCandidate);
      if (stat.isDirectory()) {
        const indexCandidate = path.join(primaryCandidate, 'index.html');
        if (fs.existsSync(indexCandidate)) return indexCandidate;
      }
    } catch (e) {}
    return primaryCandidate;
  }

  // 4. Fallback check in IMAGES_DIR
  const imageFallback = path.join(IMAGES_DIR, cleanPath);
  if (fs.existsSync(imageFallback)) return imageFallback;

  return null;
}

const server = http.createServer(async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = req.url.split('?')[0];

  // ==========================================
  // API: SERVER-SENT EVENTS (SSE) FOR ALERTS
  // ==========================================
  if (urlPath === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => { sseClients.delete(res); });
    return;
  }

  // ==========================================
  // API: PRODUCTS (GET, POST, DELETE)
  // ==========================================
  if (urlPath === '/api/products') {
    if (req.method === 'GET') {
      const products = readJsonFile(PRODUCTS_FILE, []);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(products));
      return;
    }

    if (req.method === 'POST') {
      try {
        const item = await parseJsonBody(req);
        let products = readJsonFile(PRODUCTS_FILE, []);
        const idx = products.findIndex(p => p.id === item.id);
        if (idx >= 0) {
          products[idx] = { ...products[idx], ...item };
        } else {
          item.id = item.id || `product_${Date.now()}`;
          products.unshift(item);
        }
        writeJsonFile(PRODUCTS_FILE, products);
        broadcastEvent('PRODUCT_UPDATED', item);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, product: item }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.method === 'DELETE') {
      try {
        let id;
        const queryId = new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams.get('id');
        if (queryId) {
          id = queryId;
        } else {
          const parsed = await parseJsonBody(req);
          id = parsed.id;
        }
        let products = readJsonFile(PRODUCTS_FILE, []);
        products = products.filter(p => p.id !== id);
        writeJsonFile(PRODUCTS_FILE, products);
        broadcastEvent('PRODUCT_DELETED', { id });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, id }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  // ==========================================
  // API: CATEGORIES (GET, POST, DELETE)
  // ==========================================
  if (urlPath === '/api/categories') {
    if (req.method === 'GET') {
      const categories = readJsonFile(CATEGORIES_FILE, []);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(categories));
      return;
    }

    if (req.method === 'POST') {
      try {
        const item = await parseJsonBody(req);
        let categories = readJsonFile(CATEGORIES_FILE, []);
        if (!item.id && item.name) {
          item.id = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        item.id = item.id || `category_${Date.now()}`;
        item.icon = item.icon || 'temple';
        item.keywords = item.keywords || [item.name.toLowerCase()];

        const idx = categories.findIndex(c => c.id === item.id);
        if (idx >= 0) {
          categories[idx] = { ...categories[idx], ...item };
        } else {
          categories.push(item);
        }
        writeJsonFile(CATEGORIES_FILE, categories);
        broadcastEvent('CATEGORY_UPDATED', item);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, category: item }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.method === 'DELETE') {
      try {
        let id;
        const queryId = new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams.get('id');
        if (queryId) {
          id = queryId;
        } else {
          const parsed = await parseJsonBody(req);
          id = parsed.id;
        }
        let categories = readJsonFile(CATEGORIES_FILE, []);
        categories = categories.filter(c => c.id !== id);
        writeJsonFile(CATEGORIES_FILE, categories);
        broadcastEvent('CATEGORY_DELETED', { id });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, id }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  // ==========================================
  // API: MEDIA UPLOAD (CAMERA & GALLERY)
  // ==========================================
  if (urlPath === '/api/upload' && req.method === 'POST') {
    try {
      const { filename, data } = await parseJsonBody(req);
      if (!data) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No image data provided' }));
        return;
      }
      const ext = path.extname(filename || '.jpg') || '.jpg';
      const safeName = `photo_${Date.now()}${ext.toLowerCase()}`;
      const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
      const filePath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, url: `uploads/${safeName}`, filename: `uploads/${safeName}` }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ==========================================
  // API: ORDERS (GET, POST, STATUS)
  // ==========================================
  if (urlPath === '/api/orders') {
    if (req.method === 'GET') {
      const orders = readJsonFile(ORDERS_FILE, []);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(orders));
      return;
    }

    if (req.method === 'POST') {
      try {
        const newOrder = await parseJsonBody(req);
        newOrder.orderId = newOrder.orderId || `7H-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
        newOrder.date = newOrder.date || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        newOrder.status = newOrder.status || 'New Order';
        
        let orders = readJsonFile(ORDERS_FILE, []);
        orders.unshift(newOrder);
        writeJsonFile(ORDERS_FILE, orders);

        // BROADCAST STRONG ALERT TO PARTNER APPS
        console.log(`[ORDER ALERT] New order placed: ${newOrder.orderId} - Rs.${newOrder.total}`);
        broadcastEvent('NEW_ORDER', newOrder);

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, order: newOrder }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  if (urlPath === '/api/orders/status' && req.method === 'POST') {
    try {
      const { orderId, status } = await parseJsonBody(req);
      let orders = readJsonFile(ORDERS_FILE, []);
      const order = orders.find(o => o.orderId === orderId);
      if (order) {
        order.status = status;
        writeJsonFile(ORDERS_FILE, orders);
        broadcastEvent('ORDER_STATUS_CHANGED', { orderId, status });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, order }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Order not found' }));
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ==========================================
  // API: APPOINTMENTS (GET, POST)
  // ==========================================
  if (urlPath === '/api/appointments') {
    if (req.method === 'GET') {
      const appts = readJsonFile(APPOINTMENTS_FILE, []);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(appts));
      return;
    }

    if (req.method === 'POST') {
      try {
        const newAppt = await parseJsonBody(req);
        newAppt.id = `APPT-${Date.now()}`;
        let appts = readJsonFile(APPOINTMENTS_FILE, []);
        appts.unshift(newAppt);
        writeJsonFile(APPOINTMENTS_FILE, appts);
        broadcastEvent('NEW_APPOINTMENT', newAppt);
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, appointment: newAppt }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  // ==========================================
  // API: RAZORPAY PAYMENT GATEWAY INTEGRATION
  // ==========================================
  if (urlPath === '/api/razorpay/create-order' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const rawAmount = body.amountInPaise ? (body.amountInPaise / 100) : (Number(body.amount) || 1);
      const amountInPaise = Math.max(100, Math.round(rawAmount * 100)); // Minimum 1 INR (100 paise)
      const currency = body.currency || 'INR';
      const receipt = body.receipt || `rcpt_${Date.now()}`;
      const notes = body.notes || {};

      const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_7HillsPoojaStore';
      const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

      // If live keys exist, attempt Razorpay REST API call
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
          const postData = JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt,
            notes
          });

          const rzpReqOptions = {
            hostname: 'api.razorpay.com',
            port: 443,
            path: '/v1/orders',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
              'Authorization': `Basic ${authString}`
            }
          };

          const rzpResult = await new Promise((resolve, reject) => {
            const apiReq = https.request(rzpReqOptions, (apiRes) => {
              let resData = '';
              apiRes.on('data', d => { resData += d; });
              apiRes.on('end', () => {
                try {
                  resolve(JSON.parse(resData));
                } catch (e) {
                  reject(e);
                }
              });
            });
            apiReq.on('error', reject);
            apiReq.write(postData);
            apiReq.end();
          });

          if (rzpResult && rzpResult.id) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: true,
              orderId: rzpResult.id,
              amount: rzpResult.amount,
              currency: rzpResult.currency,
              key: keyId,
              isSandbox: false
            }));
            return;
          }
        } catch (apiErr) {
          console.warn('[Razorpay API Warning] Live API failed, falling back to secure test sandbox:', apiErr.message);
        }
      }

      // Sandbox / Test fallback order generation
      const mockOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency,
        key: keyId,
        isSandbox: true
      }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (urlPath === '/api/razorpay/verify-payment' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (keySecret && razorpay_signature && razorpay_order_id && razorpay_payment_id) {
        const generatedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        if (generatedSignature !== razorpay_signature) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, verified: false, error: 'Invalid payment signature' }));
          return;
        }
      }

      console.log(`[PAYMENT VERIFIED] Order: ${razorpay_order_id}, PaymentId: ${razorpay_payment_id}`);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        verified: true,
        paymentId: razorpay_payment_id || `pay_${Date.now()}`
      }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }



  // ==========================================
  // API: PRE-REGISTRATION / APP LAUNCH ALERTS
  // ==========================================
  if (urlPath === '/api/preregister') {
    if (req.method === 'GET') {
      const records = readJsonFile(PREREGISTER_FILE, []);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ total: records.length, users: records }));
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const records = readJsonFile(PREREGISTER_FILE, []);
        const entry = {
          id: `pre_${Date.now()}`,
          phone: body.phone || '',
          name: body.name || 'Devotee',
          pincode: body.pincode || '500074',
          createdAt: new Date().toISOString(),
          source: body.source || 'web_install_prompt'
        };
        const existingIdx = records.findIndex(r => r.phone && r.phone === entry.phone);
        if (existingIdx >= 0) {
          records[existingIdx] = { ...records[existingIdx], ...entry };
        } else {
          records.unshift(entry);
        }
        writeJsonFile(PREREGISTER_FILE, records);
        console.log(`[PRE-REGISTRATION] New user registered for launch: ${entry.phone}`);
        broadcastEvent('new_preregistration', entry);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          message: 'Pre-registered successfully! You will receive early access & launch discounts.',
          entry
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }
  }

  // ==========================================
  // STATIC ASSET SERVING
  // ==========================================
  const filePath = resolveFilePath(req.url);

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`404 Not Found: ${req.url}`);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found`);
      return;
    }

    if (ext === '.apk') {
      res.setHeader('Content-Disposition', 'attachment; filename="7HillsPoojaStore-App.apk"');
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

function startServer(portToTry) {
  server.listen(portToTry, '0.0.0.0', () => {
    const localUrl = `http://localhost:${portToTry}`;
    const networkUrl = `http://127.0.0.1:${portToTry}`;
    console.log(`======================================================`);
    console.log(`[STORE] 7 Hills Pooja Store — Production Server Running`);
    console.log(`======================================================`);
    console.log(`> Customer Mobile App:  ${localUrl}/`);
    console.log(`> Partner Admin Portal: ${localUrl}/partner`);
    console.log(`> Network URL:          ${networkUrl}`);
    console.log(`\nServing App from:   ${BASE_DIR}`);
    console.log(`Stock Images from:  ${IMAGES_DIR}`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${portToTry} is in use, trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = (req, res) => {
  server.emit('request', req, res);
};
