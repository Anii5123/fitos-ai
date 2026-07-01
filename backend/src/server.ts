import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initCronJobs } from './cron/jobs.js';
import mongoose from 'mongoose';

const startServer = async () => {
  try {
    // 1. Establish Database Connection
    await connectDB();

    // 2. Initialize background schedulers
    initCronJobs();

    // 3. Bind Port Listener
    const PORT = env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 FitTrack AI Server active in ${env.NODE_ENV} mode on port ${PORT}`);
    });

    // Graceful teardowns
    const shutdown = async (signal: string) => {
      console.log(`📡 Signal ${signal} received. Closing HTTP server gracefully...`);
      server.close(async () => {
        console.log('📡 HTTP server closed. Disconnecting database...');
        await mongoose.disconnect();
        console.log('📡 Database connection closed. Process exit 0.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();
