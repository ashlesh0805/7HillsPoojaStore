const https = require('https');

const EKQR_API_KEY = process.env.EKQR_API_KEY || '1e64b87d-a94c-4dd2-ac78-e9c02df24c21';

function ekqrPost(endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = https.request({
      hostname: 'api.ekqr.in',
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ status: false, msg: 'Invalid JSON response from gateway', raw: body });
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(postData);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';

  // 1. Create Order
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    body = body || {};

    // Check if status check requested
    if (body.action === 'check_status' || url.includes('/check-status')) {
      const txnId = body.client_txn_id;
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0') + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + now.getFullYear();
      const txnDate = body.txn_date || d;

      try {
        const result = await ekqrPost('/api/check_order_status', {
          key: EKQR_API_KEY,
          client_txn_id: txnId,
          txn_date: txnDate
        });
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(result);
      } catch (err) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(500).json({ status: false, msg: err.message });
      }
    }

    // Otherwise create order
    const orderId = body.orderId || body.client_txn_id || ('7H-ORD-' + Math.floor(10000 + Math.random() * 90000));
    const amount = Number(body.amount || body.grandTotal || 1).toFixed(2);
    const customerName = (body.customerName || 'Devotee').trim();
    const customerPhone = (body.phone || body.customer_mobile || '9989885363').replace(/[^0-9]/g, '').slice(-10) || '9989885363';
    const customerEmail = body.customer_email || 'devotee@7hillspoojastore.com';
    const redirectUrl = body.redirect_url || `https://www.7hillspoojastore.com/#/order-confirmed/${orderId}`;

    try {
      const ekqrResponse = await ekqrPost('/api/create_order', {
        key: EKQR_API_KEY,
        client_txn_id: orderId,
        amount: amount,
        p_info: '7 Hills Pooja Store Order ' + orderId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_mobile: customerPhone,
        redirect_url: redirectUrl
      });

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).json(ekqrResponse);
    } catch (err) {
      console.error('[ekQR API Error]:', err);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(500).json({ status: false, msg: err.message });
    }
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json({ status: true, gateway: 'ekQR 0% Commission UPI Gateway', active: true });
};
