/**
 * Parserator Production API - Simplified SaaS Version
 * Step-by-step deployment to avoid timeouts
 */

import * as functions from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Simple in-memory API key store for testing (will replace with Firestore)
const DEMO_API_KEYS = new Map([
  ['pk_test_demo_key_12345', { userId: 'demo-user-1', tier: 'free', active: true }],
  ['pk_live_production_key_67890', { userId: 'demo-user-2', tier: 'pro', active: true }],
  ['pk_test_enterprise_key_99999', { userId: 'demo-user-3', tier: 'enterprise', active: true }]
]);

// Usage tracking (in-memory for now, will replace with Firestore)
const USAGE_TRACKING = new Map();

// Subscription limits
const SUBSCRIPTION_LIMITS = {
  anonymous: { dailyRequests: 10, rateLimitRpm: 5 },
  free: { dailyRequests: 50, rateLimitRpm: 10 },
  pro: { dailyRequests: 1000, rateLimitRpm: 100 },
  enterprise: { dailyRequests: -1, rateLimitRpm: 1000 }
};

// Simple API key validation
function validateApiKey(apiKey: string): {valid: boolean, userId?: string, tier?: string} {
  const keyData = DEMO_API_KEYS.get(apiKey);
  if (!keyData || !keyData.active) {
    return { valid: false };
  }
  return { 
    valid: true, 
    userId: keyData.userId,
    tier: keyData.tier
  };
}

// Simple usage tracking
function trackUsage(userId: string | null, tokensUsed: number, requestId: string): void {
  if (!userId) return;
  
  const today = new Date().toISOString().split('T')[0];
  const key = `${userId}:${today}`;
  
  const existing = USAGE_TRACKING.get(key) || { requests: 0, tokens: 0 };
  existing.requests += 1;
  existing.tokens += tokensUsed;
  existing.lastRequest = new Date();
  existing.lastRequestId = requestId;
  
  USAGE_TRACKING.set(key, existing);
  
  console.log(`📊 Usage tracked: ${userId} - ${existing.requests} requests, ${existing.tokens} tokens today`);
}

// Simple usage limit checking
function checkUsageLimits(userId: string | null, tier: string): {allowed: boolean, reason?: string} {
  if (!userId) return { allowed: true }; // Anonymous users get basic access
  
  const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS];
  if (!limits || limits.dailyRequests === -1) {
    return { allowed: true }; // Unlimited
  }
  
  const today = new Date().toISOString().split('T')[0];
  const key = `${userId}:${today}`;
  const usage = USAGE_TRACKING.get(key);
  
  if (usage && usage.requests >= limits.dailyRequests) {
    return { 
      allowed: false, 
      reason: `Daily limit of ${limits.dailyRequests} requests exceeded` 
    };
  }
  
  return { allowed: true };
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
      
      // Validate API key in memory store (will replace with Firestore)
      const keyValidation = validateApiKey(apiKey);
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
    const usageCheck = checkUsageLimits(userId, userTier);
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
      message: 'Parserator API is live with SaaS features!',
      saas: {
        apiKeyValidation: 'Working',
        usageTracking: 'Working (in-memory)',
        rateLimiting: 'Working'
      }
    });
    return;
  }

  // API info endpoint
  if (path === '/v1/info') {
    res.json({
      name: 'Parserator API',
      version: '1.0.0',
      status: 'running',
      features: ['structured-outputs', 'architect-extractor', 'api-key-auth', 'usage-tracking'],
      endpoints: {
        'GET /health': 'Health check',
        'GET /v1/info': 'API information',
        'POST /v1/parse': 'Parse data with structured outputs',
        'GET /v1/demo/usage': 'Demo usage statistics'
      },
      demoApiKeys: [
        'pk_test_demo_key_12345 (free tier)',
        'pk_live_production_key_67890 (pro tier)',
        'pk_test_enterprise_key_99999 (enterprise tier)'
      ]
    });
    return;
  }

  // Demo usage endpoint to show tracking is working
  if (path === '/v1/demo/usage' && req.method === 'GET') {
    const usage = Array.from(USAGE_TRACKING.entries()).map(([key, data]) => {
      const [userId, date] = key.split(':');
      return { userId, date, ...data };
    });
    
    res.json({
      success: true,
      message: 'Demo usage tracking (in-memory)',
      usage: usage,
      totalTrackedRequests: usage.reduce((sum, u) => sum + u.requests, 0)
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

      const sample = body.inputData.substring(0, 1000); // First 1KB for planning
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
${body.inputData}

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
        trackUsage((req as any).userId, tokensUsed, requestId);
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
          features: ['structured-outputs', 'api-key-auth', 'usage-tracking'],
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
          message: error instanceof Error ? error.message : 'Parsing failed',
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

  // 404 for unknown endpoints
  res.status(404).json({
    error: 'Not found',
    path: path,
    method: req.method
  });
});