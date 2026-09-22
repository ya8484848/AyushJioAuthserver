const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Apply CORS middleware FIRST — but with proper preflight handling
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

// 2. CRITICAL: Handle OPTIONS preflight BEFORE the proxy
app.options('/api/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24h
  res.status(204).end();
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// 3. Your dynamic proxy — now only handles actual requests (GET/POST)
app.use('/api', (req, res, next) => {
  const fullUrl = req.url.slice(1);
  
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    return res.status(400).json({ error: 'Invalid target URL' });
  }

  let targetOrigin, targetPath;
  try {
    const parsed = new URL(fullUrl);
    targetOrigin = parsed.origin;
    targetPath = parsed.pathname + parsed.search;
  } catch (e) {
    return res.status(400).json({ error: 'Malformed URL' });
  }

  const proxy = createProxyMiddleware({
    target: targetOrigin,
    changeOrigin: true,
    pathRewrite: () => targetPath,
    on: {
      error: (err, req, res) => {
        res.status(500).json({ error: 'Proxy failed', details: err.message });
      }
    }
  });

  proxy(req, res, next);
});

app.listen(PORT, () => console.log(`Dynamic proxy on ${PORT}`));
