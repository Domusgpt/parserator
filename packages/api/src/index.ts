/**
 * Parserator Production API with Gemini Structured Outputs
 * Fixed version that eliminates JSON parsing errors
 */

import * as functions from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
admin.initializeApp();

// Simple HTML sanitizer utility function
function sanitizeHTML(text: string): string {
  if (!text) return '';
  return text.replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/&/g, '&amp;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#39;');
}

// Utility to escape backticks for template literal embedding
function escapeBackticks(text: string): string {
  if (!text) return '';
  return text.replace(/`/g, '\\`');
}

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

// Check usage limits
async function checkUsageLimits(
  userId: string | null,
  tier: string,
  req: functions.https.Request // Add req parameter to access IP
): Promise<{allowed: boolean, reason?: string}> {
  const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS];
  if (!limits) {
    return { allowed: false, reason: 'Invalid subscription tier' };
  }

  if (tier === 'anonymous') {
    // Anonymous user rate limiting (RPM, daily, monthly)
    let clientIp = req.ip || req.headers['x-forwarded-for'];
    if (Array.isArray(clientIp)) {
      clientIp = clientIp[0];
    }
    if (!clientIp) {
      console.warn('Could not determine client IP for anonymous rate limiting. Using placeholder.');
      clientIp = 'unknown_ip_placeholder';
    }

    // 1. RPM Check for Anonymous Users
    const now = new Date();
    const currentMinute = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const rpmDocId = `${clientIp}_${currentMinute}`;
    const rateLimitRef = db.collection('anonymousRateLimits').doc(rpmDocId);

    try {
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(rateLimitRef);
        if (!doc.exists) {
          transaction.set(rateLimitRef, { count: 1, createdAt: FieldValue.serverTimestamp() });
        } else {
          const newCount = (doc.data()?.count || 0) + 1;
          if (newCount > limits.rateLimitRpm) {
            throw new Error(`Anonymous rate limit of ${limits.rateLimitRpm} requests per minute exceeded`);
          }
          transaction.update(rateLimitRef, { count: newCount });
        }
      });
    } catch (error: any) {
      console.error('Anonymous RPM check Firestore transaction error:', error);
      if (error.message.includes('Anonymous rate limit')) {
        return {
          allowed: false,
          reason: error.message
        };
      }
      // Fail closed for other transaction errors
      return { allowed: false, reason: 'Rate limit check failed due to internal error (RPM)' };
    }

    // 2. Daily/Monthly Check for Anonymous Users
    try {
      const today = new Date().toISOString().split('T')[0];
      const month = today.substring(0, 7); // YYYY-MM

      // Daily check
      if (limits.dailyRequests !== -1) {
        const dailyUsageDoc = await db.collection('anonymousUsage').doc(clientIp).collection('daily').doc(today).get();
        const dailyRequests = dailyUsageDoc.exists ? dailyUsageDoc.data()?.requests || 0 : 0;
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
        if (monthlyRequests >= limits.monthlyRequests) {
          return {
            allowed: false,
            reason: `Anonymous monthly limit of ${limits.monthlyRequests} requests exceeded for IP ${clientIp}`
          };
        }
      }
    } catch (error) {
      console.error('Anonymous daily/monthly usage limit check error:', error);
      return { allowed: false, reason: 'Rate limit check failed due to internal error (daily/monthly)' };
    }
    
    return { allowed: true };

  } else {
    // Authenticated user usage limits
    if (limits.dailyRequests === -1) { // Assuming -1 means unlimited for daily/monthly too
      return { allowed: true }; // Unlimited tier
    }

    if (!userId) {
      // This should not happen if tier is not anonymous
      console.error('Error: userId is null for non-anonymous tier.');
      return { allowed: false, reason: 'Internal configuration error: User ID missing for authenticated tier.'};
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const month = today.substring(0, 7);

      // Daily check for authenticated user
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

      // Monthly check for authenticated user (simplified: checking total monthly against limit)
      // Note: The original `trackUsage` updates `monthly.[month].requests`. We'll use that.
      const monthlyUsageDoc = await db.collection('usage').doc(userId).get();
      if (monthlyUsageDoc.exists && limits.monthlyRequests !== -1) {
          const monthlyData = monthlyUsageDoc.data();
          const currentMonthUsage = monthlyData?.monthly?.[month]?.requests || 0;
          if (currentMonthUsage >= limits.monthlyRequests) {
              return {
                  allowed: false,
                  reason: `Monthly limit of ${limits.monthlyRequests} requests exceeded`
              };
          }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Authenticated usage limit check error:', error);
      return { allowed: false, reason: 'Rate limit check failed due to internal error' };
    }
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
    
    // Store user info for request processing (needs to be before checkUsageLimits)
    (req as any).userTier = userTier;
    (req as any).userId = userId;

    // Check usage limits before processing
    // Pass the original 'req' object to checkUsageLimits
    const usageCheck = await checkUsageLimits(userId, userTier, req);
    if (!usageCheck.allowed) {
      res.status(429).json({
        error: 'Usage limit exceeded',
        message: usageCheck.reason,
        tier: userTier,
        upgradeUrl: 'https://parserator.com/pricing'
      });
      return;
    }
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
    const body = req.body || {};

    // Validate input
    if (!body.inputData || !body.outputSchema) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'inputData and outputSchema are required'
        }
      });
      return;
    }

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

      // Escape backticks in user-provided data before embedding in prompts
      const safeSample = escapeBackticks(body.inputData.substring(0, 1000));
      const safeInputData = escapeBackticks(body.inputData);

      const architectPrompt = `You are the Architect in a two-stage parsing system. Create a detailed SearchPlan for extracting data.

SAMPLE DATA:
${safeSample}

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
${safeInputData}

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

      // Track usage for authenticated users and anonymous users (by IP)
      // For anonymous, userId is the IP. For authenticated, it's the actual userId.
      const usageIdentifier = (req as any).userId || (req.ip || req.headers['x-forwarded-for'] || 'unknown_ip_placeholder');
      // Ensure usageIdentifier is a string if it's an array from x-forwarded-for
      const finalUsageIdentifier = Array.isArray(usageIdentifier) ? usageIdentifier[0] : usageIdentifier;

      if (finalUsageIdentifier) { // Only track if we have an identifier
          if ((req as any).userTier === 'anonymous') {
              // Increment daily/monthly for anonymous users (RPM is already handled)
              const today = new Date().toISOString().split('T')[0];
              const month = today.substring(0, 7);
              try {
                  await db.collection('anonymousUsage').doc(finalUsageIdentifier).collection('daily').doc(today).set({
                      requests: FieldValue.increment(1),
                      lastRequest: new Date()
                  }, { merge: true });
                  await db.collection('anonymousUsage').doc(finalUsageIdentifier).set({
                      [`monthly.${month}.requests`]: FieldValue.increment(1),
                      lastRequest: new Date()
                  }, { merge: true });
              } catch (e) {
                  console.error("Error tracking anonymous usage:", e);
              }
          } else {
              // Existing trackUsage for authenticated users
              await trackUsage(finalUsageIdentifier, tokensUsed, requestId);
          }
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
      
      res.status(500).json({
        success: false,
        error: {
          code: 'PARSE_FAILED',
          message: "An error occurred while processing your request. Please check your input or try again later.",
          details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        },
        metadata: {
          processingTimeMs: processingTime,
          requestId: `req_${Date.now()}`,
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
      
      const rawApiKeyName = req.body.name || 'Default API Key';
      const sanitizedApiKeyName = sanitizeHTML(rawApiKeyName);

      // Store in Firestore
      await db.collection('api_keys').doc(apiKey).set({
        userId: userId,
        active: true,
        created: new Date(),
        name: sanitizedApiKeyName, // Store sanitized name
        environment: 'test'
      });
      
      res.json({
        success: true,
        apiKey: apiKey,
        name: sanitizedApiKeyName, // Return sanitized name
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