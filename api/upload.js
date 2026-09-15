module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    const { filename, data } = body || {};
    if (!data) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    return res.status(200).json({
      success: true,
      url: data,
      filename: filename || 'photo.jpg'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
