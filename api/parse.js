const PROVIDER_URL = 'https://api.vidssave.com/api/contentsite_api/media/parse';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function collectRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1_000_000) {
        reject(new Error('Body terlalu besar'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function getRequestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.body && typeof req.body === 'string') return parseBody(req.body, req.headers['content-type']);

  const raw = await collectRawBody(req);
  return parseBody(raw, req.headers['content-type']);
}

function parseBody(raw, contentType = '') {
  const type = String(contentType || '').toLowerCase();

  if (!raw) return {};

  if (type.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  if (type.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(raw);
    return Object.fromEntries(params.entries());
  }

  try {
    return JSON.parse(raw);
  } catch {
    const params = new URLSearchParams(raw);
    return Object.fromEntries(params.entries());
  }
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      status: false,
      message: 'Method tidak diizinkan. Pakai POST.'
    });
  }

  try {
    const body = await getRequestBody(req);
    const link = body.link || body.url;

    if (!link) {
      return res.status(400).json({
        status: false,
        message: 'Link YouTube kosong.'
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    const providerBody = new URLSearchParams({
      auth: process.env.VIDSSAVE_AUTH || '20250901majwlqo',
      domain: process.env.VIDSSAVE_DOMAIN || 'api-ak.vidssave.com',
      origin: 'source',
      link
    }).toString();

    const apiRes = await fetch(PROVIDER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 Vercel Proxy'
      },
      body: providerBody,
      signal: controller.signal
    });

    clearTimeout(timer);

    const text = await apiRes.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(apiRes.status || 502).json({
        status: false,
        message: 'Provider tidak membalas JSON.',
        providerStatus: apiRes.status,
        raw: text.slice(0, 500)
      });
    }

    return res.status(apiRes.status || 200).json(data);
  } catch (error) {
    const isTimeout = error && error.name === 'AbortError';

    return res.status(isTimeout ? 504 : 500).json({
      status: false,
      message: isTimeout
        ? 'Provider terlalu lama membalas.'
        : (error.message || 'Proxy error')
    });
  }
};
