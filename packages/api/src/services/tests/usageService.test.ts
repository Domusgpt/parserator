// packages/api/src/services/tests/usageService.test.ts
import * as mockFirebaseAdmin from 'firebase-admin';
import { checkAndIncrementUsage } from '../usageService';
import { User } from '../../models';
import { TIER_LIMITS as ActualTierLimits } from '../../config/tierLimits'; // Import actual for structure, but mock below

jest.mock('firebase-admin', () => {
  const originalAdmin = jest.requireActual('firebase-admin');
  return {
    ...originalAdmin,
    initializeApp: jest.fn(),
    firestore: jest.fn().mockReturnValue({
      collection: jest.fn(),
      doc: jest.fn(),
      runTransaction: jest.fn(),
      FieldValue: {
        increment: jest.fn((val) => `increment(${val})`), // Mock FieldValue.increment
      },
      Timestamp: originalAdmin.firestore.Timestamp, // Use actual Timestamp
    }),
  };
});

// Mock TIER_LIMITS to control them for tests
const mockTierLimits = {
  free: { requestsPerMonth: 100, requestsPerMinute: 10 },
  pro: { requestsPerMonth: 1000, requestsPerMinute: 100 },
  test_custom: { requestsPerMonth: 5, requestsPerMinute: 2 },
  test_infinite: { requestsPerMonth: Infinity, requestsPerMinute: Infinity },
};
jest.mock('../../config/tierLimits', () => ({
  TIER_LIMITS: mockTierLimits,
}));

describe('UsageService', () => {
  let mockUserDocGet: jest.Mock;
  let mockUserDocUpdate: jest.Mock;
  let mockRequestsLogAdd: jest.Mock; // This is transaction.create
  let mockRequestsLogQuery: { get: jest.Mock }; // For the .where().get() on subcollection
  let mockRequestsLogDelete: jest.Mock; // this is transaction.delete

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserDocGet = jest.fn();
    mockUserDocUpdate = jest.fn();
    mockRequestsLogAdd = jest.fn();
    mockRequestsLogQuery = { get: jest.fn() };
    mockRequestsLogDelete = jest.fn();

    const mockUserRef = { path: 'users/user123' }; // Example path
    const mockRequestsLogCollectionRef = {
      doc: jest.fn().mockReturnThis(), // For adding new log
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(), // If limit is used
      get: mockRequestsLogQuery.get, // For querying logs
      path: 'users/user123/_requestsLog'
    };

    // @ts-ignore
    mockFirebaseAdmin.firestore().collection = jest.fn((collectionPath: string) => {
      if (collectionPath.includes('_requestsLog')) {
        return mockRequestsLogCollectionRef;
      }
      return { // Mock for 'users' collection
        doc: jest.fn(() => mockUserRef), // doc() method for users collection
      };
    });
     // @ts-ignore
    mockFirebaseAdmin.firestore().doc = jest.fn((path: string) => { // If doc() is called directly on firestore()
        if (path.includes('_requestsLog')) { // e.g. users/user123/_requestsLog/docIdToDelete
            return { delete: mockRequestsLogDelete, path }; // For deleting specific log docs
        }
        return { get: mockUserDocGet, update: mockUserDocUpdate, path }; // For user doc
    });


    // @ts-ignore
    mockFirebaseAdmin.firestore().runTransaction.mockImplementation(async (updateFunction) => {
      const mockTransaction = {
        get: (docRef: any) => {
          if (docRef === mockUserRef) { // Check if it's the user document
            return mockUserDocGet(docRef);
          }
          // For queries on subcollections passed to transaction.get
          // This part needs careful handling based on how service constructs refs
          // Assuming query objects are passed to transaction.get
          if (typeof docRef.get === 'function') {
            return docRef.get(); // If it's a query object
          }
          return mockRequestsLogQuery.get(docRef); // Fallback for other refs if any
        },
        update: mockUserDocUpdate,
        create: mockRequestsLogAdd,
        delete: mockRequestsLogDelete, // For deleting specific log docs by ref
      };
      return updateFunction(mockTransaction);
    });
  });

  const getMockUserData = (tier: User['subscriptionTier'], usageCount: number, lastResetHoursAgo: number = 1): User => ({
    email: 'test@example.com', // Add required User fields
    subscriptionTier: tier,
    monthlyUsage: {
      count: usageCount,
      lastReset: mockFirebaseAdmin.firestore.Timestamp.fromMillis(Date.now() - lastResetHoursAgo * 60 * 60 * 1000),
    },
    createdAt: mockFirebaseAdmin.firestore.Timestamp.now(),
    isActive: true,
  });

  describe('checkAndIncrementUsage', () => {
    it('should allow request and increment usage if within all limits', async () => {
      const userData = getMockUserData('test_custom', 0);
      mockUserDocGet.mockResolvedValue({ exists: true, data: () => userData });
      mockRequestsLogQuery.get.mockResolvedValue({ size: 0, docs: [] }); // No recent requests

      const result = await checkAndIncrementUsage('user123', 'test_custom');

      expect(result.allowed).toBe(true);
      expect(result.remainingMonthly).toBe(mockTierLimits.test_custom.requestsPerMonth - 1);
      expect(mockUserDocUpdate).toHaveBeenCalledWith(expect.anything(), { 'monthlyUsage.count': `increment(1)` });
      expect(mockRequestsLogAdd).toHaveBeenCalledWith(expect.anything(), { timestamp: expect.any(mockFirebaseAdmin.firestore.Timestamp) });
    });

    it('should deny request if monthly limit is exceeded', async () => {
      const userData = getMockUserData('test_custom', mockTierLimits.test_custom.requestsPerMonth);
      mockUserDocGet.mockResolvedValue({ exists: true, data: () => userData });
      mockRequestsLogQuery.get.mockResolvedValue({ size: 0, docs: [] });

      const result = await checkAndIncrementUsage('user123', 'test_custom');
      expect(result.allowed).toBe(false);
      expect(result.remainingMonthly).toBe(0);
      expect(mockUserDocUpdate).not.toHaveBeenCalled();
    });

    it('should deny request if per-minute limit is exceeded and provide retryAfterSeconds', async () => {
      const userData = getMockUserData('test_custom', 0);
      mockUserDocGet.mockResolvedValue({ exists: true, data: () => userData });
      const nowMillis = Date.now();
      const recentRequests = Array(mockTierLimits.test_custom.requestsPerMinute).fill(0).map((_, i) => ({
        // Oldest request is 50s ago, newest is recent.
        data: () => ({ timestamp: mockFirebaseAdmin.firestore.Timestamp.fromMillis(nowMillis - (50000 - i*1000)) })
      }));
      mockRequestsLogQuery.get.mockResolvedValue({ size: mockTierLimits.test_custom.requestsPerMinute, docs: recentRequests });

      const result = await checkAndIncrementUsage('user123', 'test_custom');
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1); // Around 10s for oldest request at 50s ago
      expect(mockUserDocUpdate).not.toHaveBeenCalled();
    });

    it('should allow request if tier limits are Infinity', async () => {
      const userData = getMockUserData('test_infinite', 10000);
      mockUserDocGet.mockResolvedValue({ exists: true, data: () => userData });
      mockRequestsLogQuery.get.mockResolvedValue({ size: 1000, docs: [] }); // Many recent requests

      const result = await checkAndIncrementUsage('user123', 'test_infinite');
      expect(result.allowed).toBe(true);
      expect(result.remainingMonthly).toBe(Infinity);
      expect(mockUserDocUpdate).toHaveBeenCalled();
    });

    it('should throw error if user document does not exist', async () => {
      mockUserDocGet.mockResolvedValue({ exists: false });
      await expect(checkAndIncrementUsage('userNonExistent', 'free')).rejects.toThrow('User not found for usage check.');
    });

    it('should attempt to clean up old request logs', async () => {
      const userData = getMockUserData('test_custom', 0);
      mockUserDocGet.mockResolvedValue({ exists: true, data: () => userData });

      // Mock for recent request check (allow through)
      mockRequestsLogQuery.get.mockImplementationOnce(() => Promise.resolve({ size: 0, docs: [] }));
      // Mock for old log cleanup query (return one "old" log)
      const oldLogDocRef = { path: 'users/user123/_requestsLog/oldDocId' }; // Mock ref for deletion
      mockRequestsLogQuery.get.mockImplementationOnce(() => Promise.resolve({
        empty: false,
        docs: [{ ref: oldLogDocRef, data: () => ({ timestamp: mockFirebaseAdmin.firestore.Timestamp.fromMillis(Date.now() - 10 * 60000) }) }]
      }));

      await checkAndIncrementUsage('user123', 'test_custom');
      expect(mockRequestsLogDelete).toHaveBeenCalledWith(oldLogDocRef);
    });
  });
});
