/**
 * Minimal test to identify deployment timeout cause
 */

import * as functions from 'firebase-functions/v1';

// Minimal function - no Express, no Firebase Admin
export const app = functions.https.onRequest((req, res) => {
  res.json({
    status: 'minimal test working',
    timestamp: new Date().toISOString(),
    message: 'If this deploys, the issue is with Express or Firebase Admin'
  });
});