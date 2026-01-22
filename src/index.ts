import { startServer } from './app';
import { seedDatabase } from './seed';
import { config } from './config';
import { connectDatabase } from './config/database';

const startApp = async () => {
  try {
    // Connect to MongoDB for authentication
    await connectDatabase();
    console.log('MongoDB connected successfully');

    // Seed database with sample data in development
    if (process.env.NODE_ENV !== 'production') {
      seedDatabase();
    }

    // Start server with WebSocket support
    const PORT = config.port as number;
    startServer(PORT);
    
    console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startApp();
