/**
 * Parserator Production API - Express Architecture
 * Production-ready SaaS with proper middleware pipeline
 */

import * as functions from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import expressApp from './app';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Export the Express app as a Firebase Function
export const app = functions.onRequest({
  invoker: 'public',
  timeoutSeconds: 300,
  memory: '1GiB',
  secrets: [geminiApiKey]
}, expressApp);