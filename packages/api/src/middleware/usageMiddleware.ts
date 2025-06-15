/**
 * Usage Tracking Middleware
 * Tracks API usage for billing and analytics
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const usageMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Store original res.json to intercept response
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Track usage after successful response
    if (res.statusCode === 200 && data.success && data.metadata) {
      trackUsage(req, data.metadata.tokensUsed, data.metadata.requestId)
        .catch(error => console.error('Usage tracking error:', error));
    }
    
    // Call original json method
    return originalJson.call(this, data);
  };
  
  next();
};

async function trackUsage(req: AuthenticatedRequest, tokensUsed: number, requestId: string): Promise<void> {
  // Don't track anonymous users in database (privacy + cost)
  if (req.isAnonymous || !req.user) {
    console.log(`📊 Anonymous usage: ${tokensUsed} tokens (not tracked in DB)`);
    return;
  }
  
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const month = today.substring(0, 7); // YYYY-MM
  
  try {
    const batch = db.batch();
    
    // Track daily usage
    const dailyRef = db.collection('usage').doc(userId).collection('daily').doc(today);
    batch.set(dailyRef, {
      requests: admin.firestore.FieldValue.increment(1),
      tokens: admin.firestore.FieldValue.increment(tokensUsed),
      lastRequest: new Date(),
      lastRequestId: requestId,
      tier: req.user.tier,
      apiKey: req.user.apiKey.substring(0, 15) + '...' // Store prefix for debugging
    }, { merge: true });
    
    // Track monthly usage
    const monthlyRef = db.collection('usage').doc(userId);
    batch.set(monthlyRef, {
      [`monthly.${month}.requests`]: admin.firestore.FieldValue.increment(1),
      [`monthly.${month}.tokens`]: admin.firestore.FieldValue.increment(tokensUsed),
      totalRequests: admin.firestore.FieldValue.increment(1),
      totalTokens: admin.firestore.FieldValue.increment(tokensUsed),
      lastRequest: new Date(),
      lastRequestId: requestId,
      currentTier: req.user.tier,
      lastApiKey: req.user.apiKey.substring(0, 15) + '...'
    }, { merge: true });
    
    // Commit batch write
    await batch.commit();
    
    console.log(`📊 Usage tracked: ${userId} - ${tokensUsed} tokens, request ${requestId}`);
    
  } catch (error) {
    console.error('Usage tracking error:', error);
    // Don't fail the request if tracking fails
  }
}