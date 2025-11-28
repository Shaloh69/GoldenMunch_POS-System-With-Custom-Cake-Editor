import app from './app';
import { testConnection } from './config/database';
import logger from './utils/logger';
import { logJWTDiagnostic } from './utils/jwtDiagnostic';

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    logger.info('Database connection established');

    // Check JWT configuration
    logJWTDiagnostic();

    // Start Express server
    app.listen(Number(PORT), HOST, () => {
      logger.info(`🚀 Server is running on http://${HOST}:${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📡 API Base URL: http://${HOST}:${PORT}/api`);
      logger.info(`🏪 Kiosk API: http://${HOST}:${PORT}/api/kiosk`);
      logger.info(`💳 Cashier API: http://${HOST}:${PORT}/api/cashier`);
      logger.info(`⚙️  Admin API: http://${HOST}:${PORT}/api/admin`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();
