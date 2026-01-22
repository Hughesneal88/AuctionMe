require('dotenv').config();

/**
 * Environment configuration module
 * Validates and provides access to environment variables
 */
const config = {
  // Application
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  appName: process.env.APP_NAME || 'AuctionMe',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'auctionme',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  },
  
  // Payment Gateway
  paymentGateway: {
    apiKey: process.env.PAYMENT_GATEWAY_API_KEY || '',
    secret: process.env.PAYMENT_GATEWAY_SECRET || '',
    url: process.env.PAYMENT_GATEWAY_URL || 'https://api.payment-gateway.com',
    mockEnabled: process.env.ENABLE_MOCK_PAYMENT === 'true'
  },
  
  // Escrow
  escrow: {
    releaseDelayHours: parseInt(process.env.ESCROW_RELEASE_DELAY_HOURS || '24', 10),
    refundWindowDays: parseInt(process.env.ESCROW_REFUND_WINDOW_DAYS || '7', 10)
  },
  
  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    encryptionKey: process.env.ENCRYPTION_KEY || 'change-this-key'
  },
  
  // Notifications
  notifications: {
    emailApiKey: process.env.EMAIL_SERVICE_API_KEY || '',
    smsApiKey: process.env.SMS_SERVICE_API_KEY || '',
    emailEnabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    smsEnabled: process.env.ENABLE_SMS_NOTIFICATIONS === 'true'
  }
};

/**
 * Validate required configuration in production
 */
function validateConfig() {
  if (config.env === 'production') {
    const requiredSecrets = [
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'PAYMENT_GATEWAY_API_KEY',
      'PAYMENT_GATEWAY_SECRET'
    ];
    
    const missing = requiredSecrets.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
    }
    
    // Validate that default secrets are not used in production
    if (config.security.jwtSecret === 'change-this-secret') {
      throw new Error('Default JWT_SECRET cannot be used in production');
    }
    
    if (config.security.encryptionKey === 'change-this-key') {
      throw new Error('Default ENCRYPTION_KEY cannot be used in production');
    }
  }
}

// Run validation on module load
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  if (config.env === 'production') {
    process.exit(1);
  }
}

module.exports = config;
