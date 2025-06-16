import { rateLimitMiddleware } from './rateLimitMiddleware'; // Adjust path
import { AuthenticatedRequest } from './authMiddleware'; // Adjust path
import { Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

// Mock TIER_LIMITS (accessing private variable for testing)
const TIER_LIMITS = {
    anonymous: {
      dailyRequests: 10, // Not tested by current middleware implementation for anonymous
      monthlyRequests: 50, // Not tested by current middleware implementation for anonymous
      rpmLimit: 5 // requests per minute
    },
    // Other tiers are not relevant for these specific tests
};


// Mock Firebase Admin SDK
let mockFirestoreTransactionGet: jest.Mock;
let mockFirestoreTransactionSet: jest.Mock;
let mockFirestoreTransactionUpdate: jest.Mock;
let mockRunTransaction: jest.Mock;
let mockCollection: jest.Mock;
let mockDoc: jest.Mock;

jest.mock('firebase-admin', () => {
    mockFirestoreTransactionGet = jest.fn();
    mockFirestoreTransactionSet = jest.fn();
    mockFirestoreTransactionUpdate = jest.fn();

    mockRunTransaction = jest.fn(async (updateFunction) => {
      // Simulate transaction execution
      const transaction = {
        get: mockFirestoreTransactionGet,
        set: mockFirestoreTransactionSet,
        update: mockFirestoreTransactionUpdate,
      };
      return updateFunction(transaction);
    });

    mockDoc = jest.fn(() => ({
      // No methods needed on doc directly for these tests, runTransaction is key
    }));

    mockCollection = jest.fn(() => ({
      doc: mockDoc,
    }));

    // Return a structure that mimics admin.firestore()
    // We only need to mock the parts that are actually used by the middleware
    return {
      // initializeApp: jest.fn(), // Not needed for these tests
      firestore: () => ({ // This is the function call
        runTransaction: mockRunTransaction,
        collection: mockCollection,
        FieldValue: { // Mock FieldValue if used, e.g. serverTimestamp()
            serverTimestamp: jest.fn(() => new Date()), // return a mock date
        }
      }),
    };
  });


describe('rateLimitMiddleware - Anonymous Users', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Use fake timers to control time progression

    mockReq = {
      isAnonymous: true,
      ip: '127.0.0.1',
      // body, user, etc., not strictly needed for anonymous rate limit tests
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers(); // Restore real timers
  });

  const getDocId = (ip: string, date: Date) => {
    return `${ip}_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
  };

  it('should allow requests for a new IP within the RPM limit', async () => {
    const ip = '1.2.3.4';
    mockReq.ip = ip;
    const rpmLimit = TIER_LIMITS.anonymous.rpmLimit;

    for (let i = 0; i < rpmLimit; i++) {
      // Simulate document not existing for the first request in a transaction
      mockFirestoreTransactionGet.mockResolvedValueOnce({ exists: false, data: () => undefined });
      // Simulate document existing with count i for subsequent gets in the same minute window
      if (i > 0) {
         // For the next transaction, the previous one would have set it.
         // This requires careful sequencing if we were to test multiple calls within one transaction.
         // However, each request is a new transaction. So, for the i-th request:
         // The (i-1)th request would have set count to i. So, this transaction gets count = i.
         mockFirestoreTransactionGet.mockReset(); // reset for each new request/transaction
         mockFirestoreTransactionGet.mockResolvedValueOnce({ exists: true, data: () => ({ count: i }) });
      }


      await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(i + 1);
      expect(mockRes.status).not.toHaveBeenCalled();

      const currentDocId = getDocId(ip, new Date());
      expect(mockCollection).toHaveBeenCalledWith('anonymousRateLimits');
      expect(mockDoc).toHaveBeenCalledWith(currentDocId);

      if (i === 0) { // First request
        expect(mockFirestoreTransactionSet).toHaveBeenCalledWith(
            expect.anything(), // The DocumentReference
            { count: 1, createdAt: expect.any(Date) }
        );
      } else { // Subsequent requests
        expect(mockFirestoreTransactionUpdate).toHaveBeenCalledWith(
            expect.anything(), // The DocumentReference
            { count: i + 1 }
        );
      }
    }
  });

  it('should block requests from the same IP exceeding RPM limit within a minute', async () => {
    const ip = '5.6.7.8';
    mockReq.ip = ip;
    const rpmLimit = TIER_LIMITS.anonymous.rpmLimit;

    // Allow first 'rpmLimit' requests
    for (let i = 0; i < rpmLimit; i++) {
      mockFirestoreTransactionGet.mockResolvedValueOnce(
        i === 0 ? { exists: false } : { exists: true, data: () => ({ count: i }) }
      );
      await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    }
    expect(mockNext).toHaveBeenCalledTimes(rpmLimit);

    // (rpmLimit + 1)th request should be blocked
    mockFirestoreTransactionGet.mockResolvedValueOnce({ exists: true, data: () => ({ count: rpmLimit }) });
    await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Rate limit exceeded',
        message: `Anonymous rate limit of ${rpmLimit} requests per minute exceeded`,
      })
    );
    expect(mockNext).toHaveBeenCalledTimes(rpmLimit); // Not called again
  });

  it('should reset rate limit for an IP after a minute', async () => {
    const ip = '9.10.11.12';
    mockReq.ip = ip;
    const rpmLimit = TIER_LIMITS.anonymous.rpmLimit;
    const initialTime = new Date(); // "Current" time

    // Exceed limit at initialTime
    for (let i = 0; i <= rpmLimit; i++) {
        jest.setSystemTime(initialTime); // Keep time fixed for these initial calls
        mockFirestoreTransactionGet.mockReset(); // Reset mock for each call
        if (i === 0) {
            mockFirestoreTransactionGet.mockResolvedValueOnce({ exists: false });
        } else {
            mockFirestoreTransactionGet.mockResolvedValueOnce({ exists: true, data: () => ({ count: i }) });
        }
        await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    }
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockNext).toHaveBeenCalledTimes(rpmLimit);

    // Advance time by 1 minute
    const nextMinuteTime = new Date(initialTime.getTime() + 60 * 1000 + 100); // Advance > 1 min
    jest.setSystemTime(nextMinuteTime);

    // This request should be allowed as it's in a new minute window
    mockFirestoreTransactionGet.mockReset();
    mockFirestoreTransactionGet.mockResolvedValueOnce({ exists: false }); // New document for the new minute

    // Clear previous status/json calls from the rate limited call
    (mockRes.status as jest.Mock).mockClear();
    (mockRes.json as jest.Mock).mockClear();

    await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(rpmLimit + 1); // Called one more time
    expect(mockRes.status).not.toHaveBeenCalled(); // Not blocked

    const newDocId = getDocId(ip, nextMinuteTime);
    expect(mockDoc).toHaveBeenLastCalledWith(newDocId); // Check it's using the new minute's docId
    expect(mockFirestoreTransactionSet).toHaveBeenCalledWith(
        expect.anything(),
        { count: 1, createdAt: expect.any(Date) }
    );
  });

  it('should allow request if Firestore transaction fails for reasons other than rate limit', async () => {
    mockReq.ip = '13.14.15.16';

    // Simulate a generic Firestore error during transaction
    mockRunTransaction.mockImplementationOnce(async (updateFunction) => {
      throw new Error('Simulated Firestore internal error');
    });

    await rateLimitMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    // console.error would have been called by the middleware
  });
});
