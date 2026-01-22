import { startServer } from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

startServer(PORT);
