// packages/api/integrationTests/api.integration.test.ts
import request from 'supertest';
import expressApp from '../src/app'; // Assuming default export from app.ts is the express app
import * as mockFirebaseAdmin from 'firebase-admin';
import axios from 'axios'; // For mocking webhook dispatches

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => {
  const actualFirebaseAdmin = jest.requireActual('firebase-admin');
  return {
    ...actualFirebaseAdmin,
    initializeApp: jest.fn(),
    auth: jest.fn(() => ({ // Mock Firebase Auth for firebaseAuthMiddleware
      verifyIdToken: jest.fn(),
    })),
    firestore: jest.fn().mockReturnValue({ // Mock Firestore
      // Basic Firestore mock structure, expand as needed for actual DB interactions in tests
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      add: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      runTransaction: jest.fn(async (updateFunction) => { // Mock transaction
        const mockTransaction = {
          get: jest.fn(),
          update: jest.fn(),
          create: jest.fn(),
          delete: jest.fn()
        };
        // You might need to make mockTransaction.get/update etc. more specific based on usage
        return updateFunction(mockTransaction);
      }),
      FieldValue: {
        increment: jest.fn(val => `increment(${val})`),
      },
      Timestamp: actualFirebaseAdmin.firestore.Timestamp,
    }),
  };
});

// Mock axios for webhook dispatch tests
jest.mock('axios');

describe('API Integration Tests', () => {
  let createdApiKey: string; // To store API key created during tests
  let createdUserId: string = 'test-firebase-user-123'; // Mocked Firebase User ID
  let createdKeyId: string;
  let createdWebhookId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for Firebase Auth token verification
    // @ts-ignore
    mockFirebaseAdmin.auth().verifyIdToken.mockResolvedValue({ uid: createdUserId, email: 'test@example.com' });
    // Default mock for axios.post (webhook dispatches)
    // @ts-ignore
    (axios.post as jest.Mock).mockResolvedValue({ status: 200, data: 'OK' });
  });

  describe('API Key Authentication & Authorization', () => {
    // For these tests, we'd need a protected route. Let's assume /v1/me is one.
    // We also need to ensure an API key and user exist in the mock DB for `authMiddleware` to succeed.

    it('should allow access to a protected route with a valid API key', async () => {
      // 1. Setup: Mock validateApiKey to return a valid key & user for authMiddleware
      // This might involve deeper mocking of apiKeyService or firestore within authMiddleware's scope
      // For a true integration test, you'd let authMiddleware hit the (mocked) DB.
      // For this outline, we'll assume authMiddleware can be made to work with mocked Firestore.
      // e.g. mockFirestore.collection('apiKeys').where().get() to return a valid key
      // and mockFirestore.collection('users').doc().get() to return a valid user.

      // This test would be more about `authMiddleware` itself.
      // const response = await request(expressApp)
      //   .get('/v1/me') // Assuming /v1/me is protected by authMiddleware
      //   .set('Authorization', `Bearer ${/* A pre-existing or test-generated valid API key */}`);
      // expect(response.status).toBe(200);
      // expect(response.body).toHaveProperty('user');
      pending('Requires complex setup of authMiddleware with mocked Firestore for API key validation.');
    });

    it('should deny access with an invalid API key (401)', async () => {
      // const response = await request(expressApp)
      //   .get('/v1/me')
      //   .set('Authorization', 'Bearer invalid-api-key');
      // expect(response.status).toBe(401);
      pending('Test for invalid key');
    });

    it('should deny access with a missing API key (401)', async () => {
      // const response = await request(expressApp)
      //   .get('/v1/me');
      // expect(response.status).toBe(401);
      pending('Test for missing key');
    });

    it('should deny access with an inactive API key (401)', async () => {
      // Setup mock DB to have the key but isActive: false
      pending('Test for inactive key');
    });
  });

  describe('API Key Management (/api/keys)', () => {
    // These endpoints are protected by firebaseAuthMiddleware
    const mockUserToken = 'mock-firebase-id-token'; // Passed in X-Firebase-Token

    it('POST /api/keys - should create a new API key', async () => {
      // Mock Firestore 'users.doc(createdUserId).get()' to return a user with a tier
      // @ts-ignore
      mockFirebaseAdmin.firestore().doc.mockReturnValue({
          get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ subscriptionTier: 'free', email: 'test@example.com' })
          })
      });
      // Mock Firestore 'apiKeys.add()' to simulate successful creation
      // @ts-ignore
      mockFirebaseAdmin.firestore().add.mockResolvedValue({ id: 'new-test-key-id' });

      const response = await request(expressApp)
        .post('/api/keys')
        .set('X-Firebase-Token', mockUserToken) // Simulate Firebase Auth
        .send({ keyName: 'My Test Key', isLive: true });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('apiKey'); // Full key string
      expect(response.body.apiKey).toMatch(/^pk_live_/);
      expect(response.body.keyDetails).toHaveProperty('id', 'new-test-key-id');
      expect(response.body.keyDetails).toHaveProperty('name', 'My Test Key');
      createdApiKey = response.body.apiKey; // Save for other tests if needed
      createdKeyId = response.body.keyDetails.id;
    });

    it('GET /api/keys - should list API keys for the user', async () => {
      // Mock Firestore 'apiKeys.where().get()'
      // @ts-ignore
      mockFirebaseAdmin.firestore().get.mockResolvedValue({
        empty: false,
        docs: [{ id: createdKeyId || 'some-key-id', data: () => ({ name: 'My Test Key', keyPrefix: 'pk_live_', userId: createdUserId }) }]
      });

      const response = await request(expressApp)
        .get('/api/keys')
        .set('X-Firebase-Token', mockUserToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1); // Assuming key from previous test exists
      expect(response.body[0]).not.toHaveProperty('apiKeyString'); // Full key should not be listed
      expect(response.body[0]).not.toHaveProperty('keyHash');
    });

    it('DELETE /api/keys/:keyId - should delete an API key', async () => {
      // Mock Firestore 'apiKeys.doc().get()' to find the key
      // @ts-ignore
      mockFirebaseAdmin.firestore().get.mockResolvedValue({ exists: true, data: () => ({ userId: createdUserId }) });
      // Mock Firestore 'apiKeys.doc().delete()'
      // @ts-ignore
      mockFirebaseAdmin.firestore().delete.mockResolvedValue({});

      const response = await request(expressApp)
        .delete(`/api/keys/${createdKeyId || 'some-key-id'}`)
        .set('X-Firebase-Token', mockUserToken);

      expect(response.status).toBe(204);
    });

    it('DELETE /api/keys/:keyId - should return error when deleting another user\'s key', async () => {
      // Mock Firestore 'apiKeys.doc().get()' to find the key but with a different userId
      // @ts-ignore
      mockFirebaseAdmin.firestore().get.mockResolvedValue({ exists: true, data: () => ({ userId: 'another-user-id' }) });

      const response = await request(expressApp)
        .delete('/api/keys/key-of-another-user')
        .set('X-Firebase-Token', mockUserToken);
      expect(response.status).toBe(403); // Or based on actual error handling
    });
  });

  describe('Usage Limits & Rate Limiting (via authMiddleware)', () => {
    // These tests require authMiddleware to be fully functional with mocked usageService/Firestore
    it('should return 429 if per-minute rate limit exceeded', async () => {
      // 1. Create a key, or have one ready.
      // 2. Mock usageService.checkAndIncrementUsage to return { allowed: false, retryAfterSeconds: X }
      //    This means mocking the Firestore calls within usageService.
      // 3. Make a request to a protected endpoint (e.g., /v1/me)
      pending('Requires complex mocking of usageService within authMiddleware.');
    });

    it('should return 429 if monthly quota exceeded', async () => {
      // Similar to above, but mock for monthly limit.
      pending('Requires complex mocking of usageService within authMiddleware.');
    });
  });

  describe('Webhook Management (/api/webhooks)', () => {
    const mockUserToken = 'mock-firebase-id-token-for-webhooks';

    it('POST /api/webhooks - should create a new webhook', async () => {
      // @ts-ignore
      mockFirebaseAdmin.firestore().add.mockResolvedValue({ id: 'new-webhook-id-123' });
      const response = await request(expressApp)
        .post('/api/webhooks')
        .set('X-Firebase-Token', mockUserToken)
        .send({ targetUrl: 'https://mywebhookreceiver.com/hook', eventNames: ['document.parsed'] });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'new-webhook-id-123');
      expect(response.body).toHaveProperty('secretKey'); // Secret is returned once on creation
      createdWebhookId = response.body.id;
    });

    it('GET /api/webhooks - should list webhooks for the user (no secrets)', async () => {
      // @ts-ignore
      mockFirebaseAdmin.firestore().get.mockResolvedValue({
        empty: false,
        docs: [{ id: createdWebhookId || 'wh-id', data: () => ({ targetUrl: 'https://mywebhookreceiver.com/hook', eventNames: ['document.parsed'], userId: createdUserId, secretKey: 'supersecret' }) }]
      });
      const response = await request(expressApp)
        .get('/api/webhooks')
        .set('X-Firebase-Token', mockUserToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).not.toHaveProperty('secretKey');
    });

    it('DELETE /api/webhooks/:webhookId - should delete a webhook', async () => {
      // @ts-ignore
      mockFirebaseAdmin.firestore().get.mockResolvedValue({ exists: true, data: () => ({ userId: createdUserId }) });
      // @ts-ignore
      mockFirebaseAdmin.firestore().delete.mockResolvedValue({});
      const response = await request(expressApp)
        .delete(`/api/webhooks/${createdWebhookId || 'wh-id'}`)
        .set('X-Firebase-Token', mockUserToken);
      expect(response.status).toBe(204);
    });
  });

  describe('Webhook Dispatch (Internal Test Route - /api/_test/dispatch-event)', () => {
    // This route uses API Key auth (authMiddleware)
    // We need a valid API key for the 'Authorization' header.
    // The creation of this key itself might be part of a setup block or a previous test.
    // For now, let's assume `createdApiKey` holds a string like "pk_live_xxxxxxxx"
    // and `authMiddleware` is set up to validate it (e.g. by mocking apiKeyService.validateApiKey)

    it('should dispatch an event and trigger mocked axios.post', async () => {
      // Mock that the API key used for auth is valid and belongs to createdUserId
      // This means apiKeyService.validateApiKey and apiKeyService.getUserById need to be mocked
      // if we are not relying on the actual DB state from previous /api/keys tests.
      // For simplicity in this outline, we assume `createdApiKey` would be validated.

      // Mock firestore for dispatchWebhookEvent to find the webhook created above
      // @ts-ignore
      mockFirebaseAdmin.firestore().get.mockResolvedValueOnce({ // For listUserWebhooks in dispatchWebhookEvent
        empty: false,
        docs: [{
          id: createdWebhookId || 'wh-id-for-dispatch',
          data: () => ({
            targetUrl: 'https://finaldestination.com/hook',
            eventNames: ['document.parsed'],
            userId: createdUserId,
            secretKey: 'a-secret-for-signing',
            isActive: true,
          })
        }]
      });
      // Mock for update (lastDispatchAt)
      // @ts-ignore
      mockFirebaseAdmin.firestore().update.mockResolvedValue({});


      const eventPayload = { data: 'test content', documentId: 'doc-xyz' };
      const response = await request(expressApp)
        .post('/api/_test/dispatch-event')
        .set('Authorization', `Bearer ${createdApiKey || 'pk_live_dummykeyfortest'}`) // Use a key known to be valid for createdUserId
        .send({
          eventName: 'document.parsed',
          payload: eventPayload,
          // userIdOverride: createdUserId, // Optional: test with this too
          jobId: 'job-abc'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain(`Test event 'document.parsed' dispatched for user ${createdUserId}`);

      expect(axios.post).toHaveBeenCalledWith(
        'https://finaldestination.com/hook',
        expect.stringContaining('doc-xyz'), // Payload is stringified
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Parserator-Signature-256': expect.any(String) // HMAC signature
          })
        })
      );
    });
  });

});
