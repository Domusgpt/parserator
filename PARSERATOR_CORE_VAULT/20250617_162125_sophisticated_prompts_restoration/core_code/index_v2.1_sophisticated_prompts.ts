/**
 * Parserator Production API with Sophisticated Architect-Extractor System v2.1
 * ============================================================================
 * 🚨 CRITICAL: Contains sophisticated prompts restored from regression
 * - 95% accuracy target with comprehensive error recovery
 * - EMA-compliant parsing with cultural and ethical considerations
 * - Enhanced security with rate limiting and input validation
 * - Contextual LLM-generated error messages for better UX
 * 
 * PROMPT PROTECTION: Do not modify Architect/Extractor prompts without approval
 * See SOPHISTICATED_PROMPTS_RECONSTRUCTION.md for implementation details
 * Last updated: 2025-06-17 - Sophisticated prompts restored and protected
 * ============================================================================
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

// Generate contextual error responses using LLM
async function generateContextualErrorResponse(
  error: any,
  request: any,
  searchPlan?: any,
  geminiApiKey?: string
): Promise<string> {
  if (!geminiApiKey) {
    return getStaticErrorContext(error.code || 'UNKNOWN_ERROR');
  }

  const errorContextPrompt = `Based on this parsing error, provide a helpful explanation for the user:

ERROR: ${error.message}
ERROR CODE: ${error.code || 'UNKNOWN'}
STAGE: ${error.stage || 'unknown'}

USER'S SCHEMA:
${JSON.stringify(request.outputSchema, null, 2)}

${searchPlan ? `ATTEMPTED SEARCH PLAN:
${JSON.stringify(searchPlan.steps?.slice(0, 3) || [], null, 2)}...` : ''}

Provide a brief, helpful explanation (2-3 sentences) that:
1. Explains what went wrong in simple terms
2. Suggests how the user might fix it
3. Avoids technical jargon

Response:`;

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(errorContextPrompt);
    const response = result.response.text();
    return response.trim();
  } catch {
    // Fallback to pre-written contextual errors
    return getStaticErrorContext(error.code || 'UNKNOWN_ERROR');
  }
}

// Static error context fallbacks
function getStaticErrorContext(errorCode: string): string {
  const staticErrors: Record<string, string> = {
    'ARCHITECT_FAILED': 'The system had trouble understanding your data structure. Try providing clearer field names in your schema or simpler data formats.',
    'EXTRACTOR_FAILED': 'The extraction process encountered an issue. Consider reducing the number of fields you\'re trying to extract or cleaning your input data.',
    'INVALID_INPUT': 'Your input data appears to be malformed. Please check for special characters, encoding issues, or try a smaller sample.',
    'INVALID_SCHEMA': 'Your output schema format is not recognized. Make sure to use simple field names and supported data types like "string", "number", or "boolean".',
    'LOW_CONFIDENCE': 'The system is not confident about the extracted data. Try providing more structured input data or simplify your schema.',
    'PARSE_FAILED': 'The parsing process failed unexpectedly. This could be due to data complexity or system load. Please try again with a simpler request.'
  };
  
  return staticErrors[errorCode] || 'An unexpected error occurred. Please check your input data and schema format, then try again.';
}

// Define structured output schemas for Gemini
const architectSchema = {
  type: SchemaType.OBJECT as SchemaType.OBJECT,
  properties: {
    steps: {
      type: SchemaType.ARRAY as SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT as SchemaType.OBJECT,
        properties: {
          targetKey: { type: SchemaType.STRING as SchemaType.STRING },
          description: { type: SchemaType.STRING as SchemaType.STRING },
          searchInstruction: { type: SchemaType.STRING as SchemaType.STRING },
          validationType: { type: SchemaType.STRING as SchemaType.STRING },
          isRequired: { type: SchemaType.BOOLEAN as SchemaType.BOOLEAN },
          examples: { 
            type: SchemaType.ARRAY as SchemaType.ARRAY,
            items: { type: SchemaType.STRING as SchemaType.STRING }
          },
          pattern: { type: SchemaType.STRING as SchemaType.STRING },
          defaultValue: { type: SchemaType.STRING as SchemaType.STRING },
          errorRecoveryStrategy: { type: SchemaType.STRING as SchemaType.STRING },
          confidenceThreshold: { type: SchemaType.NUMBER as SchemaType.NUMBER }
        },
        required: ['targetKey', 'description', 'searchInstruction', 'validationType', 'isRequired']
      }
    },
    totalSteps: { type: SchemaType.NUMBER as SchemaType.NUMBER },
    estimatedComplexity: { type: SchemaType.STRING as SchemaType.STRING },
    architectConfidence: { type: SchemaType.NUMBER as SchemaType.NUMBER },
    estimatedExtractorTokens: { type: SchemaType.NUMBER as SchemaType.NUMBER },
    extractorInstructions: { type: SchemaType.STRING as SchemaType.STRING },
    fallbackStrategies: {
      type: SchemaType.ARRAY as SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT as SchemaType.OBJECT,
        properties: {
          condition: { type: SchemaType.STRING as SchemaType.STRING },
          action: { type: SchemaType.STRING as SchemaType.STRING },
          details: { type: SchemaType.STRING as SchemaType.STRING }
        },
        required: ['condition', 'action', 'details']
      }
    },
    metadata: {
      type: SchemaType.OBJECT as SchemaType.OBJECT,
      properties: {
        createdAt: { type: SchemaType.STRING as SchemaType.STRING },
        architectVersion: { type: SchemaType.STRING as SchemaType.STRING },
        sampleLength: { type: SchemaType.NUMBER as SchemaType.NUMBER },
        userInstructions: { type: SchemaType.STRING as SchemaType.STRING },
        dataCharacteristics: {
          type: SchemaType.OBJECT as SchemaType.OBJECT,
          properties: {
            format: { type: SchemaType.STRING as SchemaType.STRING },
            quality: { type: SchemaType.STRING as SchemaType.STRING },
            patterns: {
              type: SchemaType.ARRAY as SchemaType.ARRAY,
              items: { type: SchemaType.STRING as SchemaType.STRING }
            }
          }
        }
      }
    }
  },
  required: ['steps', 'totalSteps', 'estimatedComplexity', 'architectConfidence']
};

// Dynamic schema generator for Extractor output with metrics
function createExtractorSchema(outputSchema: Record<string, any>) {
  const extractedDataProperties: any = {};
  const extractionNotesProperties: any = {};
  const confidenceScoresProperties: any = {};
  
  for (const [key, type] of Object.entries(outputSchema)) {
    // Build extracted data properties
    if (typeof type === 'string') {
      switch (type.toLowerCase()) {
        case 'string':
          extractedDataProperties[key] = { type: SchemaType.STRING as SchemaType.STRING };
          break;
        case 'number':
          extractedDataProperties[key] = { type: SchemaType.NUMBER as SchemaType.NUMBER };
          break;
        case 'boolean':
          extractedDataProperties[key] = { type: SchemaType.BOOLEAN as SchemaType.BOOLEAN };
          break;
        case 'array':
          extractedDataProperties[key] = {
            type: SchemaType.ARRAY as SchemaType.ARRAY,
            items: { type: SchemaType.STRING as SchemaType.STRING }
          };
          break;
        default:
          extractedDataProperties[key] = { type: SchemaType.STRING as SchemaType.STRING };
      }
    } else {
      extractedDataProperties[key] = { type: SchemaType.STRING as SchemaType.STRING };
    }
    
    // Build extraction notes and confidence properties
    extractionNotesProperties[key] = { type: SchemaType.STRING as SchemaType.STRING };
    confidenceScoresProperties[key] = { type: SchemaType.NUMBER as SchemaType.NUMBER };
  }
  
  return {
    type: SchemaType.OBJECT as SchemaType.OBJECT,
    properties: {
      extractedData: {
        type: SchemaType.OBJECT as SchemaType.OBJECT,
        properties: extractedDataProperties,
        required: Object.keys(outputSchema)
      },
      extractionNotes: {
        type: SchemaType.OBJECT as SchemaType.OBJECT,
        properties: extractionNotesProperties
      },
      extractionMetrics: {
        type: SchemaType.OBJECT as SchemaType.OBJECT,
        properties: {
          successfulExtractions: { type: SchemaType.NUMBER as SchemaType.NUMBER },
          failedExtractions: { type: SchemaType.NUMBER as SchemaType.NUMBER },
          partialExtractions: { type: SchemaType.NUMBER as SchemaType.NUMBER },
          confidenceScores: {
            type: SchemaType.OBJECT as SchemaType.OBJECT,
            properties: confidenceScoresProperties
          }
        },
        required: ['successfulExtractions', 'failedExtractions', 'partialExtractions', 'confidenceScores']
      },
      errorRecoveryActions: {
        type: SchemaType.ARRAY as SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT as SchemaType.OBJECT,
          properties: {
            field: { type: SchemaType.STRING as SchemaType.STRING },
            issue: { type: SchemaType.STRING as SchemaType.STRING },
            action: { type: SchemaType.STRING as SchemaType.STRING },
            details: { type: SchemaType.STRING as SchemaType.STRING }
          },
          required: ['field', 'issue', 'action', 'details']
        }
      }
    },
    required: ['extractedData', 'extractionNotes', 'extractionMetrics', 'errorRecoveryActions']
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
      const fieldCount = Object.keys(body.outputSchema).length;
      const userInstructions = body.instructions || '';
      
      // ========================================================================================
      // 🚨 CRITICAL: SOPHISTICATED ARCHITECT PROMPT v2.1 - DO NOT MODIFY WITHOUT APPROVAL 🚨
      // ========================================================================================
      // This prompt was restored from SOPHISTICATED_PROMPTS_RECONSTRUCTION.md after regression
      // Original basic prompts achieved <70% accuracy, this version targets 95% accuracy
      // Includes: Error recovery, EMA compliance, structured outputs, confidence scoring
      // Last updated: 2025-06-17 by Claude Code Assistant
      // Protected against future regressions - see CLAUDE.md for modification protocols
      // ========================================================================================
      
      const architectPrompt = `You are the Architect in a two-stage data parsing system. Your job is to analyze the user's desired output schema and a sample of their input data, then create a detailed SearchPlan for the Extractor to follow.

## YOUR TASK
Create a JSON SearchPlan that tells the Extractor exactly how to find each piece of data in the full input.

## OUTPUT SCHEMA (what the user wants)
\`\`\`json
${JSON.stringify(body.outputSchema, null, 2)}
\`\`\`

## DATA SAMPLE (representative portion of input)
\`\`\`
${sample}
\`\`\`

${userInstructions ? `## USER INSTRUCTIONS\n${userInstructions}\n` : ''}

## RESPONSE FORMAT
You must respond with ONLY a valid JSON object matching this exact structure:

\`\`\`json
{
  "steps": [
    {
      "targetKey": "fieldName",
      "description": "Clear description of what this data represents",
      "searchInstruction": "Direct, specific instruction for finding this data",
      "validationType": "string|email|number|iso_date|string_array|boolean|url|phone|json_object",
      "isRequired": true,
      "examples": ["example1", "example2"],
      "pattern": "optional regex pattern",
      "defaultValue": null,
      "errorRecoveryStrategy": "skip|retry|simplify|approximate",
      "confidenceThreshold": 0.8
    }
  ],
  "totalSteps": ${fieldCount},
  "estimatedComplexity": "low|medium|high",
  "architectConfidence": 0.95,
  "estimatedExtractorTokens": 1500,
  "extractorInstructions": "Any special guidance for the Extractor",
  "fallbackStrategies": [
    {
      "condition": "low_confidence",
      "action": "simplify_schema",
      "details": "Remove optional fields and focus on essential data"
    },
    {
      "condition": "parsing_failure",
      "action": "retry_with_context",
      "details": "Add surrounding context to improve extraction"
    }
  ],
  "metadata": {
    "createdAt": "${new Date().toISOString()}",
    "architectVersion": "v2.1",
    "sampleLength": ${sample.length},
    "userInstructions": "${userInstructions || ''}",
    "dataCharacteristics": {
      "format": "structured|semi-structured|unstructured",
      "quality": "high|medium|low",
      "patterns": ["consistent_labels", "table_format", "narrative_text"]
    }
  }
}
\`\`\`

## CRITICAL INSTRUCTIONS

1. **Each searchInstruction must be DIRECT and ACTIONABLE**
   - ❌ "Look for the customer name"
   - ✅ "Find the text after 'Customer:' or 'Name:' that appears to be a person's name"

2. **Use the data sample to understand patterns**
   - Identify how information is formatted
   - Note any delimiters, labels, or structural patterns
   - Create instructions that work for similar data

3. **Choose appropriate validationType**
   - string: General text
   - email: Email addresses
   - number: Numeric values
   - iso_date: Dates in ISO format (YYYY-MM-DD)
   - string_array: Multiple text values
   - boolean: True/false values
   - url: Web URLs
   - phone: Phone numbers
   - json_object: Nested objects

4. **Set confidence based on clarity**
   - High (0.9+): Clear patterns, well-structured data
   - Medium (0.7-0.89): Some ambiguity but patterns visible
   - Low (0.5-0.69): Messy data, unclear patterns

5. **Estimate complexity honestly**
   - low: Simple extraction, clear patterns
   - medium: Some context needed, moderate complexity
   - high: Complex reasoning, ambiguous patterns

6. **Provide helpful examples when patterns are clear**

7. **ERROR RECOVERY STRATEGIES**
   - skip: Skip this field if extraction fails
   - retry: Try alternative search patterns
   - simplify: Use simpler extraction logic
   - approximate: Accept partial matches

8. **SCHEMA SIMPLIFICATION**
   If the schema is too complex (>20 fields), suggest simplification:
   - Group related fields into objects
   - Mark less critical fields as optional
   - Recommend phased extraction approach

9. **95% ACCURACY TECHNIQUES**
   - Use multiple search patterns for critical fields
   - Provide regex patterns for structured data
   - Include validation rules in instructions
   - Suggest confidence thresholds per field

10. **EMA COMPLIANCE**
    - Respect data sovereignty principles
    - Avoid extracting sensitive data unless explicitly requested
    - Provide transparency in extraction methods

Remember: The Extractor will follow your plan exactly. Make your instructions clear, specific, and actionable. Your searchInstructions are the key to accurate extraction.

RESPOND WITH ONLY THE JSON - NO EXPLANATIONS OR MARKDOWN FORMATTING.`;

      console.log('🏗️ Calling Architect with structured output...');
      const architectResult = await architectModel.generateContent(architectPrompt);
      const architectResponse = architectResult.response.text();
      
      let searchPlan;
      try {
        searchPlan = JSON.parse(architectResponse);
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

      const stepsJson = JSON.stringify(searchPlan.steps, null, 2);
      
      // ========================================================================================
      // 🚨 CRITICAL: SOPHISTICATED EXTRACTOR PROMPT v2.1 - DO NOT MODIFY WITHOUT APPROVAL 🚨
      // ========================================================================================
      // This prompt was restored from SOPHISTICATED_PROMPTS_RECONSTRUCTION.md after regression
      // Original basic prompts achieved <70% accuracy, this version targets 95% accuracy
      // Includes: Comprehensive error recovery, confidence scoring, contextual error messages
      // Last updated: 2025-06-17 by Claude Code Assistant
      // Protected against future regressions - see CLAUDE.md for modification protocols
      // ========================================================================================
      
      const extractorPrompt = `You are the Extractor in a two-stage data parsing system. The Architect has analyzed the data and created a SearchPlan for you to follow. Your job is to execute this plan precisely and extract the requested data.

## YOUR TASK
Follow the SearchPlan exactly to extract data from the input. Return a JSON object with the extracted values.

## INPUT DATA
\`\`\`
${sanitizedInputData}
\`\`\`

## SEARCH PLAN (follow exactly)
\`\`\`json
${stepsJson}
\`\`\`

${searchPlan.extractorInstructions ? `## SPECIAL INSTRUCTIONS\n${searchPlan.extractorInstructions}\n` : ''}

## RESPONSE FORMAT
You must respond with ONLY a valid JSON object in this exact format:

\`\`\`json
{
  "extractedData": {
    "field1": "extracted_value",
    "field2": "extracted_value"
  },
  "extractionNotes": {
    "field1": "brief note about extraction quality/confidence",
    "field2": "brief note about extraction quality/confidence"
  },
  "extractionMetrics": {
    "successfulExtractions": 15,
    "failedExtractions": 2,
    "partialExtractions": 1,
    "confidenceScores": {
      "field1": 0.95,
      "field2": 0.87
    }
  },
  "errorRecoveryActions": [
    {
      "field": "fieldName",
      "issue": "not_found|ambiguous|wrong_format",
      "action": "used_default|approximated|skipped",
      "details": "Explanation of recovery action"
    }
  ]
}
\`\`\`

## EXTRACTION INSTRUCTIONS

For each step in the SearchPlan:
1. Use the \`searchInstruction\` as your primary guide
2. Look for data matching the \`description\`
3. Format the result according to \`validationType\`
4. If \`isRequired\` is true, try harder to find something
5. Use \`examples\` and \`pattern\` if provided for guidance
6. Apply \`errorRecoveryStrategy\` if extraction fails
7. Respect \`confidenceThreshold\` for quality control

## VALIDATION TYPES GUIDE

- **string**: Plain text, trim whitespace
- **email**: Valid email address format
- **number**: Numeric value (int or float)
- **iso_date**: Date in YYYY-MM-DD format
- **string_array**: Array of strings ["item1", "item2"]
- **boolean**: true or false
- **url**: Valid URL format
- **phone**: Phone number (any reasonable format)
- **json_object**: Valid JSON object

## EXTRACTION RULES

1. **BE PRECISE**: Extract exactly what the searchInstruction asks for
2. **FOLLOW TYPES**: Convert values to the correct validationType
3. **HANDLE MISSING**: If data isn't found:
   - Required fields: Use defaultValue or apply errorRecoveryStrategy
   - Optional fields: Use null or omit
4. **QUALITY NOTES**: Add brief confidence/quality notes for each field
5. **NO HALLUCINATION**: Only extract data that actually exists in the input

## ERROR RECOVERY PROCEDURES

1. **FIELD NOT FOUND**
   - Check alternative locations mentioned in searchInstruction
   - Look for similar patterns nearby
   - Use defaultValue if provided
   - Note the issue in errorRecoveryActions

2. **AMBIGUOUS DATA**
   - Choose the most likely match based on context
   - Note ambiguity in extractionNotes
   - Apply confidence score appropriately

3. **WRONG FORMAT**
   - Attempt to convert/clean the data
   - Use approximate matching if allowed
   - Document the transformation applied

4. **COMPLEX EXTRACTION FAILURE**
   - If multiple fields fail, check if input format is different than expected
   - Apply fallbackStrategies from the SearchPlan
   - Provide detailed error information

## 95% ACCURACY TECHNIQUES

1. **PATTERN MATCHING**
   - Use provided regex patterns first
   - Fall back to fuzzy matching if needed
   - Consider context and proximity

2. **VALIDATION**
   - Verify extracted data matches validationType
   - Cross-reference with examples if provided
   - Check for common data quality issues

3. **CONFIDENCE SCORING**
   - Rate each extraction based on:
     * Exact match vs approximate
     * Clear pattern vs ambiguous location
     * Clean data vs required transformation

## CONTEXTUAL ERROR MESSAGES

When extraction fails or confidence is low, provide helpful context:
- What was searched for
- Where it was expected
- What was found instead
- Suggested fixes for the user

## CRITICAL: RESPONSE FORMAT
- Respond with ONLY the JSON object
- No explanations, no markdown formatting
- Ensure valid JSON syntax
- Include all target keys from the SearchPlan
- Provide comprehensive extraction metrics

Example response:
\`\`\`json
{
  "extractedData": {
    "customerName": "John Doe",
    "email": "john@example.com",
    "orderTotal": 99.99,
    "orderDate": "2024-01-15"
  },
  "extractionNotes": {
    "customerName": "clearly identified after 'Customer:'",
    "email": "found in contact section",
    "orderTotal": "extracted from total line",
    "orderDate": "converted from 'Jan 15, 2024' format"
  },
  "extractionMetrics": {
    "successfulExtractions": 4,
    "failedExtractions": 0,
    "partialExtractions": 0,
    "confidenceScores": {
      "customerName": 0.98,
      "email": 0.95,
      "orderTotal": 0.99,
      "orderDate": 0.90
    }
  },
  "errorRecoveryActions": []
}
\`\`\`

RESPOND WITH ONLY THE JSON - NO OTHER TEXT.`;

      console.log('🎯 Calling Extractor with structured output...');
      const extractorGenerationResult = await extractorModel.generateContent(extractorPrompt);
      const extractorResponse = extractorGenerationResult.response.text();
      
      let extractorResult;
      try {
        extractorResult = JSON.parse(extractorResponse);
        console.log('✅ Extractor structured output:', JSON.stringify(extractorResult, null, 2));
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

      // Calculate overall confidence from extractor metrics
      const overallConfidence = extractorResult.extractionMetrics?.confidenceScores ? 
        Object.values(extractorResult.extractionMetrics.confidenceScores as Record<string, number>)
          .reduce((sum, score) => sum + score, 0) / 
        Object.keys(extractorResult.extractionMetrics.confidenceScores).length : 
        (searchPlan.architectConfidence || 0.85);

      // Return successful response with enhanced metrics
      res.json({
        success: true,
        parsedData: extractorResult.extractedData,
        metadata: {
          architectPlan: searchPlan,
          confidence: overallConfidence,
          extractionNotes: extractorResult.extractionNotes,
          extractionMetrics: extractorResult.extractionMetrics,
          errorRecoveryActions: extractorResult.errorRecoveryActions,
          tokensUsed: tokensUsed,
          processingTimeMs: processingTime,
          requestId: requestId,
          timestamp: new Date().toISOString(),
          version: '2.1.0',
          features: ['sophisticated-prompts', 'error-recovery', '95-accuracy', 'ema-compliance'],
          userTier: (req as any).userTier || 'anonymous',
          billing: (req as any).userTier === 'anonymous' ? 'trial_usage' : 'api_key_usage',
          userId: (req as any).userId || null
        }
      });

    } catch (error: any) {
      console.error('❌ Parse error:', error);
      
      const processingTime = Date.now() - startTime;
      const apiKey = geminiApiKey.value();
      
      // Generate contextual error message using LLM
      const contextualError = await generateContextualErrorResponse(
        error,
        req.body,
        searchPlan,
        apiKey
      );
      
      // Determine appropriate status code
      let statusCode = 422; // Unprocessable Entity for parsing issues
      if (error.message?.includes('Usage limit') || error.message?.includes('Rate limit')) {
        statusCode = 429;
      } else if (error.message?.includes('Invalid API key') || error.message?.includes('Authentication')) {
        statusCode = 401;
      } else if (error.message?.includes('INVALID_INPUT') || error.message?.includes('INVALID_SCHEMA')) {
        statusCode = 400;
      }
      
      // Enhanced error handling with recovery suggestions
      res.status(statusCode).json({
        success: false,
        error: {
          code: error.code || 'PARSE_FAILED',
          message: contextualError, // User-friendly LLM-generated message
          requestId: `req_${Date.now()}`,
          stage: error.stage || 'processing'
        },
        recovery: {
          suggestions: [
            {
              type: 'schema_simplification',
              description: 'Try with fewer fields for better accuracy',
              confidence: 0.8
            },
            {
              type: 'data_cleaning',
              description: 'Clean your input data: remove special characters, normalize spacing',
              confidence: 0.7
            },
            {
              type: 'retry_strategy',
              description: 'Wait a moment and try again with the same request',
              confidence: 0.6
            }
          ],
          documentation: 'https://docs.parserator.com/troubleshooting',
          supportContact: 'For complex parsing needs, contact support@parserator.com'
        },
        metadata: {
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString(),
          version: '2.1.0',
          userTier: (req as any).userTier || 'anonymous'
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