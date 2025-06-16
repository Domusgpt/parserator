/**
 * Parserator Production API with Gemini Structured Outputs
 * Enhanced with comprehensive security fixes and input validation
 */

import * as functions from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { 
  sanitizeApiKeyName, 
  sanitizeParseInput, 
  validateOutputSchema 
} from './utils/inputSanitizer';

// Initialize Firebase Admin
admin.initializeApp();

const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Firestore instance
const db = admin.firestore();

// Subscription tiers and limits
const SUBSCRIPTION_LIMITS = {
  anonymous: { 
    dailyRequests: 10, 
    monthlyRequests: 50,
    tokensPerMonth: 5000,
    rateLimitRpm: 5
  },
  free: { 
    dailyRequests: 50, 
    monthlyRequests: 1000,
    tokensPerMonth: 10000,
    rateLimitRpm: 10
  },
  pro: { 
    dailyRequests: 1000, 
    monthlyRequests: 20000,
    tokensPerMonth: 500000,
    rateLimitRpm: 100
  },
  enterprise: { 
    dailyRequests: -1, 
    monthlyRequests: -1,
    tokensPerMonth: -1,
    rateLimitRpm: 1000
  }
};

// API Key validation and user lookup
async function validateApiKey(apiKey: string): Promise<{valid: boolean, userId?: string, tier?: string}> {
  try {
    const apiKeyDoc = await db.collection('api_keys').doc(apiKey).get();
    
    if (!apiKeyDoc.exists) {
      return { valid: false };
    }
    
    const keyData = apiKeyDoc.data();
    if (!keyData || keyData.active !== true) {
      return { valid: false };
    }
    
    // Get user's subscription info
    const userDoc = await db.collection('users').doc(keyData.userId).get();
    const userData = userDoc.data();
    const tier = userData?.subscription?.tier || 'free';
    
    return { 
      valid: true, 
      userId: keyData.userId,
      tier: tier
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false };
  }
}

// Usage tracking
async function trackUsage(userId: string | null, tokensUsed: number, requestId: string): Promise<void> {
  if (!userId) return; // Don't track anonymous users in DB
  
  const today = new Date().toISOString().split('T')[0];
  const month = today.substring(0, 7); // YYYY-MM
  
  try {
    // Track daily usage
    await db.collection('usage').doc(userId).collection('daily').doc(today).set({
      requests: FieldValue.increment(1),
      tokens: FieldValue.increment(tokensUsed),
      lastRequest: new Date(),
      lastRequestId: requestId
    }, { merge: true });
    
    // Track monthly usage
    await db.collection('usage').doc(userId).set({
      [`monthly.${month}.requests`]: FieldValue.increment(1),
      [`monthly.${month}.tokens`]: FieldValue.increment(tokensUsed),
      totalRequests: FieldValue.increment(1),
      totalTokens: FieldValue.increment(tokensUsed),
      lastRequest: new Date(),
      lastRequestId: requestId
    }, { merge: true });
    
  } catch (error) {
    console.error('Usage tracking error:', error);
  }
}

// Check usage limits with fail-closed behavior
async function checkUsageLimits(userId: string | null, tier: string): Promise<{allowed: boolean, reason?: string}> {
  if (!userId) {
    // Anonymous users are handled by IP-based rate limiting in middleware
    return { allowed: true };
  }
  
  const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS];
  if (!limits) {
    return { allowed: false, reason: 'Invalid subscription tier' };
  }
  
  if (limits.dailyRequests === -1) {
    return { allowed: true }; // Unlimited
  }
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7); // YYYY-MM
    
    // Check daily limits
    const dailyUsageDoc = await db.collection('usage').doc(userId).collection('daily').doc(today).get();
    if (dailyUsageDoc.exists) {
      const usage = dailyUsageDoc.data();
      if (usage && usage.requests >= limits.dailyRequests) {
        return { 
          allowed: false, 
          reason: `Daily limit of ${limits.dailyRequests} requests exceeded` 
        };
      }
    }
    
    // Check monthly limits
    if (limits.monthlyRequests !== -1) {
      const usageDoc = await db.collection('usage').doc(userId).get();
      if (usageDoc.exists) {
        const usage = usageDoc.data();
        const monthlyUsage = usage?.monthly?.[month]?.requests || 0;
        if (monthlyUsage >= limits.monthlyRequests) {
          return { 
            allowed: false, 
            reason: `Monthly limit of ${limits.monthlyRequests} requests exceeded` 
          };
        }
      }
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Usage limit check error:', error);
    // Fail-closed: deny request if usage check fails
    return { allowed: false, reason: 'Usage verification temporarily unavailable' };
  }
}

// Define structured output schemas for Gemini
const architectSchema = {
  type: SchemaType.OBJECT as SchemaType.OBJECT,
  properties: {
    searchPlan: {
      type: SchemaType.OBJECT as SchemaType.OBJECT,
      properties: {
        steps: {
          type: SchemaType.ARRAY as SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT as SchemaType.OBJECT,
            properties: {
              field: { type: SchemaType.STRING as SchemaType.STRING },
              instruction: { type: SchemaType.STRING as SchemaType.STRING },
              pattern: { type: SchemaType.STRING as SchemaType.STRING },
              validation: { type: SchemaType.STRING as SchemaType.STRING }
            },
            required: ['field', 'instruction', 'pattern', 'validation']
          }
        },
        confidence: { type: SchemaType.NUMBER as SchemaType.NUMBER },
        strategy: { type: SchemaType.STRING as SchemaType.STRING }
      },
      required: ['steps', 'confidence', 'strategy']
    }
  },
  required: ['searchPlan']
};

// Dynamic schema generator for Extractor output
function createExtractorSchema(outputSchema: Record<string, any>) {
  const properties: any = {};
  
  for (const [key, type] of Object.entries(outputSchema)) {
    if (typeof type === 'string') {
      switch (type.toLowerCase()) {
        case 'string':
          properties[key] = { type: SchemaType.STRING as SchemaType.STRING };
          break;
        case 'number':
          properties[key] = { type: SchemaType.NUMBER as SchemaType.NUMBER };
          break;
        case 'boolean':
          properties[key] = { type: SchemaType.BOOLEAN as SchemaType.BOOLEAN };
          break;
        case 'array':
          properties[key] = {
            type: SchemaType.ARRAY as SchemaType.ARRAY,
            items: { type: SchemaType.STRING as SchemaType.STRING }
          };
          break;
        default:
          properties[key] = { type: SchemaType.STRING as SchemaType.STRING };
      }
    } else {
      properties[key] = { type: SchemaType.STRING as SchemaType.STRING };
    }
  }
  
  return {
    type: SchemaType.OBJECT as SchemaType.OBJECT,
    properties,
    required: Object.keys(outputSchema)
  };
}

export const app = functions.onRequest({
  invoker: 'public',
  timeoutSeconds: 300,
  memory: '1GiB',
  secrets: [geminiApiKey]
}, async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const path = req.url;

  // API Key Authentication (optional for trial users)
  const isParseEndpoint = path.startsWith('/v1/parse');
  let userTier = 'anonymous';
  let userId: string | null = null;
  
  if (isParseEndpoint) {
    const xApiKey = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];
    
    // Extract API key from headers (handle string arrays)
    const apiKeyFromHeader = Array.isArray(xApiKey) ? xApiKey[0] : xApiKey;
    const apiKeyFromAuth = Array.isArray(authHeader) ? authHeader[0]?.replace('Bearer ', '') : authHeader?.replace('Bearer ', '');
    const apiKey = apiKeyFromHeader || apiKeyFromAuth;
    
    if (apiKey) {
      // Validate API key format if provided
      if (!apiKey.startsWith('pk_live_') && !apiKey.startsWith('pk_test_')) {
        res.status(401).json({
          error: 'Invalid API key format',
          message: 'API key must start with pk_live_ or pk_test_',
          provided: apiKey.substring(0, 10) + '...'
        });
        return;
      }
      
      // Validate API key in database
      const keyValidation = await validateApiKey(apiKey);
      if (!keyValidation.valid) {
        res.status(401).json({
          error: 'Invalid API key',
          message: 'The provided API key is not valid or has been deactivated',
          documentation: 'https://docs.parserator.com/authentication'
        });
        return;
      }
      
      userTier = keyValidation.tier || 'free';
      userId = keyValidation.userId || null;
      console.log(`🔑 API Key validated: ${apiKey.substring(0, 15)}... User: ${userId} Tier: ${userTier}`);
    } else {
      // Anonymous/trial user
      console.log('🆓 Anonymous trial user - limited access');
    }
    
    // Check usage limits before processing
    const usageCheck = await checkUsageLimits(userId, userTier);
    if (!usageCheck.allowed) {
      res.status(429).json({
        error: 'Usage limit exceeded',
        message: usageCheck.reason,
        tier: userTier,
        upgradeUrl: 'https://parserator.com/pricing'
      });
      return;
    }
    
    // Store user info for request processing
    (req as any).userTier = userTier;
    (req as any).userId = userId;
  }

  // Health check endpoint
  if (path === '/health' || path === '/') {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      message: 'Parserator API is live with structured outputs!'
    });
    return;
  }

  // API info endpoint
  if (path === '/v1/info') {
    res.json({
      name: 'Parserator API',
      version: '1.0.0',
      status: 'running',
      features: ['structured-outputs', 'architect-extractor', 'intelligent-error-recovery'],
      endpoints: {
        'GET /health': 'Health check',
        'GET /v1/info': 'API information',
        'POST /v1/parse': 'Parse data with structured outputs'
      }
    });
    return;
  }

  // Main parsing endpoint
  if (path === '/v1/parse' && req.method === 'POST') {
    // Apply rate limiting middleware
    try {
      await new Promise<void>((resolve, reject) => {
        rateLimitMiddleware(req, res, (error?: any) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } catch (rateLimitError) {
      // Rate limit middleware already sent response
      return;
    }

    const body = req.body || {};

    // Enhanced input validation with sanitization
    const inputValidation = sanitizeParseInput(body.inputData);
    if (!inputValidation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: inputValidation.error
        }
      });
      return;
    }

    const schemaValidation = validateOutputSchema(body.outputSchema);
    if (!schemaValidation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SCHEMA',
          message: schemaValidation.error
        }
      });
      return;
    }

    // Use sanitized input
    const sanitizedInputData = inputValidation.sanitized;

    // Get Gemini API key
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'Gemini API key not configured'
        }
      });
      return;
    }

    const startTime = Date.now();

    try {
      // Initialize Gemini with structured output support
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // STAGE 1: ARCHITECT with structured output
      const architectModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: architectSchema
        }
      });

      const sample = sanitizedInputData.substring(0, 1000); // First 1KB for planning
      const architectPrompt = `You are the Architect in a two-stage parsing system. Create a detailed SearchPlan for extracting data.

SAMPLE DATA:
${sample}

TARGET SCHEMA:
${JSON.stringify(body.outputSchema, null, 2)}

INSTRUCTIONS:
- Create one step per field in the target schema
- Each step should have:
  - field: the field name from the schema
  - instruction: specific extraction instruction
  - pattern: regex or search pattern to find the data
  - validation: expected data type
- Set confidence between 0.8-0.95 based on data clarity
- Choose strategy: "field-by-field extraction", "pattern matching", "semantic parsing", etc.
- Be precise and actionable

Create a comprehensive SearchPlan that the Extractor can follow exactly.`;

      console.log('🏗️ Calling Architect with structured output...');
      const architectResult = await architectModel.generateContent(architectPrompt);
      const architectResponse = architectResult.response.text();
      
      let searchPlan;
      try {
        const parsed = JSON.parse(architectResponse);
        searchPlan = parsed.searchPlan;
        console.log('✅ Architect structured output:', JSON.stringify(searchPlan, null, 2));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error('❌ Architect structured output failed:', errorMessage);
        console.error('Raw response:', architectResponse);
        throw new Error(`Architect failed to create valid SearchPlan: ${errorMessage}`);
      }

      // STAGE 2: EXTRACTOR with dynamic structured output
      const extractorSchema = createExtractorSchema(body.outputSchema);
      const extractorModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: extractorSchema
        }
      });

      const extractorPrompt = `You are the Extractor in a two-stage parsing system. Execute this SearchPlan on the full input data.

SEARCH PLAN:
${JSON.stringify(searchPlan, null, 2)}

FULL INPUT DATA:
${sanitizedInputData}

INSTRUCTIONS:
- Follow the SearchPlan exactly as specified by the Architect
- Extract data for each field using the provided instructions and patterns
- If a field cannot be found, use null
- Be precise and accurate
- Return data in the exact format specified by the target schema

TARGET OUTPUT FORMAT:
${JSON.stringify(body.outputSchema, null, 2)}

Execute the plan and return the extracted data.`;

      console.log('🎯 Calling Extractor with structured output...');
      const extractorResult = await extractorModel.generateContent(extractorPrompt);
      const extractorResponse = extractorResult.response.text();
      
      let parsedData;
      try {
        parsedData = JSON.parse(extractorResponse);
        console.log('✅ Extractor structured output:', JSON.stringify(parsedData, null, 2));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error('❌ Extractor structured output failed:', errorMessage);
        console.error('Raw response:', extractorResponse);
        throw new Error(`Extractor failed to return valid JSON: ${errorMessage}`);
      }

      const processingTime = Date.now() - startTime;
      const tokensUsed = Math.floor((architectPrompt.length + extractorPrompt.length) / 4);
      const requestId = `req_${Date.now()}`;

      // Track usage for authenticated users
      if ((req as any).userId) {
        await trackUsage((req as any).userId, tokensUsed, requestId);
      }

      // Return successful response
      res.json({
        success: true,
        parsedData: parsedData,
        metadata: {
          architectPlan: searchPlan,
          confidence: searchPlan.confidence || 0.85,
          tokensUsed: tokensUsed,
          processingTimeMs: processingTime,
          requestId: requestId,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          features: ['structured-outputs'],
          userTier: (req as any).userTier || 'anonymous',
          billing: (req as any).userTier === 'anonymous' ? 'trial_usage' : 'api_key_usage',
          userId: (req as any).userId || null
        }
      });

    } catch (error) {
      console.error('❌ Parse error:', error);
      
      const processingTime = Date.now() - startTime;
      
      // Enhanced error handling - prevent information leakage
      res.status(500).json({
        success: false,
        error: {
          code: 'PARSE_FAILED',
          message: 'Unable to process the request. Please check your input data and try again.',
          requestId: `req_${Date.now()}`
        },
        metadata: {
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    }
    return;
  }

  // User management endpoints
  if (path === '/v1/user/keys' && req.method === 'POST') {
    // Generate new API key for authenticated user
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(authToken);
      const userId = decodedToken.uid;
      
      // Generate new API key
      const keyPrefix = 'pk_test_';
      const keyBody = Array.from({length: 32}, () => 
        Math.random().toString(36).charAt(Math.floor(Math.random() * 36))
      ).join('');
      const apiKey = keyPrefix + keyBody;
      
      // Sanitize API key name before storage
      const sanitizedName = sanitizeApiKeyName(req.body.name || 'Default API Key');
      
      // Store in Firestore
      await db.collection('api_keys').doc(apiKey).set({
        userId: userId,
        active: true,
        created: new Date(),
        name: sanitizedName,
        environment: 'test'
      });
      
      res.json({
        success: true,
        apiKey: apiKey,
        name: sanitizedName,
        created: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(401).json({ error: 'Invalid authentication token' });
    }
    return;
  }

  // Get user usage stats
  if (path === '/v1/user/usage' && req.method === 'GET') {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(authToken);
      const userId = decodedToken.uid;
      
      const today = new Date().toISOString().split('T')[0];
      const month = today.substring(0, 7);
      
      // Get usage data
      const usageDoc = await db.collection('usage').doc(userId).get();
      const dailyDoc = await db.collection('usage').doc(userId).collection('daily').doc(today).get();
      
      const usage = usageDoc.data() || {};
      const dailyUsage = dailyDoc.data() || { requests: 0, tokens: 0 };
      const monthlyUsage = usage.monthly?.[month] || { requests: 0, tokens: 0 };
      
      res.json({
        success: true,
        usage: {
          today: dailyUsage,
          thisMonth: monthlyUsage,
          allTime: {
            requests: usage.totalRequests || 0,
            tokens: usage.totalTokens || 0
          }
        }
      });
      
    } catch (error) {
      res.status(401).json({ error: 'Invalid authentication token' });
    }
    return;
  }

  // Metrics endpoint
  if (path === '/metrics' && req.method === 'GET') {
    res.json({
      status: 'metrics',
      message: 'Check Firebase console logs for detailed metrics',
      endpoints: {
        health: '/health',
        parse: '/v1/parse',
        createApiKey: 'POST /v1/user/keys',
        userUsage: 'GET /v1/user/usage',
        metrics: '/metrics'
      },
      note: 'For detailed usage metrics, check Google Cloud Console Logs'
    });
    return;
  }

  // 404 for unknown endpoints
  res.status(404).json({
    error: 'Not found',
    path: path,
    method: req.method
  });
});