/**
 * Rate Limiting Tests for Parserator API
 * Tests RPM, daily, and monthly limits with mocked Firestore
 */

import { Request, Response } from 'express';

// Mock Firestore first
const mockGet = jest.fn();
const mockDoc = jest.fn(() => ({
  get: mockGet,
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: mockGet
    }))
  }))
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc
}));
const mockFirestore = {
  collection: mockCollection
};

jest.mock('firebase-admin', () => ({
  firestore: () => mockFirestore
}));

import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware';

describe('Rate Limiting Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      headers: { 'x-forwarded-for': '192.168.1.1' },
      connection: { remoteAddress: '192.168.1.1' } as any
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('Anonymous User RPM Limits', () => {
    it('should allow requests within RPM limit', async () => {
      (req as any).userTier = 'anonymous';
      
      // First request should pass
      await rateLimitMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block requests exceeding RPM limit', async () => {
      (req as any).userTier = 'anonymous';
      
      // Simulate 6 requests in same minute (limit is 5)
      for (let i = 0; i < 6; i++) {
        jest.clearAllMocks();
        await rateLimitMiddleware(req as Request, res as Response, next);
      }
      
      // 6th request should be blocked
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Rate limit exceeded',
          message: 'RPM limit of 5 exceeded'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated User Daily Limits', () => {
    beforeEach(() => {
      (req as any).userTier = 'free';
      (req as any).userId = 'user123';
    });

    it('should allow requests within daily limit', async () => {
      // Mock daily usage below limit
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ requests: 25 }) // Below limit of 50
      });

      await rateLimitMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should block requests exceeding daily limit', async () => {
      // Mock daily usage at limit and monthly usage (within limit)
      mockGet
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ requests: 50 }) // At daily limit of 50
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ monthly: { '2025-06': { requests: 100 } } })
        });

      await rateLimitMiddleware(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Daily limit exceeded',
          tier: 'free'
        })
      );
    });
  });

  describe('Authenticated User Monthly Limits', () => {
    beforeEach(() => {
      (req as any).userTier = 'free';
      (req as any).userId = 'user123';
    });

    it('should block requests exceeding monthly limit', async () => {
      // Mock daily usage (within limit) and monthly usage at limit
      mockGet
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ requests: 25 }) // Within daily limit
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ monthly: { '2025-06': { requests: 1000 } } }) // At monthly limit
        });

      await rateLimitMiddleware(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Monthly limit exceeded',
          tier: 'free'
        })
      );
    });
  });

  describe('Enterprise User (Unlimited)', () => {
    beforeEach(() => {
      (req as any).userTier = 'enterprise';
      (req as any).userId = 'enterprise-user';
    });

    it('should allow unlimited requests', async () => {
      await rateLimitMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Fail-Closed Behavior', () => {
    beforeEach(() => {
      (req as any).userTier = 'free';
      (req as any).userId = 'user123';
    });

    it('should deny request when Firestore is unavailable', async () => {
      // Mock Firestore error
      mockGet.mockRejectedValue(new Error('Firestore unavailable'));

      await rateLimitMiddleware(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Rate limiting service unavailable'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('IP-based Rate Limiting for Anonymous Users', () => {
    it('should use IP address for anonymous user identification', async () => {
      (req as any).userTier = 'anonymous';
      req.headers = { 'x-forwarded-for': '10.0.0.1' };
      
      await rateLimitMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      
      // Same IP should share rate limit
      jest.clearAllMocks();
      await rateLimitMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should handle different IPs separately', async () => {
      (req as any).userTier = 'anonymous';
      req.headers = { 'x-forwarded-for': '10.0.0.1' };
      
      // First IP - 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        jest.clearAllMocks();
        await rateLimitMiddleware(req as Request, res as Response, next);
      }
      expect(next).toHaveBeenCalled(); // 5th request should pass
      
      // Different IP should have separate limit
      req.headers = { 'x-forwarded-for': '10.0.0.2' };
      jest.clearAllMocks();
      await rateLimitMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled(); // Should pass for new IP
    });
  });
});