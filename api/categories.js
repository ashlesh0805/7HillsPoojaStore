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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const categories = readJsonFile('categories.json', []);

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(categories);
  }

  if (req.method === 'POST') {
    let item = req.body;
    if (typeof item === 'string') {
      try { item = JSON.parse(item); } catch (e) {}
    }
    item = item || {};
    if (!item.id && item.name) {
      item.id = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    item.id = item.id || ('category_' + Date.now());
    item.icon = item.icon || 'temple';
    item.keywords = item.keywords || [item.name ? item.name.toLowerCase() : 'samagri'];

    const idx = categories.findIndex(c => c.id === item.id);
    if (idx >= 0) {
      categories[idx] = { ...categories[idx], ...item };
    } else {
      categories.push(item);
    }

    try {
      const filePath = path.join(process.cwd(), 'categories.json');
      fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), 'utf8');
    } catch (e) {}

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json({ success: true, category: item });
  }

  if (req.method === 'DELETE') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    const id = (req.query && req.query.id) || (body && body.id);
    try {
      const updated = categories.filter(c => c.id !== id);
      const filePath = path.join(process.cwd(), 'categories.json');
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
    } catch (e) {}
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json({ success: true, id });
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json(categories);
};
