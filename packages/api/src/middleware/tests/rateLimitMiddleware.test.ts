// packages/api/src/middleware/tests/rateLimitMiddleware.test.ts
import { Response, NextFunction } from 'express';
import { rateLimitMiddleware } from '../rateLimitMiddleware'; // Adjust path
import { AuthenticatedRequest } from '../authMiddleware'; // Adjust path
import * as usageService from '../../services/usageService'; // Adjust path
import { TIER_LIMITS } from '../../config/tierLimits'; // Adjust path
import { User } from '../../models'; // Adjust path
import * as admin from 'firebase-admin'; // For Timestamp type

// Mock usageService
jest.mock('../../services/usageService');
const mockCheckAndIncrementUsage = usageService.checkAndIncrementUsage as jest.Mock;

// Mock TIER_LIMITS to ensure tests are not dependent on actual config values
// and to have an Infinity case.
jest.mock('../../config/tierLimits', () => ({
  TIER_LIMITS: {
    free: { requestsPerMonth: 100, requestsPerMinute: 10 },
    pro: { requestsPerMonth: 10000, requestsPerMinute: 100 },
    admin: { requestsPerMonth: Infinity, requestsPerMinute: Infinity },
    unknown_tier_test: { requestsPerMonth: 1, requestsPerMinute: 1}, // For default case
  },
}));

// Minimal mock for admin.firestore.Timestamp for User model
if (!admin.apps.length) {
    jest.mock('firebase-admin', () => ({
        initializeApp: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        apps: [] as any[],
        firestore: {
            // @ts-ignore
            Timestamp: {
                now: jest.fn(() => ({
                    toDate: () => new Date(),
                    toMillis: () => Date.now(),
                })),
                fromDate: jest.fn((date: Date) => ({
                    toDate: () => date,
                    toMillis: () => date.getTime(),
                })),
            },
        },
    }));
}


describe('RateLimitMiddleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const baseUser: User & { id: string } = {
    id: 'user123',
    email: 'test@example.com',
    subscriptionTier: 'free',
    monthlyUsage: {
        count: 0,
        lastReset: admin.firestore.Timestamp.fromDate(new Date('2024-01-01T00:00:00Z'))
    },
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01T00:00:00Z')),
    isActive: true,
  };

  beforeEach(() => {
    mockReq = {
      user: { ...baseUser }, // Spread to avoid modification across tests
      headers: {}, // Not directly used by rateLimitMiddleware but good to have
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 500 if req.user is missing', async () => {
    mockReq.user = undefined;
    await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'User information is missing for rate limiting.' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next if usageCheck returns allowed: true', async () => {
    mockCheckAndIncrementUsage.mockResolvedValue({
      allowed: true,
      remainingMonthly: 50,
      limitPerMinute: TIER_LIMITS.free.requestsPerMinute,
      // resetAt not used by middleware directly for logic, but service returns it
    });

    await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockCheckAndIncrementUsage).toHaveBeenCalledWith(baseUser.id, baseUser.subscriptionTier);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled(); // No error status
  });

  it('should return 429 if monthly quota exceeded', async () => {
    mockCheckAndIncrementUsage.mockResolvedValue({
      allowed: false,
      remainingMonthly: 0,
      limitPerMinute: TIER_LIMITS.free.requestsPerMinute,
    });

    await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Too Many Requests',
      message: 'Monthly quota exceeded.',
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 429 if per-minute limit exceeded, with retryAfterSeconds', async () => {
    const retryAfter = 30;
    mockCheckAndIncrementUsage.mockResolvedValue({
      allowed: false,
      remainingMonthly: 50,
      limitPerMinute: TIER_LIMITS.free.requestsPerMinute,
      retryAfterSeconds: retryAfter,
    });

    await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfterSeconds: retryAfter,
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should set X-RateLimit headers correctly for a standard tier', async () => {
    mockCheckAndIncrementUsage.mockResolvedValue({
      allowed: true,
      remainingMonthly: 45,
      limitPerMinute: TIER_LIMITS.free.requestsPerMinute,
    });
    // Ensure req.user.monthlyUsage.lastReset is a valid Firestore Timestamp-like object
    mockReq.user!.monthlyUsage.lastReset = admin.firestore.Timestamp.fromDate(new Date('2024-07-01T00:00:00Z'));


    await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit-Month', TIER_LIMITS.free.requestsPerMonth);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining-Month', 45);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit-Minute', TIER_LIMITS.free.requestsPerMinute);

    const expectedResetDate = new Date('2024-07-01T00:00:00Z');
    expectedResetDate.setMonth(expectedResetDate.getMonth() + 1);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset-Month-Approx', expectedResetDate.toISOString());
    expect(mockNext).toHaveBeenCalled();
  });

  it('should set X-RateLimit headers correctly for an Infinity tier (admin)', async () => {
    mockReq.user!.subscriptionTier = 'admin'; // Switch to admin tier
    mockCheckAndIncrementUsage.mockResolvedValue({
      allowed: true,
      remainingMonthly: Infinity, // As per TIER_LIMITS mock for admin
      limitPerMinute: TIER_LIMITS.admin.requestsPerMinute,
    });
    mockReq.user!.monthlyUsage.lastReset = admin.firestore.Timestamp.fromDate(new Date('2024-07-01T00:00:00Z'));


    await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit-Month', 'Infinity');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining-Month', 'Infinity');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit-Minute', 'Infinity');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should default to "free" tier limits if user tier is unknown', async () => {
    // @ts-ignore - Deliberately using an unknown tier
    mockReq.user!.subscriptionTier = 'super_mega_ultra_tier_plus_plus';
    mockCheckAndIncrementUsage.mockResolvedValue({ // usageService will default to 'free'
      allowed: true,
      remainingMonthly: TIER_LIMITS.free.requestsPerMonth - 1, // Assuming it defaulted to 'free'
      limitPerMinute: TIER_LIMITS.free.requestsPerMinute,
    });
    mockReq.user!.monthlyUsage.lastReset = admin.firestore.Timestamp.fromDate(new Date('2024-07-01T00:00:00Z'));

    await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    // Headers should reflect the 'free' tier limits due to fallback in middleware
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit-Month', TIER_LIMITS.free.requestsPerMonth);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining-Month', TIER_LIMITS.free.requestsPerMonth - 1);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit-Minute', TIER_LIMITS.free.requestsPerMinute);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 500 if checkAndIncrementUsage throws an error', async () => {
    mockCheckAndIncrementUsage.mockRejectedValue(new Error('Firestore connection error'));
    await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error during rate limiting.' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
