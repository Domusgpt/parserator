/**
 * Express App for Parserator SaaS API
 * Clean middleware pipeline with proper error handling
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin conditionally (fixes deployment timeout)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Import middleware
import { authMiddleware } from './middleware/authMiddleware';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { usageMiddleware } from './middleware/usageMiddleware';

// Import route handlers
import { parseHandler } from './routes/parseRoutes';
import { userRoutes } from './routes/userRoutes';

// Create Express app
const app = express();

// Basic middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    message: 'Parserator Express API is running!',
    features: ['express-architecture', 'api-key-auth', 'rate-limiting', 'usage-tracking']
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Parserator API',
    version: '2.0.0',
    status: 'running',
    architecture: 'Express + Firebase Functions',
    features: ['structured-outputs', 'api-key-auth', 'rate-limiting', 'usage-tracking'],
    endpoints: {
      'GET /health': 'Health check',
      'GET /v1/info': 'API information',
      'POST /v1/parse': 'Parse data with authentication',
      'POST /v1/user/keys': 'Generate API keys',
      'GET /v1/user/usage': 'Get usage statistics'
    }
  });
});

// API info (no auth required for discoverability)
app.get('/v1/info', (req, res) => {
  res.json({
    name: 'Parserator API',
    version: '2.0.0',
    status: 'running',
    authentication: {
      methods: ['X-API-Key header', 'Authorization Bearer token'],
      keyFormat: 'pk_test_* or pk_live_*',
      anonymous: 'Limited trial access available'
    },
    limits: {
      anonymous: '10 requests/day',
      free: '50 requests/day', 
      pro: '1000 requests/day',
      enterprise: 'unlimited'
    },
    documentation: 'https://docs.parserator.com'
  });
});

// Apply middleware pipeline to protected routes
app.use('/v1/parse', authMiddleware);
app.use('/v1/parse', rateLimitMiddleware);
app.use('/v1/parse', usageMiddleware);

// Apply authentication to user management routes
app.use('/v1/user', authMiddleware);
app.use('/v1/user', rateLimitMiddleware);

// Route handlers
app.post('/v1/parse', parseHandler);
app.use('/v1/user', userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
    availableEndpoints: ['/health', '/v1/info', '/v1/parse', '/v1/user/keys', '/v1/user/usage']
  });
});

export default app;