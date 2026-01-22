import { startServer } from './app';
import { seedDatabase } from './seed';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Seed database with sample data in development
if (process.env.NODE_ENV !== 'production') {
  seedDatabase();
}

startServer(PORT);
