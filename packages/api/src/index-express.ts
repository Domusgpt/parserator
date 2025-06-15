/**
 * Parserator Production API - Express Architecture (Firebase Functions v1)
 * Production-ready SaaS with proper middleware pipeline
 */

import * as functions from 'firebase-functions/v1';
import expressApp from './app';

// Export the Express app as a Firebase Function (v1)
export const app = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB'
  })
  .https.onRequest(expressApp);