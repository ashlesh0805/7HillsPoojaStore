const fs = require('fs');
const path = require('path');

function readJsonFile(filename, fallback = []) {
  try {
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
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

  if (req.method === 'OPTIONS') return res.status(200).end();

  let orders = readJsonFile('orders.json', []);
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const { orderId, status } = body || {};
  const order = orders.find(o => o.orderId === orderId);
  if (order) {
    order.status = status;
    try {
      const filePath = path.join(process.cwd(), 'orders.json');
      fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf8');
    } catch (e) {}
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json({ success: true, order });
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json({ success: true, orderId, status });
};
