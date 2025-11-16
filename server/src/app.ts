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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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

// ==== REQUEST LOGGING ====
app.use((req, res, next) => {
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
app.get('/', (req, res) => {
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
