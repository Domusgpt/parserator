/**
 * Architect Service for Parserator
 * Implements the first stage of the Architect-Extractor pattern
 * Creates detailed SearchPlans from output schemas and data samples
 */

import { 
  ISearchPlan, 
  IArchitectResult, 
  ISearchStep, 
  ValidationTypeEnum 
} from '../interfaces/search-plan.interface';
import { GeminiService, ILLMOptions, LLMError } from './llm.service';
import { generateOperationId } from '../utils/operation-id.util';
import { cleanLLMJsonString } from '../utils/llm-response.util';

/**
 * Configuration for Architect operations
 */
export interface IArchitectConfig {
  /** Maximum length of data sample to analyze */
  maxSampleLength: number;
  
  /** Confidence threshold for accepting generated plans */
  minConfidenceThreshold: number;
  
  /** Maximum number of fields to extract */
  maxFieldCount: number;
  
  /** Version of the architect prompt */
  promptVersion: string;
  
  /** Timeout for architect operations */
  timeoutMs: number;
}

/**
 * Error thrown when Architect service encounters issues
 */
export class ArchitectError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ArchitectError';
  }
}

/**
 * The Architect: First stage of the two-stage parsing process
 * Analyzes output schema and data sample to create a detailed SearchPlan
 */
export class ArchitectService {
  private config: IArchitectConfig;
  private logger: Console;

  // Default configuration optimized for planning efficiency
  private static readonly DEFAULT_CONFIG: IArchitectConfig = {
    maxSampleLength: 1000,
    minConfidenceThreshold: 0.7,
    maxFieldCount: 50,
    promptVersion: 'v2.1',
    timeoutMs: 20000
  };

  constructor(
    private geminiService: GeminiService,
    config?: Partial<IArchitectConfig>,
    logger?: Console
  ) {
    this.config = { ...ArchitectService.DEFAULT_CONFIG, ...config };
    this.logger = logger || console;

    this.logger.info('ArchitectService initialized', {
      promptVersion: this.config.promptVersion,
      maxSampleLength: this.config.maxSampleLength,
      service: 'architect'
    });
  }

  /**
   * Generate a SearchPlan from output schema and data sample
   */
  async generateSearchPlan(
    outputSchema: Record<string, any>,
    dataSample: string,
    userInstructions?: string,
    requestId?: string
  ): Promise<IArchitectResult> {
    const startTime = Date.now();
    const operationId = requestId || generateOperationId('arch');

    this.logger.info('Starting SearchPlan generation', {
      requestId: operationId,
      schemaFields: Object.keys(outputSchema).length,
      sampleLength: dataSample.length,
      hasInstructions: !!userInstructions,
      operation: 'generateSearchPlan'
    });

    try {
      // Validate inputs, create optimized sample, and build prompt
      const { prompt, optimizedSampleLength } = this._buildAndValidatePrompt(
        outputSchema,
        dataSample,
        userInstructions
      );

      // Call LLM and parse response
      const { searchPlan, llmResponse } = await this._callLLMAndParseResponse(
        prompt,
        operationId,
        optimizedSampleLength // Pass this to potentially use in metadata later
      );

      // Validate search plan and finalize the result
      const result = this._validateAndFinalizeSearchPlan(
        searchPlan,
        outputSchema,
        llmResponse,
        startTime,
        operationId
      );

      return result;

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      
      this.logger.error('SearchPlan generation failed', {
        requestId: operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs,
        operation: 'generateSearchPlan'
      });

      let errorCode = 'UNEXPECTED_ARCHITECT_ERROR';
      let errorDetails = { requestId: operationId, originalError: error };

      if (error instanceof ArchitectError) {
        errorCode = error.code;
        errorDetails = { ...errorDetails, ...error.details };
      } else if (error instanceof LLMError) {
        errorCode = 'LLM_ERROR';
        // You might want to add specific LLM error details if available from LLMError
      }

      // For known errors (ArchitectError, LLMError), return a structured error response
      if (error instanceof ArchitectError || error instanceof LLMError) {
        return {
          searchPlan: this.createEmptySearchPlan(),
          tokensUsed: 0, // Consider if any tokens were used before the error
          processingTimeMs,
          model: 'gemini-1.5-flash', // Or a default/error model
          success: false,
          error: {
            code: errorCode,
            message: error.message,
            details: errorDetails
          }
        };
      }

      // For truly unexpected errors, re-throw a generic ArchitectError
      // This preserves the original behavior of throwing for unexpected issues.
      throw new ArchitectError(
        `Unexpected error during SearchPlan generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode, // This will be 'UNEXPECTED_ARCHITECT_ERROR'
        errorDetails
      );
    }
  }

  /**
   * Validates inputs, creates an optimized sample, and builds the prompt.
   */
  private _buildAndValidatePrompt(
    outputSchema: Record<string, any>,
    dataSample: string,
    userInstructions?: string
  ): { prompt: string; optimizedSampleLength: number } {
    this.validateInputs(outputSchema, dataSample);
    const optimizedSample = this.createOptimizedSample(dataSample);
    const prompt = this.buildArchitectPrompt(
      outputSchema,
      optimizedSample,
      userInstructions
    );
    return { prompt, optimizedSampleLength: optimizedSample.length };
  }

  /**
   * Calls the LLM and parses the initial response.
   */
  private async _callLLMAndParseResponse(
    prompt: string,
    operationId: string,
    optimizedSampleLength: number
  ): Promise<{ searchPlan: ISearchPlan; llmResponse: any }> {
    const llmOptions: ILLMOptions = {
      maxTokens: 2048,
      temperature: 0.1, // Low temperature for consistent planning
      timeoutMs: this.config.timeoutMs,
      requestId: operationId,
      model: 'gemini-1.5-flash'
    };

    const llmResponse = await this.geminiService.callGemini(prompt, llmOptions);
    const searchPlan = this.parseArchitectResponse(llmResponse.content, operationId, optimizedSampleLength);
    return { searchPlan, llmResponse };
  }

  /**
   * Validates the search plan and finalizes the architect result.
   */
  private _validateAndFinalizeSearchPlan(
    searchPlan: ISearchPlan,
    outputSchema: Record<string, any>,
    llmResponse: any, // Consider typing this more strictly if GeminiService response is well-defined
    startTime: number,
    operationId: string
  ): IArchitectResult {
    this.validateSearchPlan(searchPlan, outputSchema);

    const processingTimeMs = Date.now() - startTime;
    const result: IArchitectResult = {
      searchPlan,
      tokensUsed: llmResponse.tokensUsed,
      processingTimeMs,
      model: llmResponse.model,
      success: true
    };

    this.logger.info('SearchPlan generation completed', {
      requestId: operationId,
      stepsGenerated: searchPlan.steps.length,
      confidence: searchPlan.architectConfidence,
      complexity: searchPlan.estimatedComplexity,
      tokensUsed: llmResponse.tokensUsed,
      processingTimeMs,
      operation: 'generateSearchPlan'
    });

    return result;
  }


  /**
   * Build the optimized prompt for the Architect LLM
   * TODO: Consider externalizing or further templating if this prompt grows much larger or becomes more dynamic.
   */
  private buildArchitectPrompt(
    outputSchema: Record<string, any>,
    dataSample: string,
    userInstructions?: string
  ): string {
    const schemaJson = JSON.stringify(outputSchema, null, 2);
    const fieldCount = Object.keys(outputSchema).length;

    return `You are the Architect in a two-stage data parsing system. Your job is to analyze the user's desired output schema and a sample of their input data, then create a detailed SearchPlan for the Extractor to follow.

## YOUR TASK
Create a JSON SearchPlan that tells the Extractor exactly how to find each piece of data in the full input.

## OUTPUT SCHEMA (what the user wants)
\`\`\`json
${schemaJson}
\`\`\`

## DATA SAMPLE (representative portion of input)
\`\`\`
${dataSample}
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
      "pattern": "optional regex pattern"
    }
  ],
  "totalSteps": ${fieldCount},
  "estimatedComplexity": "low|medium|high",
  "architectConfidence": 0.95,
  "estimatedExtractorTokens": 1500,
  "extractorInstructions": "Any special guidance for the Extractor",
  "metadata": {
    "createdAt": "${new Date().toISOString()}",
    "architectVersion": "${this.config.promptVersion}",
      "sampleLength": ${dataSample.length}, // This will be updated by the actual sample length in the final plan
    "userInstructions": "${userInstructions || ''}"
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

Remember: The Extractor will follow your plan exactly. Make your instructions clear, specific, and actionable. Your searchInstructions are the key to accurate extraction.

RESPOND WITH ONLY THE JSON - NO EXPLANATIONS OR MARKDOWN FORMATTING.`;
  }

  /**
   * Parse and validate the Architect's JSON response
   */
  private parseArchitectResponse(content: string, requestId: string, optimizedSampleLength: number): ISearchPlan {
    try {
      const cleanContent = cleanLLMJsonString(content);
      const parsed = JSON.parse(cleanContent);

      // Validate required fields
      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        throw new ArchitectError(
          'Invalid response: missing or invalid steps array',
          'INVALID_RESPONSE_FORMAT',
          { requestId, responsePreview: content.substring(0, 200) }
        );
      }

      if (typeof parsed.architectConfidence !== 'number') {
        throw new ArchitectError(
          'Invalid response: missing or invalid architectConfidence',
          'INVALID_RESPONSE_FORMAT',
          { requestId, responsePreview: content.substring(0, 200) }
        );
      }

      // Validate each step
      for (let i = 0; i < parsed.steps.length; i++) {
        this.validateSearchStep(parsed.steps[i], i, requestId);
      }

      // Set defaults for optional fields
      const searchPlan: ISearchPlan = {
        steps: parsed.steps,
        totalSteps: parsed.totalSteps || parsed.steps.length,
        estimatedComplexity: parsed.estimatedComplexity || 'medium',
        architectConfidence: parsed.architectConfidence,
        estimatedExtractorTokens: parsed.estimatedExtractorTokens || 1000,
        extractorInstructions: parsed.extractorInstructions,
        metadata: {
          createdAt: parsed.metadata?.createdAt || new Date().toISOString(),
          architectVersion: parsed.metadata?.architectVersion || this.config.promptVersion,
          sampleLength: optimizedSampleLength, // Use the actual optimized sample length
          userInstructions: parsed.metadata?.userInstructions
        }
      };

      return searchPlan;

    } catch (error) {
      if (error instanceof ArchitectError) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw new ArchitectError(
          'Invalid JSON response from Architect',
          'JSON_PARSE_ERROR',
          { 
            requestId, 
            responsePreview: content.substring(0, 200),
            parseError: error.message 
          }
        );
      }

      throw new ArchitectError(
        `Failed to parse Architect response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RESPONSE_PARSE_ERROR',
        { requestId, responsePreview: content.substring(0, 200) }
      );
    }
  }

  /**
   * Validate a single SearchStep
   */
  private validateSearchStep(step: any, index: number, requestId: string): void {
    const requiredFields = ['targetKey', 'description', 'searchInstruction', 'validationType', 'isRequired'];
    
    for (const field of requiredFields) {
      if (!(field in step) || step[field] === null || step[field] === undefined) {
        throw new ArchitectError(
          `Step ${index}: missing required field '${field}'`,
          'INVALID_SEARCH_STEP',
          { requestId, stepIndex: index, missingField: field }
        );
      }
    }

    // Validate field types
    if (typeof step.targetKey !== 'string' || step.targetKey.trim().length === 0) {
      throw new ArchitectError(
        `Step ${index}: targetKey must be a non-empty string`,
        'INVALID_SEARCH_STEP',
        { requestId, stepIndex: index, field: 'targetKey' }
      );
    }

    if (typeof step.searchInstruction !== 'string' || step.searchInstruction.trim().length < 10) {
      throw new ArchitectError(
        `Step ${index}: searchInstruction must be at least 10 characters`,
        'INVALID_SEARCH_STEP',
        { requestId, stepIndex: index, field: 'searchInstruction' }
      );
    }

    const validTypes: ValidationTypeEnum[] = [
      'string', 'email', 'number', 'iso_date', 'string_array', 
      'boolean', 'url', 'phone', 'json_object'
    ];
    
    if (!validTypes.includes(step.validationType)) {
      throw new ArchitectError(
        `Step ${index}: invalid validationType '${step.validationType}'`,
        'INVALID_SEARCH_STEP',
        { requestId, stepIndex: index, field: 'validationType', validTypes }
      );
    }

    if (typeof step.isRequired !== 'boolean') {
      throw new ArchitectError(
        `Step ${index}: isRequired must be a boolean`,
        'INVALID_SEARCH_STEP',
        { requestId, stepIndex: index, field: 'isRequired' }
      );
    }
  }

  /**
   * Validate the complete SearchPlan against the output schema
   */
  private validateSearchPlan(searchPlan: ISearchPlan, outputSchema: Record<string, any>): void {
    // Check confidence threshold
    if (searchPlan.architectConfidence < this.config.minConfidenceThreshold) {
      throw new ArchitectError(
        `SearchPlan confidence ${searchPlan.architectConfidence} below threshold ${this.config.minConfidenceThreshold}`,
        'LOW_CONFIDENCE',
        { 
          confidence: searchPlan.architectConfidence, 
          threshold: this.config.minConfidenceThreshold 
        }
      );
    }

    // Check field count limits
    if (searchPlan.steps.length > this.config.maxFieldCount) {
      throw new ArchitectError(
        `SearchPlan has ${searchPlan.steps.length} steps, exceeding limit of ${this.config.maxFieldCount}`,
        'TOO_MANY_FIELDS',
        { stepCount: searchPlan.steps.length, limit: this.config.maxFieldCount }
      );
    }

    // Verify all schema fields are covered
    const schemaKeys = Object.keys(outputSchema);
    const planKeys = searchPlan.steps.map(step => step.targetKey);
    const missingKeys = schemaKeys.filter(key => !planKeys.includes(key));

    if (missingKeys.length > 0) {
      throw new ArchitectError(
        `SearchPlan missing steps for schema fields: ${missingKeys.join(', ')}`,
        'MISSING_SCHEMA_FIELDS',
        { missingFields: missingKeys, schemaFields: schemaKeys, planFields: planKeys }
      );
    }

    // Check for duplicate target keys
    const duplicateKeys = planKeys.filter((key, index) => planKeys.indexOf(key) !== index);
    if (duplicateKeys.length > 0) {
      throw new ArchitectError(
        `SearchPlan has duplicate target keys: ${duplicateKeys.join(', ')}`,
        'DUPLICATE_TARGET_KEYS',
        { duplicateKeys }
      );
    }
  }

  /**
   * Create an optimized sample from the input data
   */
  private createOptimizedSample(inputData: string): string {
    if (inputData.length <= this.config.maxSampleLength) {
      return inputData;
    }

    // Try to get a representative sample
    const sample = inputData.substring(0, this.config.maxSampleLength);
    
    // Try to break at a natural boundary (sentence, line, etc.)
    const lastPeriod = sample.lastIndexOf('.');
    const lastNewline = sample.lastIndexOf('\n');
    const lastSpace = sample.lastIndexOf(' ');
    
    const breakPoint = Math.max(lastPeriod, lastNewline, lastSpace);
    
    if (breakPoint > this.config.maxSampleLength * 0.7) {
      return sample.substring(0, breakPoint);
    }
    
    return sample;
  }

  /**
   * Validate input parameters
   */
  private validateInputs(outputSchema: Record<string, any>, dataSample: string): void {
    if (!outputSchema || typeof outputSchema !== 'object') {
      throw new ArchitectError(
        'Output schema must be a non-null object',
        'INVALID_OUTPUT_SCHEMA'
      );
    }

    const schemaKeys = Object.keys(outputSchema);
    if (schemaKeys.length === 0) {
      throw new ArchitectError(
        'Output schema cannot be empty',
        'EMPTY_OUTPUT_SCHEMA'
      );
    }

    if (schemaKeys.length > this.config.maxFieldCount) {
      throw new ArchitectError(
        `Output schema has ${schemaKeys.length} fields, exceeding limit of ${this.config.maxFieldCount}`,
        'SCHEMA_TOO_LARGE',
        { fieldCount: schemaKeys.length, limit: this.config.maxFieldCount }
      );
    }

    if (!dataSample || typeof dataSample !== 'string') {
      throw new ArchitectError(
        'Data sample must be a non-empty string',
        'INVALID_DATA_SAMPLE'
      );
    }

    if (dataSample.trim().length === 0) {
      throw new ArchitectError(
        'Data sample cannot be empty or only whitespace',
        'EMPTY_DATA_SAMPLE'
      );
    }
  }

  /**
   * Create an empty SearchPlan for error cases
   */
  private createEmptySearchPlan(): ISearchPlan {
    return {
      steps: [],
      totalSteps: 0,
      estimatedComplexity: 'high',
      architectConfidence: 0.0,
      estimatedExtractorTokens: 0,
      metadata: {
        createdAt: new Date().toISOString(),
        architectVersion: this.config.promptVersion,
        sampleLength: 0
      }
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): IArchitectConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IArchitectConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('ArchitectService configuration updated', {
      newConfig,
      service: 'architect'
    });
  }
}