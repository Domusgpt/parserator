// packages/api/src/middleware/authMiddleware.ts
import { Response, NextFunction } from 'express';
import { validateApiKey, getUserById } from '../services/apiKeyService'; // Adjust path
import { ApiKey, User } from '../models'; // Adjust path
import { checkAndIncrementUsage } from '../services/usageService'; // Import usage service
import { Request as ExpressRequest } from 'express';

// Extend Express Request type to include user and apiKey properties
export interface AuthenticatedRequest extends ExpressRequest {
  user?: User & { id: string }; // User is now active user
  apiKey?: ApiKey & { id: string }; // ApiKey is now active and valid
  auth?: { uid: string }; // Optional: For Firebase authenticated user ID
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header. Expected: Bearer YOUR_API_KEY' });
    return;
  }

  const providedApiKey = authHeader.split(' ')[1];
  if (!providedApiKey) {
    res.status(401).json({ error: 'Unauthorized: API key is missing from Authorization header.' });
    return;
  }

  try {
    const apiKeyDoc = await validateApiKey(providedApiKey);
    if (!apiKeyDoc) { // validateApiKey now only returns active keys or null
      res.status(401).json({ error: 'Unauthorized: Invalid or inactive API key provided.' });
      return;
    }

    const userDoc = await getUserById(apiKeyDoc.userId);
    if (!userDoc) { // getUserById now only returns active users or null
      res.status(403).json({ error: 'Forbidden: User account associated with the API key is inactive or not found.' });
      return;
    }

    req.user = userDoc;
    req.apiKey = apiKeyDoc;

    // Check and increment usage
    // Type assertion for userDoc as it's confirmed to exist and be active by this point
    const usageCheck = await checkAndIncrementUsage(userDoc!.id, userDoc!.subscriptionTier);

    if (!usageCheck.allowed) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: `You have exceeded your API usage limits. Monthly remaining: ${usageCheck.remainingMonthly}. Per-minute limit: ${usageCheck.limitPerMinute}.`,
        limitType: usageCheck.retryAfterSeconds ? 'minute' : 'month',
        retryAfterSeconds: usageCheck.retryAfterSeconds,
        monthlyLimitResetsAt: usageCheck.resetAt.toISOString(),
      });
      return;
    }

    next();
  } catch (error: any) { // Added :any to error type for specific message check
    console.error('Error during authentication or usage check middleware:', error);
    // Differentiate between critical auth errors and usage service user not found
    if (error.message && error.message.includes('User not found for usage check')) {
        res.status(403).json({ error: 'Forbidden: User account details incomplete for usage tracking.' });
        return;
    }
    res.status(500).json({ error: 'Internal Server Error: An unexpected error occurred during authentication or usage check.' });
  }
}
