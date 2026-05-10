require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4081;

// Logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms - IP :remote-addr'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak request, coba lagi dalam 15 menit.',
  },
});
app.use(limiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'CoolKicks Gateway aktif', timestamp: new Date() });
});

// Proxy ke Auth Service
app.use(
  '/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        res.status(503).json({ success: false, message: 'Auth Service tidak tersedia' });
      },
    },
  })
);

// Proxy ke Product Service
app.use(
  ['/products', '/orders'],
  createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        res.status(503).json({ success: false, message: 'Product Service tidak tersedia' });
      },
    },
  })
);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route tidak ditemukan di Gateway' });
});

app.listen(PORT, () => {
  console.log(`Gateway berjalan di port ${PORT}`);
});