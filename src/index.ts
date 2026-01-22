import { startServer } from './app';
import { seedDatabase } from './seed';
import { config } from './config';
import { connectDatabase } from './config/database';

const startApp = async () => {
  try {
    // Connect to MongoDB for authentication and payment systems
    await connectDatabase();
    console.log('MongoDB connected successfully');

    // Seed database with sample data in development
    if (process.env.NODE_ENV !== 'production') {
      try {
        await seedDatabase();
      } catch (error) {
        console.log('Seeding skipped or failed:', error);
      }
    }

    // Start server with WebSocket support
    const PORT = (config.port as number) || (process.env.PORT ? parseInt(process.env.PORT as string) : 3000);
    startServer(PORT);
    
    console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startApp();
