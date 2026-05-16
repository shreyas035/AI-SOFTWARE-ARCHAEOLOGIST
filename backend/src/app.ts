import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rate-limit.middleware';
import logger from './config/logger';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import repositoryRoutes from './routes/repository.routes';
import analysisRoutes from './routes/analysis.routes';
import chatRoutes from './routes/chat.routes';
import architectureRoutes from './routes/architecture.routes';
import documentationRoutes from './routes/documentation.routes';
import onboardingRoutes from './routes/onboarding.routes';
import searchRoutes from './routes/search.routes';
import comparisonRoutes from './routes/comparison.routes';
import exportRoutes from './routes/export.routes';

const app: Application = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ============================================
// GENERAL MIDDLEWARE
// ============================================

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use((req, _res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================
// API ROUTES
// ============================================

const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Apply rate limiting to all API routes
app.use(API_PREFIX, apiLimiter);

// Mount routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/repositories`, repositoryRoutes);
app.use(`${API_PREFIX}/analysis`, analysisRoutes);
app.use(`${API_PREFIX}/chat`, chatRoutes);
app.use(`${API_PREFIX}/architecture`, architectureRoutes);
app.use(`${API_PREFIX}/documentation`, documentationRoutes);
app.use(`${API_PREFIX}/onboarding`, onboardingRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/comparison`, comparisonRoutes);
app.use(`${API_PREFIX}/export`, exportRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;

// Made with Bob
