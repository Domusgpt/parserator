/**
 * Parserator Production API v2.0 - WITH SECURITY FIX
 * Gemini structured outputs + Database API key validation
 */

import * as functions from 'firebase-functions/v1';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// API Key validation - THE SECURITY FIX
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
    
    return { 
      valid: true, 
      userId: keyData.userId,
      tier: keyData.tier || 'free'
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false };
  }
}

// Structured output schemas
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

export const app = functions.https.onRequest(async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const path = req.url;

  // Health check
  if (path === '/health' || path === '/') {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      message: 'Parserator API v2.0 - Security Fixed!',
      features: ['structured-outputs', 'database-api-key-validation']
    });
    return;
  }

  // API info
  if (path === '/v1/info') {
    res.json({
      name: 'Parserator API',
      version: '2.0.0',
      status: 'running',
      features: ['structured-outputs', 'api-key-auth', 'database-validation'],
      security: 'Database API key validation enabled'
    });
    return;
  }

  // Main parsing endpoint
  if (path === '/v1/parse' && req.method === 'POST') {
    const body = req.body || {};

    if (!body.inputData || !body.outputSchema) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'inputData and outputSchema are required' }
      });
      return;
    }

    // SECURITY CHECK - API Key Validation
    let userTier = 'anonymous';
    let userId: string | null = null;
    
    const xApiKey = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];
    const apiKeyFromHeader = Array.isArray(xApiKey) ? xApiKey[0] : xApiKey;
    const apiKeyFromAuth = Array.isArray(authHeader) ? authHeader[0]?.replace('Bearer ', '') : authHeader?.replace('Bearer ', '');
    const apiKey = apiKeyFromHeader || apiKeyFromAuth;
    
    if (apiKey) {
      // Format validation
      if (!apiKey.startsWith('pk_live_') && !apiKey.startsWith('pk_test_')) {
        res.status(401).json({
          error: 'Invalid API key format',
          message: 'API key must start with pk_live_ or pk_test_',
          provided: apiKey.substring(0, 10) + '...'
        });
        return;
      }
      
      // DATABASE VALIDATION - THE SECURITY FIX!
      const keyValidation = await validateApiKey(apiKey);
      if (!keyValidation.valid) {
        res.status(401).json({
          error: 'Invalid API key',
          message: 'The provided API key is not valid or has been deactivated'
        });
        return;
      }
      
      userTier = keyValidation.tier || 'free';
      userId = keyValidation.userId || null;
      console.log(`🔑 SECURE: API Key validated: ${apiKey.substring(0, 15)}... User: ${userId} Tier: ${userTier}`);
    } else {
      console.log('🆓 Anonymous trial user');
    }

    // Get Gemini API key from Firebase config
    const apiKeyValue = functions.config().gemini?.api_key;
    if (!apiKeyValue) {
      res.status(500).json({
        success: false,
        error: { code: 'CONFIGURATION_ERROR', message: 'Gemini API key not configured' }
      });
      return;
    }

    const startTime = Date.now();

    try {
      const genAI = new GoogleGenerativeAI(apiKeyValue);
      
      // ARCHITECT - Stage 1
      const architectModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: architectSchema
        }
      });

      const sample = body.inputData.substring(0, 1000);
      const architectPrompt = `You are the Architect. Create a SearchPlan for extracting data.

SAMPLE DATA:
${sample}

TARGET SCHEMA:
${JSON.stringify(body.outputSchema, null, 2)}

Create detailed steps for each field with: field, instruction, pattern, validation.
Set confidence 0.8-0.95. Choose strategy.`;

      const architectResult = await architectModel.generateContent(architectPrompt);
      const searchPlan = JSON.parse(architectResult.response.text()).searchPlan;

      // EXTRACTOR - Stage 2
      const extractorSchema = createExtractorSchema(body.outputSchema);
      const extractorModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: extractorSchema
        }
      });

      const extractorPrompt = `Execute this SearchPlan exactly:

SEARCH PLAN:
${JSON.stringify(searchPlan, null, 2)}

FULL INPUT DATA:
${body.inputData}

Extract data in exact target format.`;

      const extractorResult = await extractorModel.generateContent(extractorPrompt);
      const parsedData = JSON.parse(extractorResult.response.text());

      const processingTime = Date.now() - startTime;

      res.json({
        success: true,
        parsedData: parsedData,
        metadata: {
          architectPlan: searchPlan,
          confidence: searchPlan.confidence || 0.85,
          processingTimeMs: processingTime,
          requestId: `req_${Date.now()}`,
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          features: ['structured-outputs', 'api-key-auth', 'database-validation'],
          userTier: userTier,
          billing: userTier === 'anonymous' ? 'trial_usage' : 'api_key_usage',
          userId: userId,
          security: 'Database validated'
        }
      });

    } catch (error) {
      console.error('Parse error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'PARSE_FAILED',
          message: error instanceof Error ? error.message : 'Parsing failed'
        },
        metadata: {
          processingTimeMs: Date.now() - startTime,
          requestId: `req_${Date.now()}`,
          timestamp: new Date().toISOString(),
          version: '2.0.0'
        }
      });
    }
    return;
  }

  res.status(404).json({
    error: 'Not found',
    path: path,
    method: req.method
  });
});