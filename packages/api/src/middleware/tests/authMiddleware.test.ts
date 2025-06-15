// packages/api/src/middleware/tests/authMiddleware.test.ts
import { Response, NextFunction } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../authMiddleware'; // Adjust path
import * as apiKeyService from '../../services/apiKeyService'; // Adjust path
import { User, ApiKey } from '../../models'; // Adjust path

// Mock apiKeyService
jest.mock('../../services/apiKeyService');

const mockValidateApiKey = apiKeyService.validateApiKey as jest.Mock;
const mockGetUserById = apiKeyService.getUserById as jest.Mock;

describe('AuthMiddleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if Authorization header is missing', async () => {
    await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Missing or malformed Authorization header'),
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header is malformed (not Bearer)', async () => {
    mockReq.headers = { authorization: 'Basic somekey' };
    await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Missing or malformed Authorization header'),
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if API key is missing after Bearer', async () => {
    mockReq.headers = { authorization: 'Bearer ' };
    await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Unauthorized: API key is missing from Authorization header.',
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if validateApiKey returns null', async () => {
    mockReq.headers = { authorization: 'Bearer testkey' };
    mockValidateApiKey.mockResolvedValue(null);
    await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(mockValidateApiKey).toHaveBeenCalledWith('testkey');
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Unauthorized: Invalid or inactive API key provided.',
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 if getUserById returns null (user not found or inactive)', async () => {
    mockReq.headers = { authorization: 'Bearer validkey' };
    const mockApiKeyDoc = { userId: 'user1', id: 'apikey1' } as ApiKey & { id: string };
    mockValidateApiKey.mockResolvedValue(mockApiKeyDoc);
    mockGetUserById.mockResolvedValue(null);

    await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockValidateApiKey).toHaveBeenCalledWith('validkey');
    expect(mockGetUserById).toHaveBeenCalledWith('user1');
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Forbidden: User account associated with the API key is inactive or not found.',
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next and populate req.user and req.apiKey on successful authentication', async () => {
    const providedKey = 'validkey123';
    mockReq.headers = { authorization: `Bearer ${providedKey}` };

    const mockApiKeyDocument = {
        id: 'key123',
        userId: 'user123',
        name: 'Test Key',
        // ... other ApiKey fields
    } as ApiKey & { id: string };
    mockValidateApiKey.mockResolvedValue(mockApiKeyDocument);

    const mockUserDocument = {
        id: 'user123',
        email: 'test@example.com',
        subscriptionTier: 'free',
        // ... other User fields
    } as User & { id: string };
    mockGetUserById.mockResolvedValue(mockUserDocument);

    await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockValidateApiKey).toHaveBeenCalledWith(providedKey);
    expect(mockGetUserById).toHaveBeenCalledWith(mockApiKeyDocument.userId);
    expect(mockReq.user).toEqual(mockUserDocument);
    expect(mockReq.apiKey).toEqual(mockApiKeyDocument);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should return 500 on critical error during validation', async () => {
    mockReq.headers = { authorization: 'Bearer testkey' };
    mockValidateApiKey.mockRejectedValue(new Error('Firestore unavailable'));

    await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Internal Server Error: An unexpected error occurred during authentication.',
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });
});
