import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './config';
import routes from './routes';
import bidRoutes from './routes/bidRoutes';
import { wsService } from './services/webSocketService';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes - Authentication and user management
  app.use('/api', routes);
  
  // Routes - Bidding system
  app.use('/api/bids', bidRoutes);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'ok', 
      message: 'AuctionMe API is running',
      timestamp: new Date() 
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  });

  return app;
}

export function startServer(port: number = 3000): http.Server {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize WebSocket server for real-time bidding
  wsService.initialize(server);

  server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`WebSocket server is ready`);
  });

  return server;
}

export default createApp();
