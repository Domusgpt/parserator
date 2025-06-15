// packages/api/src/middleware/rateLimitMiddleware.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware'; // Adjust path
import { checkAndIncrementUsage } from '../services/usageService'; // Adjust path
import { TIER_LIMITS } from '../config/tierLimits'; // Adjust path

export async function rateLimitMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user || !req.user.id || !req.user.subscriptionTier) {
    // This should not happen if authMiddleware ran successfully
    res.status(500).json({ error: 'User information is missing for rate limiting.' });
    return;
  }

  try {
    const { id: userId, subscriptionTier } = req.user;
    const usageCheck = await checkAndIncrementUsage(userId, subscriptionTier);

    // Set X-RateLimit headers (informational, even if allowed)
    const tierConfig = TIER_LIMITS[subscriptionTier] || TIER_LIMITS.free;
    res.setHeader('X-RateLimit-Limit-Month', tierConfig.requestsPerMonth === Infinity ? 'Infinity' : tierConfig.requestsPerMonth);
    res.setHeader('X-RateLimit-Remaining-Month', usageCheck.remainingMonthly === Infinity ? 'Infinity' : Math.max(0, usageCheck.remainingMonthly));
    // Monthly reset date could also be sent, e.g., X-RateLimit-Reset-Month (timestamp or ISO string)
    // For simplicity, we'll use the lastReset from the user doc. A more accurate one would be 1 month after lastReset.
    const resetDate = req.user.monthlyUsage.lastReset.toDate();
    resetDate.setMonth(resetDate.getMonth() + 1); // Approximate next reset
    res.setHeader('X-RateLimit-Reset-Month-Approx', resetDate.toISOString());


    res.setHeader('X-RateLimit-Limit-Minute', tierConfig.requestsPerMinute === Infinity ? 'Infinity' : tierConfig.requestsPerMinute);
    // Remaining per minute is harder to calculate precisely without re-querying,
    // so we often just send the limit. Or, can be derived from recentRequestsCount if that was returned.
    // For now, we'll just send the limit per minute.

    if (!usageCheck.allowed) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: usageCheck.retryAfterSeconds
          ? `Rate limit exceeded. Try again in ${usageCheck.retryAfterSeconds} seconds.`
          : 'Monthly quota exceeded.',
        ...(usageCheck.retryAfterSeconds && { retryAfterSeconds: usageCheck.retryAfterSeconds })
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in rateLimitMiddleware:', error);
    res.status(500).json({ error: 'Internal server error during rate limiting.' });
  }
}
