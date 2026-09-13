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

  let appointments = readJsonFile('appointments.json', []);

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(appointments);
  }

  if (req.method === 'POST') {
    let item = req.body;
    if (typeof item === 'string') {
      try { item = JSON.parse(item); } catch (e) {}
    }
    item = item || {};
    item.id = item.id || ('APPT-' + Date.now());

    appointments.unshift(item);
    try {
      const filePath = path.join(process.cwd(), 'appointments.json');
      fs.writeFileSync(filePath, JSON.stringify(appointments, null, 2), 'utf8');
    } catch (e) {}

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(201).json({ success: true, appointment: item });
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json(appointments);
};
