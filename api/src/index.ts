/**
 * Main entry point for API functions.
 * This file would typically initialize and export Firebase Cloud Functions.
 */

// Import and re-export functions from other files to organize the codebase
// For example, if your actual parsing logic is in 'functions.ts'
// export * from './functions';

// Placeholder if all logic is in one file or structured differently
import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { parseHandler, schemaHandler } from './handlers'; // Assuming handlers are defined here

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Define routes
app.post('/parse', parseHandler);
app.post('/schemas', schemaHandler); // Example for schema creation
app.get('/schemas/:schemaId', schemaHandler); // Example for getting a schema

// Expose Express API as a single Firebase Function
// This is a common pattern for HTTP APIs with multiple routes.
// The name 'api' here will be part of the function URL.
export const api_entry = functions.https.onRequest(app);

// If you have other types of functions (e.g., pubsub, scheduled), they would be exported here too.
// export const scheduledTask = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
//   console.log('This will be run every 24 hours!');
//   return null;
// });

console.log("API index.ts loaded. Functions should be deployable.");
