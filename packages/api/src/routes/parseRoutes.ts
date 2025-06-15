/**
 * Parse Route Handler
 * Main parsing endpoint with structured outputs
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { defineSecret } from 'firebase-functions/params';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

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

export const parseHandler = async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Validate input
    const { inputData, outputSchema } = req.body;
    
    if (!inputData || !outputSchema) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'inputData and outputSchema are required'
        }
      });
    }
    
    // Get Gemini API key
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'Gemini API key not configured'
        }
      });
    }
    
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

    const sample = inputData.substring(0, 1000); // First 1KB for planning
    const architectPrompt = `You are the Architect in a two-stage parsing system. Create a detailed SearchPlan for extracting data.

SAMPLE DATA:
${sample}

TARGET SCHEMA:
${JSON.stringify(outputSchema, null, 2)}

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
      console.log('✅ Architect structured output success');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('❌ Architect structured output failed:', errorMessage);
      throw new Error(`Architect failed to create valid SearchPlan: ${errorMessage}`);
    }

    // STAGE 2: EXTRACTOR with dynamic structured output
    const extractorSchema = createExtractorSchema(outputSchema);
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
${inputData}

INSTRUCTIONS:
- Follow the SearchPlan exactly as specified by the Architect
- Extract data for each field using the provided instructions and patterns
- If a field cannot be found, use null
- Be precise and accurate
- Return data in the exact format specified by the target schema

TARGET OUTPUT FORMAT:
${JSON.stringify(outputSchema, null, 2)}

Execute the plan and return the extracted data.`;

    console.log('🎯 Calling Extractor with structured output...');
    const extractorResult = await extractorModel.generateContent(extractorPrompt);
    const extractorResponse = extractorResult.response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(extractorResponse);
      console.log('✅ Extractor structured output success');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('❌ Extractor structured output failed:', errorMessage);
      throw new Error(`Extractor failed to return valid JSON: ${errorMessage}`);
    }

    const processingTime = Date.now() - startTime;
    const tokensUsed = Math.floor((architectPrompt.length + extractorPrompt.length) / 4);
    const requestId = `req_${Date.now()}`;

    // Return successful response (usage tracking happens in middleware)
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
        version: '2.0.0',
        features: ['structured-outputs', 'express-architecture', 'api-key-auth'],
        userTier: req.isAnonymous ? 'anonymous' : req.user!.tier,
        billing: req.isAnonymous ? 'trial_usage' : 'api_key_usage',
        userId: req.isAnonymous ? null : req.user!.id
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
        version: '2.0.0'
      }
    });
  }
};