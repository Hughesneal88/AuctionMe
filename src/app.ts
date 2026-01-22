import express, { Application } from 'express';
import cors from 'cors';
import http from 'http';
import { wsService } from './services/webSocketService';
import bidRoutes from './routes/bidRoutes';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/bids', bidRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}

export function startServer(port: number = 3000): http.Server {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize WebSocket server
  wsService.initialize(server);

  server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`WebSocket server is ready`);
  });

  return server;
}
