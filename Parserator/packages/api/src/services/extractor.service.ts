/**
 * Extractor Service for Parserator
 * Implements the second stage of the Architect-Extractor pattern
 * Executes SearchPlans to extract structured data from unstructured input
 */

import { 
  ISearchPlan, 
  IExtractorResult, 
  ISearchStep, 
  ValidationTypeEnum 
} from '../interfaces/search-plan.interface';
import { GeminiService, ILLMOptions, LLMError } from './llm.service';
import { generateOperationId } from '../utils/operation-id.util';
import { cleanLLMJsonString } from '../utils/llm-response.util';

/**
 * Configuration for Extractor operations
 */
export interface IExtractorConfig {
  /** Maximum input data length */
  maxInputLength: number;
  
  /** Minimum confidence threshold for accepting results */
  minConfidenceThreshold: number;
  
  /** Timeout for extractor operations */
  timeoutMs: number;
  
  /** Whether to use fallback strategies for failed extractions */
  useFallbacks: boolean;
  
  /** Maximum retries for individual field extraction */
  maxFieldRetries: number;
}

/**
 * Error thrown when Extractor service encounters issues
 */
export class ExtractorError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ExtractorError';
  }
}

/**
 * The Extractor: Second stage of the two-stage parsing process
 * Executes SearchPlans to extract structured data from full input data
 */
export class ExtractorService {
  private config: IExtractorConfig;
  private logger: Console;

  // Default configuration optimized for extraction efficiency
  private static readonly DEFAULT_CONFIG: IExtractorConfig = {
    maxInputLength: 100000, // 100KB limit
    minConfidenceThreshold: 0.5,
    timeoutMs: 25000,
    useFallbacks: true,
    maxFieldRetries: 2
  };

  constructor(
    private geminiService: GeminiService,
    config?: Partial<IExtractorConfig>,
    logger?: Console
  ) {
    this.config = { ...ExtractorService.DEFAULT_CONFIG, ...config };
    this.logger = logger || console;

    this.logger.info('ExtractorService initialized', {
      maxInputLength: this.config.maxInputLength,
      minConfidenceThreshold: this.config.minConfidenceThreshold,
      service: 'extractor'
    });
  }

  /**
   * Execute a SearchPlan to extract structured data
   */
  async executeSearchPlan(
    inputData: string,
    searchPlan: ISearchPlan,
    requestId?: string
  ): Promise<IExtractorResult> {
    const startTime = Date.now();
    const operationId = requestId || generateOperationId('ext');

    this.logger.info('Starting data extraction', {
      requestId: operationId,
      inputLength: inputData.length,
      stepsToExecute: searchPlan.steps.length,
      planComplexity: searchPlan.estimatedComplexity,
      operation: 'executeSearchPlan'
    });

    try {
      // Validate inputs and build prompt
      const prompt = this._buildExtractorPromptInternal(inputData, searchPlan);

      // Call LLM and parse response
      const { extractionResult, llmResponse } = await this._callLLMAndParseExtractorResponse(
        prompt,
        searchPlan,
        operationId
      );

      // Process and finalize the extraction
      const result = this._processAndFinalizeExtraction(
        extractionResult,
        searchPlan,
        llmResponse,
        startTime,
        operationId
      );

      return result;

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      
      this.logger.error('Data extraction failed', {
        requestId: operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs,
        operation: 'executeSearchPlan'
      });

      let errorCode = 'UNEXPECTED_EXTRACTOR_ERROR';
      let errorDetails = { requestId: operationId, originalError: error };

      if (error instanceof ExtractorError) {
        errorCode = error.code;
        errorDetails = { ...errorDetails, ...error.details };
      } else if (error instanceof LLMError) {
        errorCode = 'LLM_ERROR';
        // You might want to add specific LLM error details if available from LLMError
      }

      // For known errors (ExtractorError, LLMError), return a structured error response
      if (error instanceof ExtractorError || error instanceof LLMError) {
        return {
          parsedData: {},
          fieldConfidence: {},
          overallConfidence: 0.0,
          tokensUsed: 0, // Consider if any tokens were used before the error
          processingTimeMs,
          model: 'gemini-1.5-flash', // Or a default/error model
          success: false,
          failedFields: searchPlan.steps.map(step => step.targetKey), // Assume all fields failed
          error: {
            code: errorCode,
            message: error.message,
            details: errorDetails
          }
        };
      }

      // For truly unexpected errors, re-throw a generic ExtractorError
      throw new ExtractorError(
        `Unexpected error during data extraction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode, // This will be 'UNEXPECTED_EXTRACTOR_ERROR'
        errorDetails
      );
    }
  }

  /**
   * Validates inputs and builds the extractor prompt.
   */
  private _buildExtractorPromptInternal(inputData: string, searchPlan: ISearchPlan): string {
    this.validateInputs(inputData, searchPlan);
    return this.buildExtractorPrompt(inputData, searchPlan);
  }

  /**
   * Calls the LLM and parses the extractor response.
   */
  private async _callLLMAndParseExtractorResponse(
    prompt: string,
    searchPlan: ISearchPlan,
    operationId: string
  ): Promise<{ extractionResult: { parsedData: Record<string, any>; extractionNotes?: Record<string, string> }; llmResponse: any }> {
    const llmOptions: ILLMOptions = {
      maxTokens: 3072,
      temperature: 0.0, // Very low temperature for consistent extraction
      timeoutMs: this.config.timeoutMs,
      requestId: operationId,
      model: 'gemini-1.5-flash'
    };

    const llmResponse = await this.geminiService.callGemini(prompt, llmOptions);
    const extractionResult = this.parseExtractorResponse(
      llmResponse.content,
      searchPlan,
      operationId
    );
    return { extractionResult, llmResponse };
  }

  /**
   * Processes the extraction result, validates data, calculates confidence, and finalizes the result.
   */
  private _processAndFinalizeExtraction(
    extractionResult: { parsedData: Record<string, any>; extractionNotes?: Record<string, string> },
    searchPlan: ISearchPlan,
    llmResponse: any, // Consider typing this more strictly
    startTime: number,
    operationId: string
  ): IExtractorResult {
    // Validate extracted data
    const validationResult = this.validateExtractedData(extractionResult.parsedData, searchPlan);
    // TODO: Potentially use validationResult to adjust confidence or mark fields as failed

    // Calculate confidence scores
    const fieldConfidence = this.calculateFieldConfidence(
      extractionResult.parsedData,
      searchPlan,
      extractionResult.extractionNotes || {}
    );

    const overallConfidence = this.calculateOverallConfidence(fieldConfidence, searchPlan);

    // Identify failed fields
    const failedFields = this.identifyFailedFields(extractionResult.parsedData, searchPlan);

    // Calculate processing metrics
    const processingTimeMs = Date.now() - startTime;

    const result: IExtractorResult = {
      parsedData: extractionResult.parsedData,
      fieldConfidence,
      overallConfidence,
      tokensUsed: llmResponse.tokensUsed,
      processingTimeMs,
      model: llmResponse.model,
      success: true,
      failedFields
    };

    this.logger.info('Data extraction completed', {
      requestId: operationId,
      fieldsExtracted: Object.keys(extractionResult.parsedData).length,
      failedFields: failedFields.length,
      overallConfidence,
      tokensUsed: llmResponse.tokensUsed,
      processingTimeMs,
      operation: 'executeSearchPlan'
    });

    return result;
  }


  /**
   * Build the optimized prompt for the Extractor LLM
   * TODO: Consider externalizing or further templating if this prompt grows much larger or becomes more dynamic.
   */
  private buildExtractorPrompt(inputData: string, searchPlan: ISearchPlan): string {
    const stepsJson = JSON.stringify(searchPlan.steps, null, 2);

    return `You are the Extractor in a two-stage data parsing system. The Architect has analyzed the data and created a SearchPlan for you to follow. Your job is to execute this plan precisely and extract the requested data.

## YOUR TASK
Follow the SearchPlan exactly to extract data from the input. Return a JSON object with the extracted values.

## INPUT DATA
\`\`\`
${inputData}
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
  }
}
\`\`\`

## EXTRACTION INSTRUCTIONS

For each step in the SearchPlan:
1. Use the \`searchInstruction\` as your primary guide
2. Look for data matching the \`description\`
3. Format the result according to \`validationType\`
4. If \`isRequired\` is true, try harder to find something
5. Use \`examples\` and \`pattern\` if provided for guidance

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
   - Required fields: Use null or best guess
   - Optional fields: Use null or omit
4. **QUALITY NOTES**: Add brief confidence/quality notes for each field
5. **NO HALLUCINATION**: Only extract data that actually exists in the input

## CRITICAL: RESPONSE FORMAT
- Respond with ONLY the JSON object
- No explanations, no markdown formatting
- Ensure valid JSON syntax
- Include all target keys from the SearchPlan

Example response:
\`\`\`json
{
  "extractedData": {
    "customerName": "John Doe",
    "email": "john@example.com",
    "orderTotal": 99.99
  },
  "extractionNotes": {
    "customerName": "clearly identified after 'Customer:'",
    "email": "found in contact section",
    "orderTotal": "extracted from total line"
  }
}
\`\`\`

RESPOND WITH ONLY THE JSON - NO OTHER TEXT.`;
  }

  /**
   * Parse and validate the Extractor's JSON response
   */
  private parseExtractorResponse(
    content: string, 
    searchPlan: ISearchPlan, 
    requestId: string
  ): { parsedData: Record<string, any>; extractionNotes?: Record<string, string> } {
    try {
      const cleanContent = cleanLLMJsonString(content);
      const parsed = JSON.parse(cleanContent);

      // Validate required structure
      if (!parsed.extractedData || typeof parsed.extractedData !== 'object') {
        throw new ExtractorError(
          'Invalid response: missing or invalid extractedData object',
          'INVALID_RESPONSE_FORMAT',
          { requestId, responsePreview: content.substring(0, 200) }
        );
      }

      // Ensure all target keys are present (with null if not found)
      const parsedData: Record<string, any> = {};
      for (const step of searchPlan.steps) {
        if (step.targetKey in parsed.extractedData) {
          parsedData[step.targetKey] = parsed.extractedData[step.targetKey];
        } else {
          // Use default value or null for missing fields
          parsedData[step.targetKey] = step.defaultValue !== undefined ? step.defaultValue : null;
        }
      }

      return {
        parsedData,
        extractionNotes: parsed.extractionNotes || {}
      };

    } catch (error) {
      if (error instanceof ExtractorError) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw new ExtractorError(
          'Invalid JSON response from Extractor',
          'JSON_PARSE_ERROR',
          { 
            requestId, 
            responsePreview: content.substring(0, 200),
            parseError: error.message 
          }
        );
      }

      throw new ExtractorError(
        `Failed to parse Extractor response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RESPONSE_PARSE_ERROR',
        { requestId, responsePreview: content.substring(0, 200) }
      );
    }
  }

  /**
   * Validate extracted data against expected types
   */
  private validateExtractedData(
    parsedData: Record<string, any>, 
    searchPlan: ISearchPlan
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const step of searchPlan.steps) {
      const value = parsedData[step.targetKey];
      
      // Check required fields
      if (step.isRequired && (value === null || value === undefined || value === '')) {
        errors.push(`Required field '${step.targetKey}' is missing or empty`);
        continue;
      }

      // Skip validation for null/undefined optional fields
      if (value === null || value === undefined) {
        continue;
      }

      // Validate type
      const typeError = this.validateFieldType(value, step.validationType, step.targetKey);
      if (typeError) {
        errors.push(typeError);
      }

      // Validate pattern if provided
      if (step.pattern && typeof value === 'string') {
        try {
          const regex = new RegExp(step.pattern);
          if (!regex.test(value)) {
            errors.push(`Field '${step.targetKey}' does not match pattern: ${step.pattern}`);
          }
        } catch (error) {
          // Invalid regex pattern - log but don't fail
          this.logger.warn('Invalid regex pattern in SearchStep', {
            field: step.targetKey,
            pattern: step.pattern,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a single field against its expected type
   */
  private validateFieldType(value: any, expectedType: ValidationTypeEnum, fieldName: string): string | null {
    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          return `Field '${fieldName}' should be string, got ${typeof value}`;
        }
        break;

      case 'email':
        if (typeof value !== 'string') {
          return `Field '${fieldName}' should be email string, got ${typeof value}`;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return `Field '${fieldName}' is not a valid email format`;
        }
        break;

      case 'number':
        if (typeof value !== 'number' && !(!isNaN(Number(value)))) {
          return `Field '${fieldName}' should be number, got ${typeof value}`;
        }
        break;

      case 'iso_date':
        if (typeof value !== 'string') {
          return `Field '${fieldName}' should be ISO date string, got ${typeof value}`;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return `Field '${fieldName}' is not in ISO date format (YYYY-MM-DD)`;
        }
        break;

      case 'string_array':
        if (!Array.isArray(value)) {
          return `Field '${fieldName}' should be array, got ${typeof value}`;
        }
        if (!value.every(item => typeof item === 'string')) {
          return `Field '${fieldName}' should be array of strings`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return `Field '${fieldName}' should be boolean, got ${typeof value}`;
        }
        break;

      case 'url':
        if (typeof value !== 'string') {
          return `Field '${fieldName}' should be URL string, got ${typeof value}`;
        }
        try {
          new URL(value);
        } catch {
          return `Field '${fieldName}' is not a valid URL format`;
        }
        break;

      case 'phone':
        if (typeof value !== 'string') {
          return `Field '${fieldName}' should be phone string, got ${typeof value}`;
        }
        // Basic phone validation - allow various formats
        if (!/[\d\-\+\(\)\s]{7,}/.test(value)) {
          return `Field '${fieldName}' is not a valid phone format`;
        }
        break;

      case 'json_object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return `Field '${fieldName}' should be object, got ${typeof value}`;
        }
        break;

      default:
        return `Unknown validation type '${expectedType}' for field '${fieldName}'`;
    }

    return null;
  }

  /**
   * Calculate confidence scores for each extracted field
   */
  private calculateFieldConfidence(
    parsedData: Record<string, any>,
    searchPlan: ISearchPlan,
    extractionNotes: Record<string, string>
  ): Record<string, number> {
    const fieldConfidence: Record<string, number> = {};

    for (const step of searchPlan.steps) {
      const value = parsedData[step.targetKey];
      const note = extractionNotes[step.targetKey] || '';

      let confidence = 0.5; // Base confidence

      // Higher confidence for non-null values
      if (value !== null && value !== undefined && value !== '') {
        confidence = 0.8;

        // Boost confidence based on validation type match
        const typeError = this.validateFieldType(value, step.validationType, step.targetKey);
        if (!typeError) {
          confidence += 0.1;
        }

        // Boost confidence for pattern matches
        if (step.pattern && typeof value === 'string') {
          try {
            const regex = new RegExp(step.pattern);
            if (regex.test(value)) {
              confidence += 0.05;
            }
          } catch {
            // Invalid regex - ignore
          }
        }

        // Adjust based on extraction notes
        if (note.toLowerCase().includes('clear') || note.toLowerCase().includes('exact')) {
          confidence += 0.05;
        }
        if (note.toLowerCase().includes('unsure') || note.toLowerCase().includes('guess')) {
          confidence -= 0.2;
        }
      } else {
        // Lower confidence for missing values
        if (step.isRequired) {
          confidence = 0.1; // Very low for missing required fields
        } else {
          confidence = 0.7; // OK for missing optional fields
        }
      }

      // Clamp confidence to valid range
      fieldConfidence[step.targetKey] = Math.max(0.0, Math.min(1.0, confidence));
    }

    return fieldConfidence;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    fieldConfidence: Record<string, number>,
    searchPlan: ISearchPlan
  ): number {
    const confidenceValues = Object.values(fieldConfidence);
    if (confidenceValues.length === 0) return 0.0;

    // Weight required fields more heavily
    let weightedSum = 0;
    let totalWeight = 0;

    for (const step of searchPlan.steps) {
      const confidence = fieldConfidence[step.targetKey] || 0;
      const weight = step.isRequired ? 2.0 : 1.0;
      
      weightedSum += confidence * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0.0;
  }

  /**
   * Identify fields that failed extraction
   */
  private identifyFailedFields(
    parsedData: Record<string, any>,
    searchPlan: ISearchPlan
  ): string[] {
    const failedFields: string[] = [];

    for (const step of searchPlan.steps) {
      const value = parsedData[step.targetKey];
      
      // Consider a field failed if it's required but missing/null/empty
      if (step.isRequired && (value === null || value === undefined || value === '')) {
        failedFields.push(step.targetKey);
      }
    }

    return failedFields;
  }

  /**
   * Validate input parameters
   */
  private validateInputs(inputData: string, searchPlan: ISearchPlan): void {
    if (!inputData || typeof inputData !== 'string') {
      throw new ExtractorError(
        'Input data must be a non-empty string',
        'INVALID_INPUT_DATA'
      );
    }

    if (inputData.trim().length === 0) {
      throw new ExtractorError(
        'Input data cannot be empty or only whitespace',
        'EMPTY_INPUT_DATA'
      );
    }

    if (inputData.length > this.config.maxInputLength) {
      throw new ExtractorError(
        `Input data length ${inputData.length} exceeds maximum ${this.config.maxInputLength}`,
        'INPUT_TOO_LARGE',
        { inputLength: inputData.length, maxLength: this.config.maxInputLength }
      );
    }

    if (!searchPlan || !searchPlan.steps || !Array.isArray(searchPlan.steps)) {
      throw new ExtractorError(
        'SearchPlan must have valid steps array',
        'INVALID_SEARCH_PLAN'
      );
    }

    if (searchPlan.steps.length === 0) {
      throw new ExtractorError(
        'SearchPlan cannot have zero steps',
        'EMPTY_SEARCH_PLAN'
      );
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): IExtractorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IExtractorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('ExtractorService configuration updated', {
      newConfig,
      service: 'extractor'
    });
  }
}