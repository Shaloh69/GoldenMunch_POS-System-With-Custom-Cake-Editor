import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Import middleware
import { notFound, errorHandler } from './middleware/error.middleware';
import logger from './utils/logger';

// Import routes
import routes from './routes';

// Load environment variables
dotenv.config();

const app: Express = express();

// ==== SECURITY MIDDLEWARE ====

// Helmet - Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS - Cross-Origin Resource Sharing
// Support multiple origins for development (comma-separated in .env)
const standardDevPorts = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [];

// Always include localhost ports for development/testing, plus any env origins
const allowedOrigins = Array.from(new Set([...standardDevPorts, ...envOrigins]));

// Log CORS configuration on startup
logger.info(`CORS enabled for origins: ${allowedOrigins.join(', ') || 'None (only requests without origin)'}`);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// ==== BODY PARSING MIDDLEWARE ====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==== COMPRESSION ====
app.use(compression());

// ==== STATIC FILES ====
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Serve Mobile Editor (Next.js static export)
// This allows mobile devices to access the cake editor via http://SERVER_IP:3001/
const mobileEditorPath = path.join(__dirname, '../../client/MobileEditor/out');
app.use(express.static(mobileEditorPath));

// ==== REQUEST LOGGING ====
app.use((req, _res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ==== API ROUTES ====
app.use('/api', routes);

// ==== ROOT ENDPOINT ====
app.get('/', (_req, res) => {
  res.json({
    name: 'GoldenMunch POS API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      kiosk: '/api/kiosk/*',
      auth: '/api/auth/*',
      cashier: '/api/cashier/*',
      admin: '/api/admin/*',
    },
  });
});

// ==== ERROR HANDLING ====
app.use(notFound);
app.use(errorHandler);

export default app;
