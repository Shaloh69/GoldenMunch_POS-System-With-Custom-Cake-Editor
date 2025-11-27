import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists (with permission handling)
const logsDir = './logs';
let canWriteToFile = false;

try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  // Test write permissions
  fs.accessSync(logsDir, fs.constants.W_OK);
  canWriteToFile = true;
} catch (error) {
  // File logging not available (e.g., in containerized environments like Render)
  console.warn('Warning: Cannot write to logs directory. File logging disabled. Logs will be sent to console only.');
  canWriteToFile = false;
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create the logger with conditional transports
const transports: winston.transport[] = [];

// Add file transports only if we have write permissions
if (canWriteToFile && process.env.DISABLE_FILE_LOGGING !== 'true') {
  transports.push(
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all error logs to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

// Always add console transport (essential for containerized deployments)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'goldenmunch-pos' },
  transports,
});

export default logger;
