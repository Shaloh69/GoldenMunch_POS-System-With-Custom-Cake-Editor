import app from './app';
import { testConnection } from './config/database';
import { initRedis, closeRedis } from './config/redis';
import logger from './utils/logger';
import { logJWTDiagnostic } from './utils/jwtDiagnostic';
import { emailService } from './services/email.service';
import { schedulerService } from './services/scheduler.service';

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
const startServer = async () => {
  try {
    // Start Express server IMMEDIATELY to bind port for health checks
    // This ensures Render can detect the port and health checks pass
    const server = app.listen(Number(PORT), HOST, () => {
      logger.info(`🚀 Server is running on http://${HOST}:${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📡 API Base URL: http://${HOST}:${PORT}/api`);
      logger.info(`🏪 Kiosk API: http://${HOST}:${PORT}/api/kiosk`);
      logger.info(`💳 Cashier API: http://${HOST}:${PORT}/api/cashier`);
      logger.info(`⚙️  Admin API: http://${HOST}:${PORT}/api/admin`);
    });

    // Initialize services in the background (non-blocking)
    // If any service fails, the server continues running
    initializeServices().catch((error) => {
      logger.error('Service initialization failed, but server continues:', error);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize backend services (database, redis, email, etc.)
// This runs in the background and doesn't block server startup
const initializeServices = async () => {
  try {
    // Test database connection
    logger.info('🔌 Initializing database connection...');
    await testConnection();
    logger.info('✅ Database connection established');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error; // Database is critical, throw to alert
  }

  try {
    // Initialize Redis cache (non-critical, graceful degradation)
    logger.info('🔌 Initializing Redis cache...');
    await initRedis();
  } catch (error) {
    logger.warn('⚠️  Redis initialization failed, continuing without cache:', error);
  }

  try {
    // Check JWT configuration
    logJWTDiagnostic();
  } catch (error) {
    logger.warn('⚠️  JWT diagnostic failed:', error);
  }

  try {
    // Initialize email service and scheduler
    logger.info('🔌 Initializing email and scheduler services...');
    await emailService.testConnection();
    schedulerService.initialize();
    logger.info('✅ Email and scheduler services initialized');
  } catch (error) {
    logger.warn('⚠️  Email/scheduler initialization failed, continuing without notifications:', error);
  }

  try {
    // Process any pending notifications immediately on startup
    logger.info('📧 Processing pending notifications...');
    await emailService.processPendingNotifications();
    logger.info('✅ Pending notifications processed');
  } catch (error) {
    logger.warn('⚠️  Failed to process pending notifications:', error);
  }

  logger.info('✨ All services initialized');
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
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  schedulerService.stopAll();
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  schedulerService.stopAll();
  await closeRedis();
  process.exit(0);
});

// Start the server
startServer();
