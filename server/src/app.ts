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
// In production, explicitly load .env.production file with absolute path
if (process.env.NODE_ENV === 'production') {
  const envPath = path.join(__dirname, '../.env.production');
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    logger.error('Failed to load .env.production:', result.error);
  } else {
    logger.info(`.env.production loaded from: ${envPath}`);
  }
} else {
  dotenv.config();
}

const app: Express = express();

// ==== PROXY CONFIGURATION ====
// Trust proxy - required when behind reverse proxy (Render, AWS, etc.)
// This allows Express to correctly read X-Forwarded-* headers
app.set('trust proxy', 1);

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

    // Check if origin is in the whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all Vercel preview deployments (*.vercel.app)
    if (origin.endsWith('.vercel.app')) {
      logger.info(`CORS allowed Vercel preview: ${origin}`);
      return callback(null, true);
    }

    // Allow all Render preview deployments (*.onrender.com)
    if (origin.endsWith('.onrender.com')) {
      logger.info(`CORS allowed Render preview: ${origin}`);
      return callback(null, true);
    }

    // Block all other origins
    logger.warn(`CORS blocked request from origin: ${origin}`);
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'Pragma', 'Expires'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours - cache preflight requests
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Rate limiting - General API rate limiter
// Increased limits to accommodate multiple clients with polling
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // Increased from 100 to 1000
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for specific endpoints that need frequent polling
  skip: (req) => {
    // Allow more frequent requests for real-time features (SSE, health checks)
    const allowedPaths = ['/api/sse', '/sse', '/api/health', '/health'];
    return allowedPaths.some(path => req.path.startsWith(path));
  },
});

// Stricter rate limiter for authentication endpoints to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5'), // Only 5 login attempts per 15 min
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Apply strict rate limiting to auth endpoints
app.use('/api/auth/admin/login', authLimiter);
app.use('/api/auth/cashier/login', authLimiter);

// Apply general rate limiting to all API routes
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
