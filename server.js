const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api', createProxyMiddleware({
  target: process.env.TARGET_URL || 'https://jsonplaceholder.typicode.com',
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  on: {
    error: (err, req, res) => {
      res.status(500).json({ error: 'Proxy failed', details: err.message });
    }
  }
}));

app.listen(PORT, () => console.log(`Proxy on ${PORT}`));
