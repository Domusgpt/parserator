// packages/api/src/app.ts (snippet)
import express, { Request, Response, NextFunction } from 'express'; // Added Request, Response, NextFunction
import cors from 'cors';
import { authMiddleware, AuthenticatedRequest } from './middleware/authMiddleware';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware'; // Import new middleware
import {
    createWebhook,
    listUserWebhooks,
    deleteWebhook,
    // dispatchWebhookEvent // Keep dispatch internal or for admin use initially
} from './services/webhookService'; // Adjust path
import { ApiKey, User, WebhookEventName } from './models'; // Adjust path, Added ApiKey, User
import { v4 as uuidv4 } from 'uuid'; // For test dispatch route
import { createApiKey, listApiKeysForUser, deleteApiKeyForUser } from './services/apiKeyService'; // Added apiKeyService imports

// Placeholder for Firebase Auth Middleware (replace with actual implementation)
// This middleware would verify a Firebase ID token and attach user info to req.auth
const firebaseAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Example: Check for a firebase token in a different header or cookie
  // For now, let's assume it populates req.auth.uid if successful
  // In a real app, this would involve firebase-admin.auth().verifyIdToken(...)
  const firebaseToken = req.headers['x-firebase-token'] as string;
  if (firebaseToken) {
    // Mocking user for now, replace with actual verification
    req.auth = { uid: 'mock-firebase-user-id-' + firebaseToken.slice(0,5) };
    console.log(`Mock Firebase Auth: User ${req.auth.uid} authenticated.`);
    next();
  } else {
    // If the /api/keys endpoints are exclusively for Firebase Auth users,
    // then this should be a 401/403 error.
    // If API keys can also manage other API keys (less common for user-facing),
    // then `authMiddleware` (API key auth) might be an alternative.
    // For this subtask, assuming /api/keys are for Firebase logged-in users.
    console.warn('No X-Firebase-Token found, but allowing request to proceed for /api/keys for now if another auth mechanism is not strictly enforced yet.');
    // res.status(401).json({ error: 'Unauthorized: Firebase token required.' });
    // For now, to allow progress without implementing full Firebase Auth, we'll call next()
    // but in production this should be a blocking error.
    // SIMULATING A LOGGED IN USER FOR DEVELOPMENT OF THESE ROUTES:
    req.auth = { uid: 'dev-user-id-123' }; // !!! REMOVE IN PRODUCTION !!!
    next();
  }
};


const app = express();
// ... (other setup: cors, json)
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Parserator API is running.' });
});

// Apply the mock Firebase Auth middleware to /api/keys routes
// This is DIFFERENT from the authMiddleware which uses API keys for auth.
// These routes are for users to manage their own API keys.

// POST /api/keys - Create a new API key
app.post('/api/keys', firebaseAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  const { keyName, isLive } = req.body; // isLive to determine if it's a live or test key
  const userId = req.auth?.uid; // Assuming firebaseAuthMiddleware sets req.auth.uid

  if (!userId) {
    return res.status(403).json({ error: 'Forbidden: User authentication required.' });
  }
  if (!keyName || typeof keyName !== 'string' || keyName.trim() === '') {
    return res.status(400).json({ error: 'Bad Request: keyName (string) is required.' });
  }
  if (typeof isLive !== 'boolean') {
    return res.status(400).json({ error: 'Bad Request: isLive (boolean) is required.' });
  }

  try {
    // Fetch user to get their current tier, required for createApiKey
    // In a real app, user details might already be attached by firebaseAuthMiddleware
    const userSnapshot = await admin.firestore().collection('users').doc(userId).get();
    if (!userSnapshot.exists) {
        return res.status(404).json({ error: "User not found, cannot create API key." });
    }
    const userData = userSnapshot.data() as User; // Type assertion

    const { apiKeyString, apiKeyDocument } = await createApiKey(userId, keyName.trim(), isLive, userData.subscriptionTier);

    // Return the full key string *only once* upon creation.
    // Return metadata for the key.
    res.status(201).json({
      message: 'API Key created successfully. Store this key securely, it will not be shown again.',
      apiKey: apiKeyString, // The actual secret key
      keyDetails: { // Metadata
        id: apiKeyDocument.id,
        name: apiKeyDocument.name,
        keyPrefix: apiKeyDocument.keyPrefix,
        createdAt: apiKeyDocument.createdAt,
        isActive: apiKeyDocument.isActive,
        tierWhenCreated: apiKeyDocument.tierWhenCreated
      }
    });
  } catch (error: any) {
    console.error(`Error creating API key for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to create API key.', message: error.message });
  }
});

// DELETE /api/keys/:keyId - Delete an API key
app.delete('/api/keys/:keyId', firebaseAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.auth?.uid;
  const { keyId } = req.params;

  if (!userId) {
    return res.status(403).json({ error: 'Forbidden: User authentication required.' });
  }
  if (!keyId) {
    return res.status(400).json({ error: 'Bad Request: keyId parameter is required.' });
  }

  try {
    await deleteApiKeyForUser(keyId, userId);
    res.status(204).send(); // Successfully deleted, no content to return
  } catch (error: any) {
    console.error(`Error deleting API key ${keyId} for user ${userId}:`, error);
    if (error.message.includes('Forbidden') || error.message.includes('not found')) {
      // More specific errors based on service layer exceptions
      res.status(403).json({ error: 'Failed to delete API key. Check ownership and key ID.', message: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete API key.', message: error.message });
    }
  }
});

// GET /api/keys - List API keys for the authenticated user
app.get('/api/keys', firebaseAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.auth?.uid;

  if (!userId) {
    return res.status(403).json({ error: 'Forbidden: User authentication required.' });
  }

  try {
    const apiKeysMetadata = await listApiKeysForUser(userId);
    // Filter out any sensitive details if listApiKeysForUser doesn't already do it sufficiently
    // (it currently does, returning Partial<ApiKey & { id: string }>)
    res.status(200).json(apiKeysMetadata);
  } catch (error: any) {
    console.error(`Error listing API keys for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to list API keys.', message: error.message });
  }
});


app.get('/v1/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Apply auth AND rate limit middleware to /v1/parse
app.post('/v1/parse', authMiddleware, rateLimitMiddleware, (req: AuthenticatedRequest, res) => {
  console.log(`Authenticated and rate-limited user: ${req.user!.email}`);
  res.status(501).json({
      message: 'Not Implemented: Parsing functionality pending.',
      user_id: req.user!.id,
      api_key_id: req.apiKey!.id
  });
});

// Apply to /v1/me as well
app.get('/v1/me', authMiddleware, rateLimitMiddleware, (req: AuthenticatedRequest, res) => {
    // ... (existing /v1/me logic)
    res.status(200).json({
        message: "User details (rate limited endpoint)",
        user: {
            id: req.user!.id,
            email: req.user!.email,
            // ... other user fields
        },
        apiKey: {
            id: req.apiKey!.id,
            name: req.apiKey!.name,
            // ... other apiKey fields
        }
    });
});

// Webhook Management API
// These endpoints should be protected by user session authentication (e.g., Firebase Auth)
app.post('/api/webhooks', firebaseAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  const { targetUrl, eventNames } = req.body;
  const userId = req.auth?.uid; // Get user ID from Firebase Auth middleware

  if (!userId) {
    return res.status(403).json({ error: "User authentication required." });
  }
  if (!targetUrl || !Array.isArray(eventNames) || eventNames.length === 0) {
    return res.status(400).json({ error: 'targetUrl and a non-empty array of eventNames are required.' });
  }

  // Updated validation for event names based on models.ts
  const validEventNamesFromModel: WebhookEventName[] = ['document.parsed', 'document.failed', 'job.status.updated'];
  for (const name of eventNames) {
    if (!validEventNamesFromModel.includes(name as WebhookEventName)) {
      return res.status(400).json({ error: `Invalid eventName: ${name}. Valid events are: ${validEventNamesFromModel.join(', ')}` });
    }
  }

  try {
    const webhook = await createWebhook(userId, targetUrl, eventNames as WebhookEventName[]);
    // Secret key is returned once on creation, this is acceptable.
    res.status(201).json(webhook);
  } catch (error: any) {
    console.error(`Error creating webhook for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to create webhook.', message: error.message });
  }
});

app.get('/api/webhooks', firebaseAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.auth?.uid; // Get user ID from Firebase Auth middleware

  if (!userId) {
    return res.status(403).json({ error: "User authentication required." });
  }
  try {
    const webhooks = await listUserWebhooks(userId);
    // Exclude secretKey from the response for security
    const webhooksWithoutSecrets = webhooks.map(wh => {
      const { secretKey, ...rest } = wh;
      return rest;
    });
    res.status(200).json(webhooksWithoutSecrets);
  } catch (error: any) {
    console.error(`Error listing webhooks for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to list webhooks.', message: error.message });
  }
});

app.delete('/api/webhooks/:webhookId', firebaseAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  const { webhookId } = req.params;
  const userId = req.auth?.uid; // Get user ID from Firebase Auth middleware

  if (!userId) {
    return res.status(403).json({ error: "User authentication required." });
  }
  try {
    await deleteWebhook(webhookId, userId);
    res.status(204).send(); // No content on successful deletion
  } catch (error: any) {
    console.error(`Error deleting webhook ${webhookId} for user ${userId}:`, error);
    if (error.message.includes('Forbidden') || error.message.includes('not found')) {
      res.status(403).json({ error: 'Failed to delete webhook. Check ownership and ID.', message: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete webhook.', message: error.message });
    }
  }
});

// Internal testing route for dispatching webhook events
// This route is protected by API key authentication (authMiddleware)
app.post('/api/_test/dispatch-event', authMiddleware, async (req: AuthenticatedRequest, res) => {
  if (!req.user || !req.user.id) { // user.id here comes from API key's associated user
    return res.status(403).json({ error: "User authentication required via API key." });
  }

  const { eventName, payload, userIdOverride, jobId } = req.body;

  // Validate eventName
  if (!eventName || typeof eventName !== 'string') {
    return res.status(400).json({ error: "eventName (string) is required in the request body." });
  }
  const validEventNamesFromModel: WebhookEventName[] = ['document.parsed', 'document.failed', 'job.status.updated'];
  if (!validEventNamesFromModel.includes(eventName as WebhookEventName)) {
    return res.status(400).json({ error: `Invalid eventName: ${eventName}. Valid events are: ${validEventNamesFromModel.join(', ')}` });
  }

  // Validate payload
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: "payload (object) is required in the request body." });
  }

  const targetUserId = userIdOverride || req.user.id;

  try {
    // Dynamically import dispatchWebhookEvent as it might not always be needed
    const { dispatchWebhookEvent } = await import('./services/webhookService');
    await dispatchWebhookEvent(targetUserId, eventName as WebhookEventName, payload, jobId);

    res.status(200).json({
      message: `Test event '${eventName}' dispatched for user ${targetUserId}.`,
      userIdUsed: targetUserId,
      jobIdSent: jobId,
      payloadSent: payload
    });
  } catch (error: any) {
    console.error(`Error dispatching test webhook event for user ${targetUserId}:`, error);
    res.status(500).json({ error: "Failed to dispatch test webhook event.", message: error.message });
  }
});

// Need to import admin for the user lookup in POST /api/keys
import * as admin from 'firebase-admin';
if (!admin.apps.length) { // Ensure Firebase is initialized
  admin.initializeApp();
}

export default app;
