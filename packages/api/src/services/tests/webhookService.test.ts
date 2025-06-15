// packages/api/src/services/tests/webhookService.test.ts
import * as mockFirebaseAdmin from 'firebase-admin';
import axios from 'axios';
import crypto from 'crypto';
import {
  createWebhook,
  listUserWebhooks,
  deleteWebhook,
  dispatchWebhookEvent,
} from '../webhookService';
import { Webhook, WebhookEventName } from '../../models';

jest.mock('firebase-admin', () => {
  const actualFirebaseAdmin = jest.requireActual('firebase-admin');
  return {
    ...actualFirebaseAdmin,
    initializeApp: jest.fn(),
    firestore: jest.fn().mockReturnValue({
      collection: jest.fn(),
      doc: jest.fn(),
      Timestamp: actualFirebaseAdmin.firestore.Timestamp,
    }),
  };
});
jest.mock('axios');
jest.mock('crypto', () => {
  const originalCrypto = jest.requireActual('crypto');
  const mockHmac = {
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'fixedhmacsignature256'),
  };
  return {
    ...originalCrypto,
    randomBytes: jest.fn(() => Buffer.from('fixedrandombytes12345678')),
    createHmac: jest.fn(() => mockHmac),
  };
});


describe('WebhookService', () => {
  let mockCollection: jest.Mock;
  let mockDoc: jest.Mock;
  let mockAdd: jest.Mock;
  let mockGet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockWhere: jest.Mock;
  let mockOrderBy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAdd = jest.fn();
    mockGet = jest.fn();
    mockUpdate = jest.fn();
    mockDelete = jest.fn();
    mockWhere = jest.fn().mockReturnThis();
    mockOrderBy = jest.fn().mockReturnThis();

    mockDoc = jest.fn(() => ({
      get: mockGet,
      update: mockUpdate,
      delete: mockDelete,
    }));

    mockCollection = jest.fn(() => ({
      add: mockAdd,
      doc: mockDoc,
      where: mockWhere,
      orderBy: mockOrderBy,
      get: mockGet,
    }));

    // @ts-ignore
    mockFirebaseAdmin.firestore.mockReturnValue({
      collection: mockCollection,
      doc: mockDoc,
    });
    // @ts-ignore
    (axios.post as jest.Mock).mockResolvedValue({ status: 200, data: 'OK' });
    // @ts-ignore
    (crypto.createHmac().update as jest.Mock).mockClear();
    // @ts-ignore
    (crypto.createHmac().digest as jest.Mock).mockClear();
  });

  describe('createWebhook', () => {
    it('should create a webhook with a generated secret and store it', async () => {
      mockAdd.mockResolvedValue({ id: 'newWebhookId' });
      const userId = 'user123';
      const targetUrl = 'https://example.com/webhook';
      const eventNames: WebhookEventName[] = ['document.parsed'];

      const result = await createWebhook(userId, targetUrl, eventNames);

      expect(result.id).toBe('newWebhookId');
      expect(result.userId).toBe(userId);
      expect(result.targetUrl).toBe(targetUrl);
      expect(result.eventNames).toEqual(eventNames);
      expect(result.secretKey).toBe('whsec_666978656472616e646f6d62797465733132333435363738'); // from mocked crypto.randomBytes
      expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        targetUrl,
        eventNames,
        secretKey: 'whsec_666978656472616e646f6d62797465733132333435363738',
        isActive: true,
        createdAt: expect.any(mockFirebaseAdmin.firestore.Timestamp),
      }));
    });

    it('should throw error for invalid target URL', async () => {
      await expect(createWebhook('user123', 'invalid-url', ['document.parsed'])).rejects.toThrow('Invalid target URL for webhook.');
    });

    it('should throw error if eventNames is empty', async () => {
      await expect(createWebhook('user123', 'https://example.com/webhook', [])).rejects.toThrow('At least one event name must be subscribed to.');
    });
  });

  describe('listUserWebhooks', () => {
    it('should return active webhooks for a user', async () => {
      const userId = 'user123';
      const mockWebhookData = { userId, isActive: true, targetUrl: 'https://example.com', eventNames: ['document.parsed'], secretKey: 's', createdAt: mockFirebaseAdmin.firestore.Timestamp.now() };
      mockWhere.mockImplementation((field: string, op: string, value: any) => {
        if (field === 'userId' && value === userId) return mockWhere;
        if (field === 'isActive' && value === true) return mockWhere;
        return mockWhere;
      });
      mockGet.mockResolvedValue({ docs: [{ id: 'wh1', data: () => mockWebhookData }] });

      const result = await listUserWebhooks(userId);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('wh1');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', userId);
      expect(mockWhere).toHaveBeenCalledWith('isActive', '==', true);
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook if owned by the user', async () => {
      const userId = 'user123';
      const webhookId = 'whToDelete';
      mockGet.mockResolvedValue({ exists: true, data: () => ({ userId }) });
      mockDelete.mockResolvedValue(undefined);

      await deleteWebhook(webhookId, userId);
      expect(mockDoc).toHaveBeenCalledWith(webhookId);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw if webhook not found', async () => {
      mockGet.mockResolvedValue({ exists: false });
      await expect(deleteWebhook('whNotFound', 'user123')).rejects.toThrow('Webhook not found.');
    });

    it('should throw if user does not own the webhook', async () => {
      mockGet.mockResolvedValue({ exists: true, data: () => ({ userId: 'otherUser' }) });
      await expect(deleteWebhook('whOtherUser', 'user123')).rejects.toThrow('Forbidden: You do not own this webhook.');
    });
  });

  describe('dispatchWebhookEvent', () => {
    const userId = 'userDispatcher';
    const eventName: WebhookEventName = 'document.parsed';
    const payload = { documentId: 'doc1', status: 'parsed' };
    const mockActiveWebhook: Webhook & {id: string} = {
      id: 'whActive',
      userId,
      targetUrl: 'https://active.example.com/hook',
      eventNames: [eventName],
      secretKey: 'whsec_activesecret',
      isActive: true,
      createdAt: mockFirebaseAdmin.firestore.Timestamp.now(),
    };

    beforeEach(() => {
      mockWhere.mockReturnValue({ // Ensure where().where().where().get() chain works
          where: mockWhere,
          orderBy: mockOrderBy, // if orderBy is used
          get: mockGet
      });
      mockGet.mockResolvedValue({ empty: false, docs: [{ id: mockActiveWebhook.id, data: () => mockActiveWebhook }] });
    });

    it('should fetch correct webhooks and send event with signature', async () => {
      await dispatchWebhookEvent(userId, eventName, payload, 'job123');

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', userId);
      expect(mockWhere).toHaveBeenCalledWith('eventNames', 'array-contains', eventName);
      expect(mockWhere).toHaveBeenCalledWith('isActive', '==', true);

      expect(axios.post).toHaveBeenCalledTimes(1);
      const expectedEventDataMatcher = expect.objectContaining({
        eventName,
        jobId: 'job123',
        data: payload,
        eventId: expect.stringMatching(/^evt_/),
        timestamp: expect.any(String),
      });
      const stringifiedPayload = JSON.stringify(expectedEventDataMatcher);

      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', mockActiveWebhook.secretKey);
      // @ts-ignore
      expect(crypto.createHmac().update).toHaveBeenCalledWith(expect.jsonMatching(expectedEventDataMatcher));
      // @ts-ignore
      expect(crypto.createHmac().digest).toHaveBeenCalledWith('hex');

      expect(axios.post).toHaveBeenCalledWith(
        mockActiveWebhook.targetUrl,
        expect.jsonMatching(expectedEventDataMatcher),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-Parserator-Signature-256': 'fixedhmacsignature256',
          },
        })
      );
      expect(mockDoc).toHaveBeenCalledWith(mockActiveWebhook.id);
      expect(mockUpdate).toHaveBeenCalledWith({ lastDispatchAt: expect.any(mockFirebaseAdmin.firestore.Timestamp) });
    });

    it('should not send if no webhooks are found for the event/user', async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      await dispatchWebhookEvent(userId, 'document.failed', payload);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should handle axios.post failure and attempt retries', async () => {
      (axios.post as jest.Mock)
        .mockRejectedValueOnce(new Error('Network Error 1'))
        .mockRejectedValueOnce(new Error('Network Error 2'))
        .mockResolvedValue({ status: 200, data: 'OK' });

      jest.useFakeTimers(); // Use fake timers for setTimeout
      const dispatchPromise = dispatchWebhookEvent(userId, eventName, payload);
      // Advance timers to trigger retries. MAX_WEBHOOK_RETRIES is 3, so 4 attempts total.
      // sendWithRetries has RETRY_DELAY_MS.
      await jest.advanceTimersByTimeAsync(1000 * 60 * 1); // 1st retry
      await jest.advanceTimersByTimeAsync(1000 * 60 * 1); // 2nd retry
      // Not advancing for the 3rd retry as it should succeed
      await dispatchPromise; // Wait for all async operations in dispatch to complete
      jest.useRealTimers();

      expect(axios.post).toHaveBeenCalledTimes(3);
      expect(mockUpdate).toHaveBeenCalledWith({ lastDispatchAt: expect.any(mockFirebaseAdmin.firestore.Timestamp) });
      expect(mockUpdate).toHaveBeenCalledWith({ lastFailureAt: expect.any(mockFirebaseAdmin.firestore.Timestamp) });
      expect(mockUpdate).toHaveBeenCalledTimes(3); // 2 failures, 1 success
    });

    it('should throw and mark lastFailureAt if all retries fail', async () => {
        (axios.post as jest.Mock).mockRejectedValue(new Error('Persistent Network Error'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.useFakeTimers();
        const dispatchPromise = dispatchWebhookEvent(userId, eventName, payload);
        // Advance timers for all retries
        await jest.advanceTimersByTimeAsync(1000 * 60 * 1); // 1st retry
        await jest.advanceTimersByTimeAsync(1000 * 60 * 1); // 2nd retry
        await jest.advanceTimersByTimeAsync(1000 * 60 * 1); // 3rd retry
        await dispatchPromise;
        jest.useRealTimers();

        expect(axios.post).toHaveBeenCalledTimes(4);
        expect(mockUpdate).toHaveBeenCalledWith({ lastFailureAt: expect.any(mockFirebaseAdmin.firestore.Timestamp) });
        expect(mockUpdate).toHaveBeenCalledTimes(4); // 4 failures
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Webhook ${mockActiveWebhook.id} failed permanently`), expect.any(Error));
        consoleErrorSpy.mockRestore();
      });
  });
});

expect.extend({
    jsonMatching(received, argument) {
      if (typeof received !== 'string') {
        return { message: () => `expected string, received ${typeof received}`, pass: false };
      }
      try {
        const parsedReceived = JSON.parse(received);
        expect(parsedReceived).toEqual(argument);
        return { message: () => `expected ${received} not to be JSON matching ${argument}`, pass: true };
      } catch (e) {
        return { message: () => `expected ${received} to be valid JSON. Error: ${e.message}`, pass: false };
      }
    },
  });
