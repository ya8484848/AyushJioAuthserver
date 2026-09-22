const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Dynamic proxy: extract the target URL from the path
app.use('/api', createProxyMiddleware({
  // This function runs for each request to determine where to forward it
  router: (req) => {
    // req.url will be something like: /https://jsonplaceholder.typicode.com/posts
    // Remove the leading slash to get the URL
    const targetUrl = req.url.slice(1);
    
    // Basic validation to ensure it looks like a URL
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      return targetUrl;
    }
    
    // Fallback if no valid URL found
    return 'https://jsonplaceholder.typicode.com';
  },
  changeOrigin: true,
  // Important: don't rewrite the path, we want the full URL to be sent
  pathRewrite: (path, req) => {
    // Strip the leading /api and the leading slash from the extracted URL
    // Actually, the router already handles the target. We just need to remove /api
    // The path here is already just the part after /api, like /https://...
    // We want the proxy to request: https://target.com/path
    // The library will prepend the target, so we need the path to be just the URL part
    // This is tricky. Let's use the router to do the full job.
    return path; // Keep it, the router's target should handle it
  }
}));

app.listen(PORT, () => console.log(`Dynamic proxy on ${PORT}`));
