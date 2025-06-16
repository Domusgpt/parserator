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
    console.error('User usage limit check error:', error);
    // Fail closed
    return { allowed: false, reason: 'User rate limit check failed due to internal error' };
  }
}

async function checkAnonymousLimits(clientIp: string): Promise<{ allowed: boolean; reason?: string }> {
  const limits = TIER_LIMITS.anonymous;

  // 1. RPM Check (existing logic, with improved error handling)
  const now = new Date();
  const currentMinute = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  // Using 'anonymousRateLimitsRPM' to distinguish from potential daily/monthly docs if stored differently.
  const rpmDocId = `${clientIp}_${currentMinute}`;
  const rateLimitRef = db.collection('anonymousRateLimitsRPM').doc(rpmDocId);

  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      if (!doc.exists) {
        transaction.set(rateLimitRef, { count: 1, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      } else {
        const newCount = (doc.data()?.count || 0) + 1;
        if (newCount > limits.rpmLimit) {
          throw new Error(`Anonymous rate limit of ${limits.rpmLimit} requests per minute exceeded`);
        }
        transaction.update(rateLimitRef, { count: newCount });
      }
    });
  } catch (error: any) {
    console.error('Anonymous RPM check Firestore transaction error:', error);
    if (error.message.includes('Anonymous rate limit')) {
      return { allowed: false, reason: error.message };
    }
    // Fail closed for other transaction errors
    return { allowed: false, reason: 'Anonymous RPM check failed due to internal error' };
  }

  // 2. Daily/Monthly Check for Anonymous Users
  // Using 'anonymousUsage' collection to align with index.ts modifications
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7); // YYYY-MM

    // Daily check
    if (limits.dailyRequests !== -1) {
      const dailyUsageDoc = await db.collection('anonymousUsage').doc(clientIp).collection('daily').doc(today).get();
      const dailyRequests = dailyUsageDoc.exists ? dailyUsageDoc.data()?.requests || 0 : 0;

      // Note: This check only prevents further requests. Incrementing happens in usageMiddleware or main handler.
      if (dailyRequests >= limits.dailyRequests) {
        return {
          allowed: false,
          reason: `Anonymous daily limit of ${limits.dailyRequests} requests exceeded for IP ${clientIp}`
        };
      }
    }

    // Monthly check
    if (limits.monthlyRequests !== -1) {
      const monthlyUsageDoc = await db.collection('anonymousUsage').doc(clientIp).get();
      const monthlyRequests = monthlyUsageDoc.exists ? monthlyUsageDoc.data()?.monthly?.[month]?.requests || 0 : 0;

      // Note: This check only prevents further requests. Incrementing happens in usageMiddleware or main handler.
      if (monthlyRequests >= limits.monthlyRequests) {
        return {
          allowed: false,
          reason: `Anonymous monthly limit of ${limits.monthlyRequests} requests exceeded for IP ${clientIp}`
        };
      }
    }
  } catch (error) {
    console.error('Anonymous daily/monthly usage limit check error:', error);
    // Fail closed
    return { allowed: false, reason: 'Anonymous daily/monthly check failed due to internal error' };
  }

  return { allowed: true }; // All checks passed
}

export const rateLimitMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let clientIp = 'unknown'; // Initialize clientIp
  try {
    if (req.isAnonymous) {
      clientIp = req.ip || req.connection.remoteAddress || 'unknown_ip_placeholder_middleware';
      if (Array.isArray(clientIp)) { // Handle cases where req.ip might be an array
        clientIp = clientIp[0];
      }
      const limitCheck = await checkAnonymousLimits(clientIp);
      
      if (!limitCheck.allowed) {
        console.warn(`Anonymous rate limit exceeded for IP: ${clientIp}, Reason: ${limitCheck.reason}`);
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: limitCheck.reason,
          tier: 'anonymous',
          retryAfter: 60, // seconds
          upgradeUrl: 'https://parserator.com/pricing'
        });
      }
    } else {
      if (!req.user || !req.user.id || !req.user.tier) {
        console.error('User data missing in authenticated request:', req.user);
        // This case should ideally be caught by authMiddleware first
        return res.status(401).json({ error: 'Unauthorized', message: 'User authentication data is missing.' });
      }
      const limitCheck = await checkUserLimits(req.user.id, req.user.tier);
      
      if (!limitCheck.allowed) {
        console.warn(`User rate limit exceeded for User ID: ${req.user.id}, Tier: ${req.user.tier}, Reason: ${limitCheck.reason}`);
        return res.status(429).json({
          error: 'Usage limit exceeded',
          message: limitCheck.reason,
          tier: req.user.tier,
          usage: limitCheck.usage,
          upgradeUrl: 'https://parserator.com/pricing'
        });
      }
      
      (req as any).currentUsage = limitCheck.usage;
    }
    
    next();
    
  } catch (error: any) {
    // Log more details about the error in the main middleware function
    console.error('Critical error in rateLimitMiddleware:', {
      errorMessage: error.message,
      errorStack: error.stack,
      userId: req.user?.id,
      isAnonymous: req.isAnonymous,
      clientIp: clientIp, // Log the determined client IP
      requestUrl: req.originalUrl,
    });
    // Still calling next() to avoid obscuring other potential issues,
    // as critical fail-closed logic is within checkUserLimits/checkAnonymousLimits.
    // Depending on policy, could return 500 here.
    next();
  }
};