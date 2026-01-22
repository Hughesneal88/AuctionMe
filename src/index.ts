import express from 'express';
import dotenv from 'dotenv';
import { notificationRoutes } from './routes/notificationRoutes';
import { auditRoutes } from './routes/auditRoutes';
import { deliveryCodeRoutes } from './routes/deliveryCodeRoutes';
import { cleanupRateLimits } from './middleware/rateLimiter';
import { auditLogMiddleware } from './middleware/security';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global audit logging middleware
app.use(auditLogMiddleware);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/delivery-codes', deliveryCodeRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'AuctionMe API',
    version: '1.0.0',
    description: 'Campus auction app with notifications, security, and fraud prevention',
    endpoints: {
      notifications: '/api/notifications',
      audit: '/api/audit',
      deliveryCodes: '/api/delivery-codes',
      health: '/health',
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start cleanup tasks
cleanupRateLimits();

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AuctionMe API server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
