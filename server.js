// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());

// Enable compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Serve static files with caching
app.use(express.static(__dirname, {
  maxAge: '1d',
  etag: true
}));

// API keys middleware with rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50
});

app.get('/api/keys', apiLimiter, (req, res) => {
  // Only provide keys in a secure way
  if (!process.env.API_SECRET || req.headers['x-api-secret'] !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({
    groq: process.env.GROQ_API_KEY || '',
    perplexity: process.env.PERPLEXITY_API_KEY || '',
    gemini: process.env.GEMINI_API_KEY || ''
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Error starting server:', err);
    return;
  }
  console.log(`Server running on http://localhost:${PORT}`);
});