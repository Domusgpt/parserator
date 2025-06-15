// packages/api/src/services/usageService.ts
import * as admin from 'firebase-admin';
import { User } from '../models';
import { TIER_LIMITS, TierConfig } from '../config/tierLimits'; // Adjust path

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const usersCollection = db.collection('users');
// Subcollection for tracking request timestamps for rate limiting
const requestsLogCollectionSuffix = '_requestsLog';

/**
 * Checks if a user has exceeded their monthly quota or per-minute rate limit.
 * Increments usage if within limits.
 * @param userId The user's Firestore ID.
 * @param userTier The user's current subscription tier.
 * @returns Promise<{ allowed: boolean; remainingMonthly: number; retryAfterSeconds?: number }>
 */
export async function checkAndIncrementUsage(userId: string, userTier: User['subscriptionTier']): Promise<{
    allowed: boolean;
    limitPerMinute: number;
    remainingMonthly: number;
    resetAt: Date;
    retryAfterSeconds?: number;
  }> {
  const tierConfig = TIER_LIMITS[userTier] || TIER_LIMITS.free; // Default to free if tier is unknown

  const userRef = usersCollection.doc(userId);
  const userRequestsLogRef = db.collection(`${usersCollection.path}/${userId}/${requestsLogCollectionSuffix}`);

  // Firestore transaction for atomicity
  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error('User not found for usage check.');
    }
    const userData = userDoc.data() as User;

    // 1. Check monthly quota
    const monthlyLimit = tierConfig.requestsPerMonth;
    const currentMonthUsage = userData.monthlyUsage.count;
    const monthlyQuotaResetDate = userData.monthlyUsage.lastReset.toDate();
    // This assumes lastReset is the beginning of the current period.
    // A more robust solution would check if lastReset is older than 1 month and reset if so.
    // For now, we rely on the scheduled function to reset.

    if (currentMonthUsage >= monthlyLimit && monthlyLimit !== Infinity) {
      return {
        allowed: false,
        remainingMonthly: 0,
        limitPerMinute: tierConfig.requestsPerMinute,
        resetAt: monthlyQuotaResetDate, // This should be the date of next reset
      };
    }

    // 2. Check per-minute rate limit
    const now = admin.firestore.Timestamp.now();
    const oneMinuteAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 60000);

    // Query for requests in the last minute
    const recentRequestsQuery = userRequestsLogRef
                                  .where('timestamp', '>=', oneMinuteAgo)
                                  .orderBy('timestamp', 'desc');
                                  // No need to limit here, we count them

    const recentRequestsSnapshot = await transaction.get(recentRequestsQuery);
    const recentRequestsCount = recentRequestsSnapshot.size;

    if (recentRequestsCount >= tierConfig.requestsPerMinute && tierConfig.requestsPerMinute !== Infinity) {
      // Calculate retryAfterSeconds
      let retryAfterSeconds = 60; // Default to 60
      if (recentRequestsSnapshot.docs.length > 0) {
         // Find the oldest request in the window to calculate a more precise retry-after
         const oldestRequestInWindow = recentRequestsSnapshot.docs[recentRequestsSnapshot.docs.length - 1].data().timestamp.toMillis();
         retryAfterSeconds = Math.max(1, Math.ceil((oldestRequestInWindow + 60000 - now.toMillis()) / 1000));
      }

      return {
        allowed: false,
        remainingMonthly: monthlyLimit - currentMonthUsage,
        limitPerMinute: tierConfig.requestsPerMinute,
        resetAt: monthlyQuotaResetDate,
        retryAfterSeconds,
      };
    }

    // If all checks pass, increment usage and log the request timestamp
    transaction.update(userRef, { 'monthlyUsage.count': admin.firestore.FieldValue.increment(1) });
    transaction.create(userRequestsLogRef.doc(), { timestamp: now }); // Add new request timestamp

    // Clean up old request logs (optional, can be a separate scheduled task)
    // This is a simple way, but could be slow if many old logs.
    // Consider a TTL policy on Firestore documents if available for your project, or a more optimized cleanup.
    const fiveMinutesAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 5 * 60000); // Keep logs for 5 mins
    const oldLogsQuery = userRequestsLogRef.where('timestamp', '<', fiveMinutesAgo);
    const oldLogsSnapshot = await transaction.get(oldLogsQuery); // Get in transaction to avoid race conditions if possible
    oldLogsSnapshot.forEach(doc => transaction.delete(doc.ref));


    return {
      allowed: true,
      remainingMonthly: monthlyLimit - (currentMonthUsage + 1),
      limitPerMinute: tierConfig.requestsPerMinute,
      resetAt: monthlyQuotaResetDate,
    };
  });
}
