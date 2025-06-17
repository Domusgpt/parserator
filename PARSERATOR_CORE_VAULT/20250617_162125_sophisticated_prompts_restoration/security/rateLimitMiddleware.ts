/**
 * Rate Limiting Middleware for Parserator API
 * Implements comprehensive RPM, daily, and monthly limits
 */

import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface RateLimitConfig {
  rpm: number;
  dailyRequests: number;
  monthlyRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  anonymous: { rpm: 5, dailyRequests: 10, monthlyRequests: 50 },
  free: { rpm: 10, dailyRequests: 50, monthlyRequests: 1000 },
  pro: { rpm: 100, dailyRequests: 1000, monthlyRequests: 20000 },
  enterprise: { rpm: 1000, dailyRequests: -1, monthlyRequests: -1 }
};

// In-memory store for RPM tracking (use Redis in production)
const rpmTracker: Map<string, { count: number; resetTime: number }> = new Map();

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const userTier = (req as any).userTier || 'anonymous';
  const userId = (req as any).userId;
  const clientId = userId || getClientId(req);
  
  const limits = RATE_LIMITS[userTier];
  if (!limits) {
    return res.status(400).json({
      error: 'Invalid user tier',
      tier: userTier
    });
  }

  try {
    // Check RPM limit
    const rpmCheck = await checkRpmLimit(clientId, limits.rpm);
    if (!rpmCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `RPM limit of ${limits.rpm} exceeded`,
        tier: userTier,
        retryAfter: rpmCheck.retryAfter
      });
    }

    // Check daily/monthly limits for authenticated users
    if (userId && limits.dailyRequests > 0) {
      const dailyCheck = await checkDailyLimit(userId, limits.dailyRequests);
      if (!dailyCheck.allowed) {
        return res.status(429).json({
          error: 'Daily limit exceeded',
          message: `Daily limit of ${limits.dailyRequests} requests exceeded`,
          tier: userTier,
          upgradeUrl: 'https://parserator.com/pricing'
        });
      }

      const monthlyCheck = await checkMonthlyLimit(userId, limits.monthlyRequests);
      if (!monthlyCheck.allowed) {
        return res.status(429).json({
          error: 'Monthly limit exceeded',
          message: `Monthly limit of ${limits.monthlyRequests} requests exceeded`,
          tier: userTier,
          upgradeUrl: 'https://parserator.com/pricing'
        });
      }
    }

    next();
  } catch (error) {
    // Fail-closed: deny request if rate limiting check fails
    console.error('Rate limiting error:', error);
    return res.status(429).json({
      error: 'Rate limiting service unavailable',
      message: 'Please try again later'
    });
  }
}

async function checkRpmLimit(clientId: string, limit: number): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const windowStart = Math.floor(now / 60000) * 60000; // 1-minute window
  
  const current = rpmTracker.get(clientId);
  
  if (!current || current.resetTime !== windowStart) {
    // New window or first request
    rpmTracker.set(clientId, { count: 1, resetTime: windowStart });
    return { allowed: true };
  }
  
  if (current.count >= limit) {
    const retryAfter = Math.ceil((windowStart + 60000 - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  current.count++;
  return { allowed: true };
}

async function checkDailyLimit(userId: string, limit: number): Promise<{ allowed: boolean }> {
  if (limit === -1) return { allowed: true }; // Unlimited
  
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const dailyUsageDoc = await db.collection('usage').doc(userId).collection('daily').doc(today).get();
    
    if (dailyUsageDoc.exists) {
      const usage = dailyUsageDoc.data();
      if (usage && usage.requests >= limit) {
        return { allowed: false };
      }
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Daily limit check error:', error);
    throw error; // Fail-closed
  }
}

async function checkMonthlyLimit(userId: string, limit: number): Promise<{ allowed: boolean }> {
  if (limit === -1) return { allowed: true }; // Unlimited
  
  const month = new Date().toISOString().substring(0, 7); // YYYY-MM
  
  try {
    const usageDoc = await db.collection('usage').doc(userId).get();
    
    if (usageDoc.exists) {
      const usage = usageDoc.data();
      const monthlyUsage = usage?.monthly?.[month]?.requests || 0;
      
      if (monthlyUsage >= limit) {
        return { allowed: false };
      }
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Monthly limit check error:', error);
    throw error; // Fail-closed
  }
}

function getClientId(req: Request): string {
  // Use IP address for anonymous users
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress || 
             'unknown';
  return `ip:${ip}`;
}

// Cleanup old RPM tracking entries (call periodically)
export function cleanupRpmTracker() {
  const now = Date.now();
  const cutoff = now - 120000; // Keep last 2 minutes
  
  for (const [key, value] of rpmTracker.entries()) {
    if (value.resetTime < cutoff) {
      rpmTracker.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRpmTracker, 300000);