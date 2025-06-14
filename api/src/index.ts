import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import {
    parseHandler,
    upsertSchemaHandler,
    getSchemaHandler,
    listSchemasHandler
} from './handlers';

const app = express();

// Middlewares
app.use(cors({ origin: true })); // Configure CORS appropriately for your needs
app.use(express.json());       // To parse JSON request bodies

// --- API Routes ---

// Parsing
app.post('/parse', parseHandler);

// Schema Management
app.post('/schemas', upsertSchemaHandler);       // Create new schema
app.get('/schemas', listSchemasHandler);         // List all schemas
app.get('/schemas/:schemaId', getSchemaHandler); // Get a specific schema
app.put('/schemas/:schemaId', upsertSchemaHandler);  // Update a specific schema

// Example: Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// --- Firebase Cloud Function Export ---
// Expose Express API as a single Firebase Function.
// The name 'api' here will be part of the function URL (e.g., .../api/parse, .../api/schemas)
// If you deploy directly to Cloud Run or another Express host, this export might differ.
export const api_entry = functions.https.onRequest(app);

// Optional: Log to confirm setup during deployment or cold start
console.log('Express application initialized for Firebase Functions.');
