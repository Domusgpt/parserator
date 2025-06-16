/**
 * User Management Routes
 * API key generation and usage statistics
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();

// Generate new API key
router.post('/keys', async (req: AuthenticatedRequest, res: Response) => {
  if (req.isAnonymous) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'API key generation requires user authentication',
      signupUrl: 'https://parserator.com/signup'
    });
  }
  
  try {
    const { name, environment } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Key name is required'
      });
    }
    
    const isLive = environment === 'live';
    const prefix = isLive ? 'pk_live_' : 'pk_test_';
    
    // Generate random key
    const keyBody = Array.from({length: 32}, () => 
      Math.random().toString(36).charAt(Math.floor(Math.random() * 36))
    ).join('');
    const apiKey = prefix + keyBody;
    
    // Store in Firestore
    await db.collection('api_keys').doc(apiKey).set({
      userId: req.user!.id,
      active: true,
      created: new Date(),
      name: name,
      environment: isLive ? 'live' : 'test',
      tier: req.user!.tier
    });
    
    res.json({
      success: true,
      apiKey: apiKey,
      name: name,
      environment: isLive ? 'live' : 'test',
      created: new Date().toISOString(),
      message: 'API key generated successfully'
    });
    
  } catch (error) {
    console.error('API key generation error:', error);
    res.status(500).json({
      error: 'Key generation failed',
      message: 'Unable to generate API key'
    });
  }
});

// List user's API keys
router.get('/keys', async (req: AuthenticatedRequest, res: Response) => {
  if (req.isAnonymous) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Viewing API keys requires user authentication'
    });
  }
  
  try {
    const keysSnapshot = await db.collection('api_keys')
      .where('userId', '==', req.user!.id)
      .where('active', '==', true)
      .get();
    
    const keys = keysSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id.substring(0, 15) + '...', // Hide full key
        name: data.name,
        environment: data.environment,
        created: data.created.toDate().toISOString(),
        prefix: doc.id.substring(0, 8) + '...'
      };
    });
    
    res.json({
      success: true,
      keys: keys,
      count: keys.length
    });
    
  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({
      error: 'Failed to retrieve keys',
      message: 'Unable to list API keys'
    });
  }
});

// Get user usage statistics
router.get('/usage', async (req: AuthenticatedRequest, res: Response) => {
  if (req.isAnonymous) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Usage statistics require user authentication'
    });
  }
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);
    
    // Get usage data
    const usageDoc = await db.collection('usage').doc(req.user!.id).get();
    const dailyDoc = await db.collection('usage').doc(req.user!.id).collection('daily').doc(today).get();
    
    const usage = usageDoc.data() || {};
    const dailyUsage = dailyDoc.data() || { requests: 0, tokens: 0 };
    const monthlyUsage = usage.monthly?.[month] || { requests: 0, tokens: 0 };
    
    // Get tier limits
    const tierLimits = {
      free: { dailyRequests: 50, monthlyRequests: 1000 },
      pro: { dailyRequests: 1000, monthlyRequests: 20000 },
      enterprise: { dailyRequests: -1, monthlyRequests: -1 }
    };
    
    const limits = tierLimits[req.user!.tier as keyof typeof tierLimits] || tierLimits.free;
    
    res.json({
      success: true,
      usage: {
        today: {
          requests: dailyUsage.requests || 0,
          tokens: dailyUsage.tokens || 0,
          limit: limits.dailyRequests,
          remaining: limits.dailyRequests === -1 ? -1 : Math.max(0, limits.dailyRequests - (dailyUsage.requests || 0))
        },
        thisMonth: {
          requests: monthlyUsage.requests || 0,
          tokens: monthlyUsage.tokens || 0,
          limit: limits.monthlyRequests,
          remaining: limits.monthlyRequests === -1 ? -1 : Math.max(0, limits.monthlyRequests - (monthlyUsage.requests || 0))
        },
        allTime: {
          requests: usage.totalRequests || 0,
          tokens: usage.totalTokens || 0
        }
      },
      tier: req.user!.tier,
      lastRequest: usage.lastRequest ? usage.lastRequest.toDate().toISOString() : null
    });
    
  } catch (error) {
    console.error('Usage statistics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve usage',
      message: 'Unable to get usage statistics'
    });
  }
});

// Delete API key
router.delete('/keys/:keyId', async (req: AuthenticatedRequest, res: Response) => {
  if (req.isAnonymous) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Deleting API keys requires user authentication'
    });
  }
  
  try {
    const keyId = req.params.keyId;
    
    // Verify ownership
    const keyDoc = await db.collection('api_keys').doc(keyId).get();
    if (!keyDoc.exists) {
      return res.status(404).json({
        error: 'API key not found'
      });
    }
    
    const keyData = keyDoc.data();
    if (keyData?.userId !== req.user!.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own API keys'
      });
    }
    
    // Deactivate key (don't delete for audit trail)
    await db.collection('api_keys').doc(keyId).update({
      active: false,
      deactivated: new Date()
    });
    
    res.json({
      success: true,
      message: 'API key deactivated successfully'
    });
    
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({
      error: 'Failed to delete key',
      message: 'Unable to deactivate API key'
    });
  }
});

export { router as userRoutes };