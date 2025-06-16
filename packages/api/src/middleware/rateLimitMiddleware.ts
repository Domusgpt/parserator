/**
 * Rate Limiting Middleware
 * Enforces tier-based usage limits and prevents abuse
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Subscription tier limits
const TIER_LIMITS = {
  anonymous: { 
    dailyRequests: 10, 
    monthlyRequests: 50,
    rpmLimit: 5 // requests per minute
  },
  free: { 
    dailyRequests: 50, 
    monthlyRequests: 1000,
    rpmLimit: 10
  },
  pro: { 
    dailyRequests: 1000, 
    monthlyRequests: 20000,
    rpmLimit: 100
  },
  enterprise: { 
    dailyRequests: -1, // unlimited
    monthlyRequests: -1,
    rpmLimit: 1000
  }
};

async function checkUserLimits(userId: string, tier: string): Promise<{ allowed: boolean; reason?: string; usage?: any }> {
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
  if (!limits) {
    return { allowed: false, reason: 'Invalid subscription tier' };
  }
  
  if (limits.dailyRequests === -1) {
    return { allowed: true }; // Unlimited tier
  }
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7); // YYYY-MM
    
    // Get daily usage
    const dailyUsageDoc = await db.collection('usage').doc(userId).collection('daily').doc(today).get();
    const dailyUsage = dailyUsageDoc.exists ? dailyUsageDoc.data() : { requests: 0, tokens: 0 };
    
    // Get monthly usage  
    const monthlyUsageDoc = await db.collection('usage').doc(userId).get();
    const monthlyData = monthlyUsageDoc.exists ? monthlyUsageDoc.data() : {};
    const monthlyUsage = monthlyData?.monthly?.[month] || { requests: 0, tokens: 0 };
    
    // Check daily limit
    if (dailyUsage && dailyUsage.requests >= limits.dailyRequests) {
      return {
        allowed: false,
        reason: `Daily limit of ${limits.dailyRequests} requests exceeded`,
        usage: { daily: dailyUsage, monthly: monthlyUsage }
      };
    }
    
    // Check monthly limit  
    if (limits.monthlyRequests !== -1 && monthlyUsage && monthlyUsage.requests >= limits.monthlyRequests) {
      return {
        allowed: false,
        reason: `Monthly limit of ${limits.monthlyRequests} requests exceeded`,
        usage: { daily: dailyUsage, monthly: monthlyUsage }
      };
    }
    
    return { 
      allowed: true,
      usage: { daily: dailyUsage, monthly: monthlyUsage }
    };
    
  } catch (error) {
    console.error('Usage limit check error:', error);
    return { allowed: true }; // Allow on error to prevent blocking
  }
}

async function checkAnonymousLimits(clientIp: string): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date();
  // Construct a document ID that changes every minute
  const currentMinute = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  const docId = `${clientIp}_${currentMinute}`;
  const rateLimitRef = db.collection('anonymousRateLimits').doc(docId);

  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      if (!doc.exists) {
        // Document for this IP and minute doesn't exist, create it
        // Adding createdAt for potential TTL policies later, though Firestore doesn't directly support field-based TTL on subcollections easily.
        // A separate cleanup function/service would be needed if strict TTL is required.
        transaction.set(rateLimitRef, { count: 1, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      } else {
        const newCount = (doc.data()?.count || 0) + 1;
        if (newCount > TIER_LIMITS.anonymous.rpmLimit) {
          // Explicitly throw an error that includes the reason for easier catching
          throw new Error(`Anonymous rate limit of ${TIER_LIMITS.anonymous.rpmLimit} requests per minute exceeded`);
        }
        transaction.update(rateLimitRef, { count: newCount });
      }
    });
    return { allowed: true };
  } catch (error: any) {
    // Check if the error is the one we threw for rate limit exceeded
    if (error.message.includes('Anonymous rate limit')) {
      return {
        allowed: false,
        reason: error.message
      };
    }
    // Log other transaction errors but allow request to proceed to avoid blocking legitimate users due to transient Firestore issues
    console.error('Error in checkAnonymousLimits Firestore transaction:', error);
    // Default to allow if it's an unknown error to prevent service disruption
    return { allowed: true };
  }
}

export const rateLimitMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.isAnonymous) {
      // Rate limit anonymous users by IP
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      // Ensure to await the async function
      const limitCheck = await checkAnonymousLimits(clientIp);
      
      if (!limitCheck.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: limitCheck.reason,
          tier: 'anonymous',
          retryAfter: 60, // seconds
          upgradeUrl: 'https://parserator.com/pricing'
        });
      }
    } else {
      // Check authenticated user limits
      const limitCheck = await checkUserLimits(req.user!.id, req.user!.tier);
      
      if (!limitCheck.allowed) {
        return res.status(429).json({
          error: 'Usage limit exceeded',
          message: limitCheck.reason,
          tier: req.user!.tier,
          usage: limitCheck.usage,
          upgradeUrl: 'https://parserator.com/pricing'
        });
      }
      
      // Add usage info to request for downstream middleware
      (req as any).currentUsage = limitCheck.usage;
    }
    
    next();
    
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    // Allow request to proceed on error to prevent false positives
    next();
  }
};