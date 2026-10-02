const fs = require('fs');
const path = require('path');

const CLOUD_BINS = [
  'https://extendsclass.com/api/json-storage/bin/beddeef',
  'https://extendsclass.com/api/json-storage/bin/afdaaec'
];

function readJsonFile(filename, fallback = []) {
  try {
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading ' + filename + ':', err);
  }
  return fallback;
}

async function fetchCloudData() {
  for (const url of CLOUD_BINS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && (Array.isArray(data.customProducts) || Array.isArray(data.deletedProductIds))) {
          return data;
        }
      }
    } catch (e) {}
  }
  return null;
}

async function saveCloudData(data) {
  const payload = JSON.stringify({
    customProducts: data.customProducts || [],
    deletedProductIds: data.deletedProductIds || [],
    stockOverrides: data.stockOverrides || {},
    lastUpdated: new Date().toISOString()
  });

  for (const url of CLOUD_BINS) {
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      if (res && res.ok) {
        break; // Successfully persisted!
      }
    } catch (e) {}
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let products = readJsonFile('products.json', []);

  // Fetch persistent cloud products and overrides
  let cloudData = null;
  try {
    cloudData = await fetchCloudData();
  } catch (e) {}

  if (cloudData) {
    const deletedIds = new Set(cloudData.deletedProductIds || []);
    const stockOverrides = cloudData.stockOverrides || {};
    const customProducts = cloudData.customProducts || [];

    // Filter deleted
    products = products.filter(p => !deletedIds.has(p.id));

    // Merge custom products
    customProducts.forEach(cp => {
      if (deletedIds.has(cp.id)) return;
      const idx = products.findIndex(p => p.id === cp.id);
      if (idx >= 0) {
        products[idx] = { ...products[idx], ...cp };
      } else {
        products.unshift(cp);
      }
    });

    // Apply stock overrides
    products = products.map(p => {
      if (stockOverrides[p.id]) {
        const ov = stockOverrides[p.id];
        return {
          ...p,
          inStock: ov.inStock !== undefined ? ov.inStock : p.inStock,
          stockQty: ov.stockQty !== undefined ? ov.stockQty : p.stockQty
        };
      }
      return p;
    });
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(products);
  }

  if (req.method === 'POST') {
    let item = req.body;
    if (typeof item === 'string') {
      try { item = JSON.parse(item); } catch (e) {}
    }
    item = item || {};
    item.id = item.id || ('product_' + Date.now());

    // Update cloud storage
    if (!cloudData) {
      cloudData = { customProducts: [], deletedProductIds: [], stockOverrides: {} };
    }
    cloudData.customProducts = cloudData.customProducts || [];
    cloudData.deletedProductIds = cloudData.deletedProductIds || [];
    cloudData.stockOverrides = cloudData.stockOverrides || {};

    // Remove from deleted if re-saving
    cloudData.deletedProductIds = cloudData.deletedProductIds.filter(id => id !== item.id);

    const cpIdx = cloudData.customProducts.findIndex(p => p.id === item.id);
    if (cpIdx >= 0) {
      cloudData.customProducts[cpIdx] = { ...cloudData.customProducts[cpIdx], ...item };
    } else {
      cloudData.customProducts.unshift(item);
    }

    if (item.inStock !== undefined || item.stockQty !== undefined) {
      cloudData.stockOverrides[item.id] = {
        inStock: item.inStock,
        stockQty: item.stockQty
      };
    }

    await saveCloudData(cloudData);

    // Also attempt local write if running on node/writable container
    try {
      const idx = products.findIndex(p => p.id === item.id);
      if (idx >= 0) {
        products[idx] = { ...products[idx], ...item };
      } else {
        products.unshift(item);
      }
      const filePath = path.join(process.cwd(), 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf8');
    } catch (e) {}

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json({ success: true, product: item });
  }

  if (req.method === 'DELETE') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    const id = (req.query && req.query.id) || (body && body.id);

    if (id) {
      if (!cloudData) {
        cloudData = { customProducts: [], deletedProductIds: [], stockOverrides: {} };
      }
      cloudData.deletedProductIds = cloudData.deletedProductIds || [];
      if (!cloudData.deletedProductIds.includes(id)) {
        cloudData.deletedProductIds.push(id);
      }
      cloudData.customProducts = (cloudData.customProducts || []).filter(p => p.id !== id);
      await saveCloudData(cloudData);

      try {
        const updated = products.filter(p => p.id !== id);
        const filePath = path.join(process.cwd(), 'products.json');
        fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
      } catch (e) {}
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json({ success: true, id });
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json(products);
};
