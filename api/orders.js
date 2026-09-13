const fs = require('fs');
const path = require('path');

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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let orders = readJsonFile('orders.json', []);

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(orders);
  }

  if (req.method === 'POST') {
    let item = req.body;
    if (typeof item === 'string') {
      try { item = JSON.parse(item); } catch (e) {}
    }
    item = item || {};
    item.orderId = item.orderId || ('7H-ORD-' + Math.floor(10000 + Math.random() * 90000));
    item.date = item.date || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    item.status = item.status || 'New Order';

    orders.unshift(item);
    try {
      const filePath = path.join(process.cwd(), 'orders.json');
      fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf8');
    } catch (e) {}

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(201).json({ success: true, order: item });
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json(orders);
};
