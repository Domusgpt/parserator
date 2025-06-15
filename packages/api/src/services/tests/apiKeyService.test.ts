// packages/api/src/services/tests/apiKeyService.test.ts
import * as mockFirebaseAdmin from 'firebase-admin'; // Mock firebase-admin
import bcrypt from 'bcrypt';
import {
  generateApiKeyString,
  createApiKey,
  validateApiKey,
  listApiKeysForUser,
  deleteApiKeyForUser,
  // createUser, // Assuming createUser is tested elsewhere or less critical for this task focus
  // getUserById, // Assuming getUserById is tested elsewhere or implicitly by validateApiKey tests
} from '../apiKeyService';
import { ApiKey, User } // Assuming User model is relevant for context
from '../../models';

jest.mock('firebase-admin', () => {
  const actualFirebaseAdmin = jest.requireActual('firebase-admin');
  return {
    ...actualFirebaseAdmin,
    initializeApp: jest.fn(),
    firestore: jest.fn().mockReturnValue({
      collection: jest.fn(),
      doc: jest.fn(),
      // Add other Firestore methods if needed globally by services
    }),
    // Mock other Firebase services if needed
  };
});
jest.mock('bcrypt');

describe('ApiKeyService', () => {
  let mockCollection: jest.Mock;
  let mockDoc: jest.Mock;
  let mockAdd: jest.Mock;
  let mockGet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockWhere: jest.Mock;
  let mockOrderBy: jest.Mock;

  beforeEach(() => {
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
      get: mockGet, // For collection-level .get() if used by where().get()
    }));

    // @ts-ignore
    mockFirebaseAdmin.firestore.mockReturnValue({
      collection: mockCollection,
      doc: mockDoc,
      // If transactions are used:
      // runTransaction: jest.fn(async (updateFunction) => {
      //   const mockTransaction = { get: mockGet, update: mockUpdate, create: mockAdd, delete: mockDelete };
      //   return updateFunction(mockTransaction);
      // }),
    });

    // Reset bcrypt mocks
    (bcrypt.hash as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
  });

  describe('generateApiKeyString', () => {
    it('should generate a live key with "pk_live_" prefix and hash it', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_live_key');
      const result = await generateApiKeyString(true);
      expect(result.apiKey).toMatch(/^pk_live_/);
      expect(result.hashedKey).toBe('hashed_live_key');
      expect(result.keyPrefix).toBe('pk_live_');
      expect(bcrypt.hash).toHaveBeenCalledWith(result.apiKey, expect.any(Number));
    });

    it('should generate a test key with "pk_test_" prefix and hash it', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_test_key');
      const result = await generateApiKeyString(false);
      expect(result.apiKey).toMatch(/^pk_test_/);
      expect(result.hashedKey).toBe('hashed_test_key');
      expect(result.keyPrefix).toBe('pk_test_');
      expect(bcrypt.hash).toHaveBeenCalledWith(result.apiKey, expect.any(Number));
    });
  });

  describe('createApiKey', () => {
    it('should create and store an API key correctly', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_api_key');
      mockAdd.mockResolvedValue({ id: 'newKeyId' });

      const userId = 'user123';
      const keyName = 'Test Key';
      const isLive = true;
      const tier = 'free';
      const { apiKeyString, apiKeyDocument } = await createApiKey(userId, keyName, isLive, tier);

      expect(apiKeyString).toMatch(/^pk_live_/);
      expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        keyHash: 'hashed_api_key',
        keyPrefix: 'pk_live_',
        name: keyName,
        isActive: true,
        tierWhenCreated: tier,
      }));
      expect(apiKeyDocument.id).toBe('newKeyId');
      expect(apiKeyDocument.name).toBe(keyName);
    });
  });

  describe('validateApiKey', () => {
    it('should return API key document for a valid and active key', async () => {
      const mockKeyDoc = {
        id: 'key123',
        userId: 'user123',
        keyHash: 'hashed_valid_key',
        keyPrefix: 'pk_live_',
        isActive: true,
        // ... other fields
      };
      mockWhere.mockReturnThis(); // for where('keyPrefix'...)
      mockGet.mockResolvedValue({ empty: false, docs: [{ id: 'key123', data: () => mockKeyDoc }] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await validateApiKey('pk_live_valid_key_string');
      expect(result).toEqual(expect.objectContaining(mockKeyDoc));
      expect(mockCollection).toHaveBeenCalledWith('apiKeys');
      expect(mockWhere).toHaveBeenCalledWith('keyPrefix', '==', 'pk_live_');
      expect(bcrypt.compare).toHaveBeenCalledWith('pk_live_valid_key_string', 'hashed_valid_key');
    });

    it('should return null for an invalid API key format (no prefix)', async () => {
      const result = await validateApiKey('invalidkey');
      expect(result).toBeNull();
      expect(mockCollection).not.toHaveBeenCalled();
    });

    it('should return null if no key matches the prefix', async () => {
      mockWhere.mockReturnThis();
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      const result = await validateApiKey('pk_live_nonexistent_key');
      expect(result).toBeNull();
    });

    it('should return null if bcrypt.compare is false', async () => {
      const mockKeyDoc = { keyHash: 'hashed_key', isActive: true, keyPrefix: 'pk_live_' };
      mockWhere.mockReturnThis();
      mockGet.mockResolvedValue({ empty: false, docs: [{ id: 'key123', data: () => mockKeyDoc }] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await validateApiKey('pk_live_wrong_secret_part');
      expect(result).toBeNull();
    });

    it('should return null for an inactive API key', async () => {
      const mockKeyDoc = { keyHash: 'hashed_key', isActive: false, keyPrefix: 'pk_live_' };
      mockWhere.mockReturnThis();
      mockGet.mockResolvedValue({ empty: false, docs: [{ id: 'key123', data: () => mockKeyDoc }] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Key string matches, but inactive
      const result = await validateApiKey('pk_live_inactive_key');
      expect(result).toBeNull();
    });
  });

  describe('listApiKeysForUser', () => {
    it('should return a list of API keys for the user, excluding sensitive data', async () => {
      const userId = 'user123';
      const mockKeys = [
        { id: 'key1', name: 'Key 1', keyPrefix: 'pk_live_', keyHash: 'hash1', otherData: 'sensitive1', userId },
        { id: 'key2', name: 'Key 2', keyPrefix: 'pk_test_', keyHash: 'hash2', otherData: 'sensitive2', userId },
      ];
      mockWhere.mockReturnThis(); // for where('userId'...)
      mockGet.mockResolvedValue({ empty: false, docs: mockKeys.map(k => ({ id: k.id, data: () => k })) });

      const result = await listApiKeysForUser(userId);
      expect(result.length).toBe(2);
      expect(result[0]).not.toHaveProperty('keyHash');
      expect(result[0]).not.toHaveProperty('otherData'); // Assuming otherData is not in the return type
      expect(result[0]).toHaveProperty('name', 'Key 1');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', userId);
    });

    it('should return an empty array if the user has no API keys', async () => {
      mockWhere.mockReturnThis();
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      const result = await listApiKeysForUser('userWithNoKeys');
      expect(result).toEqual([]);
    });
  });

  describe('deleteApiKeyForUser', () => {
    const userId = 'user123';
    const keyId = 'keyToDelete';

    it('should delete an API key if it exists and is owned by the user', async () => {
      mockGet.mockResolvedValue({ exists: true, data: () => ({ userId }) });
      mockDelete.mockResolvedValue(undefined); // Simulate successful deletion

      await deleteApiKeyForUser(keyId, userId);
      expect(mockDoc).toHaveBeenCalledWith(keyId);
      expect(mockGet).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw "API key not found." if the key does not exist', async () => {
      mockGet.mockResolvedValue({ exists: false });
      await expect(deleteApiKeyForUser(keyId, userId)).rejects.toThrow('API key not found.');
    });

    it('should throw "Forbidden..." if the user does not own the API key', async () => {
      mockGet.mockResolvedValue({ exists: true, data: () => ({ userId: 'otherUser' }) });
      await expect(deleteApiKeyForUser(keyId, userId)).rejects.toThrow('Forbidden: User does not own this API key.');
    });
  });
});
