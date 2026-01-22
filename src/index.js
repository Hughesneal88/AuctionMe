const express = require('express');
const config = require('./config');

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    app: config.appName,
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AuctionMe API',
    version: '1.0.0',
    description: 'Campus auction platform with escrow payments'
  });
});

// Start server
const PORT = config.port;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`${config.appName} server running on port ${PORT}`);
    console.log(`Environment: ${config.env}`);
  });
}

module.exports = app;
