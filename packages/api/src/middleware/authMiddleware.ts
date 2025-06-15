/**
 * API Key Authentication Middleware
 * Validates API keys against Firestore and enriches request with user info
 */

import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Extend Request interface to include user info
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tier: string;
    apiKey: string;
  };
  isAnonymous?: boolean;
}

// Simple in-memory cache for API key validation (1 minute TTL)
const apiKeyCache = new Map<string, { 
  data: any; 
  expiry: number; 
}>();

const CACHE_TTL = 60 * 1000; // 1 minute

async function validateApiKeyInDatabase(apiKey: string): Promise<{ valid: boolean; userId?: string; tier?: string }> {
  try {
    // Check cache first
    const cached = apiKeyCache.get(apiKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    // Query Firestore for API key
    const apiKeyDoc = await db.collection('api_keys').doc(apiKey).get();
    
    if (!apiKeyDoc.exists) {
      const result = { valid: false };
      apiKeyCache.set(apiKey, { data: result, expiry: Date.now() + CACHE_TTL });
      return result;
    }
    
    const keyData = apiKeyDoc.data();
    if (!keyData || keyData.active !== true) {
      const result = { valid: false };
      apiKeyCache.set(apiKey, { data: result, expiry: Date.now() + CACHE_TTL });
      return result;
    }
    
    // Get user's subscription info
    const userDoc = await db.collection('users').doc(keyData.userId).get();
    const userData = userDoc.data();
    const tier = userData?.subscription?.tier || keyData.tier || 'free';
    
    const result = { 
      valid: true, 
      userId: keyData.userId,
      tier: tier
    };
    
    // Cache successful validation
    apiKeyCache.set(apiKey, { data: result, expiry: Date.now() + CACHE_TTL });
    return result;
    
  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false };
  }
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const xApiKey = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];
    
    // Extract API key from headers (handle string arrays)
    const apiKeyFromHeader = Array.isArray(xApiKey) ? xApiKey[0] : xApiKey;
    const apiKeyFromAuth = Array.isArray(authHeader) ? authHeader[0]?.replace('Bearer ', '') : authHeader?.replace('Bearer ', '');
    const apiKey = apiKeyFromHeader || apiKeyFromAuth;
    
    if (!apiKey) {
      // Allow anonymous access with limited permissions
      req.isAnonymous = true;
      console.log('🆓 Anonymous request - limited access granted');
      return next();
    }
    
    // Validate API key format
    if (!apiKey.startsWith('pk_live_') && !apiKey.startsWith('pk_test_')) {
      return res.status(401).json({
        error: 'Invalid API key format',
        message: 'API key must start with pk_live_ or pk_test_',
        provided: apiKey.substring(0, 10) + '...',
        documentation: 'https://docs.parserator.com/authentication'
      });
    }
    
    // Validate API key in database
    const validation = await validateApiKeyInDatabase(apiKey);
    if (!validation.valid) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid or has been deactivated',
        documentation: 'https://docs.parserator.com/authentication'
      });
    }
    
    // Enrich request with user info
    req.user = {
      id: validation.userId!,
      tier: validation.tier!,
      apiKey: apiKey
    };
    
    req.isAnonymous = false;
    
    console.log(`🔑 API Key validated: ${apiKey.substring(0, 15)}... User: ${req.user.id} Tier: ${req.user.tier}`);
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'Unable to validate API key'
    });
  }
};