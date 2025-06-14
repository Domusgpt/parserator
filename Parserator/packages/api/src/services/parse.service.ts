/**
 * Parse Service for Parserator
 * Main orchestration service that coordinates the two-stage Architect-Extractor workflow
 * Provides the primary parsing interface for the SaaS API
 */

import { 
  IParseResult, 
  ISearchPlan,
  IArchitectResult,
  IExtractorResult
} from '../interfaces/search-plan.interface';
import { GeminiService } from './llm.service';
import { ArchitectService, ArchitectError } from './architect.service';
import { ExtractorService, ExtractorError } from './extractor.service';
import { generateOperationId } from '../utils/operation-id.util';

/**
 * Configuration for Parse operations
 */
export interface IParseConfig {
  /** Maximum input data length */
  maxInputLength: number;
  
  /** Maximum output schema complexity */
  maxSchemaFields: number;
  
  /** Overall timeout for parsing operations */
  timeoutMs: number;
  
  /** Whether to enable fallback strategies */
  enableFallbacks: boolean;
  
  /** Sample size for Architect analysis */
  architectSampleSize: number;
  
  /** Minimum confidence threshold for accepting results */
  minOverallConfidence: number;
}

/**
 * Input parameters for parsing operations
 */
export interface IParseRequest {
  /** Raw unstructured input data */
  inputData: string;
  
  /** Desired output schema structure */
  outputSchema: Record<string, any>;
  
  /** Optional user instructions for parsing */
  instructions?: string;
  
  /** Request ID for tracking */
  requestId?: string;
  
  /** User ID for billing/analytics */
  userId?: string;
}

/**
 * Error thrown when Parse service encounters issues
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public code: string,
    public stage: 'validation' | 'architect' | 'extractor' | 'orchestration',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Main parsing service that orchestrates the two-stage workflow
 * Provides intelligent data parsing with cost optimization and high accuracy
 */
export class ParseService {
  private config: IParseConfig;
  private logger: Console;
  private architectService: ArchitectService;
  private extractorService: ExtractorService;

  // Default configuration optimized for production use
  private static readonly DEFAULT_CONFIG: IParseConfig = {
    maxInputLength: 100000, // 100KB limit
    maxSchemaFields: 50,
    timeoutMs: 60000, // 1 minute total timeout
    enableFallbacks: true,
    architectSampleSize: 1000,
    minOverallConfidence: 0.5
  };

  constructor(
    private geminiService: GeminiService,
    config?: Partial<IParseConfig>,
    logger?: Console
  ) {
    this.config = { ...ParseService.DEFAULT_CONFIG, ...config };
    this.logger = logger || console;

    // Initialize sub-services
    this.architectService = new ArchitectService(
      this.geminiService,
      {
        maxSampleLength: this.config.architectSampleSize,
        maxFieldCount: this.config.maxSchemaFields,
        timeoutMs: Math.floor(this.config.timeoutMs * 0.4) // 40% of total time
      },
      this.logger
    );

    this.extractorService = new ExtractorService(
      this.geminiService,
      {
        maxInputLength: this.config.maxInputLength,
        timeoutMs: Math.floor(this.config.timeoutMs * 0.6) // 60% of total time
      },
      this.logger
    );

    this.logger.info('ParseService initialized', {
      maxInputLength: this.config.maxInputLength,
      maxSchemaFields: this.config.maxSchemaFields,
      architectSampleSize: this.config.architectSampleSize,
      service: 'parse'
    });
  }

  /**
   * Main parsing method that orchestrates the two-stage workflow
   */
  async parse(request: IParseRequest): Promise<IParseResult> {
    const startTime = Date.now();
    const operationId = request.requestId || generateOperationId('parse');

    try {
      this._validateAndInitializeParse(request, operationId);

      // Stage 1: Generate SearchPlan with the Architect
      const architectResult = await this._executeArchitectStageInternal(
        request,
        operationId,
        startTime
      );

      if (!architectResult.success) {
        // If Architect stage failed, architectResult is already a complete IParseResult
        return architectResult as IParseResult;
      }

      // Stage 2: Execute SearchPlan with the Extractor
      const extractorResult = await this._executeExtractorStageInternal(
        request.inputData,
        architectResult as IArchitectResult, // We know it's successful here
        operationId,
        startTime
      );

      if (!extractorResult.success) {
        // If Extractor stage failed, extractorResult is already a complete IParseResult
        return extractorResult as IParseResult;
      }

      // Combine results and validate overall quality
      const result = this._finalizeParseResult(
        architectResult as IArchitectResult, // We know it's successful here
        extractorResult as IExtractorResult, // We know it's successful here
        startTime,
        operationId,
        request.userId
      );

      this.logger.info('Parse operation completed successfully', {
        requestId: operationId,
        userId: request.userId,
        confidence: result.metadata.confidence,
        tokensUsed: result.metadata.tokensUsed,
        processingTimeMs: result.metadata.processingTimeMs,
        fieldsExtracted: Object.keys(result.parsedData).length,
        operation: 'parse'
      });

      return result;

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      
      this.logger.error('Parse operation failed', {
        requestId: operationId,
        userId: request.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs,
        operation: 'parse'
      });

      if (error instanceof ParseError) {
        return this.createFailureResult(
          {
            code: error.code,
            message: error.message,
            details: error.details
          },
          error.stage,
          operationId,
          processingTimeMs
        );
      }

      // Unexpected error
      return this.createFailureResult(
        {
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error during parsing: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { originalError: error }
        },
        'orchestration',
        operationId,
        processingTimeMs
      );
    }
  }

  /**
   * Executes the Architect stage and handles its errors.
   * Returns either a successful IArchitectResult or a failed IParseResult.
   */
  private async _executeArchitectStageInternal(
    request: IParseRequest,
    operationId: string,
    startTime: number
  ): Promise<IArchitectResult | IParseResult> {
    const architectResult = await this.executeArchitectStage(
      request.outputSchema,
      request.inputData,
      request.instructions,
      operationId
    );

    if (!architectResult.success) {
      return this.createFailureResult(
        architectResult.error!,
        'architect',
        operationId,
        Date.now() - startTime,
        architectResult.tokensUsed
      );
    }
    return architectResult;
  }

  /**
   * Executes the Extractor stage and handles its errors.
   * Returns either a successful IExtractorResult or a failed IParseResult.
   */
  private async _executeExtractorStageInternal(
    inputData: string,
    architectResult: IArchitectResult,
    operationId: string,
    startTime: number
  ): Promise<IExtractorResult | IParseResult> {
    const extractorResult = await this.executeExtractorStage(
      inputData,
      architectResult.searchPlan,
      operationId
    );

    if (!extractorResult.success) {
      return this.createFailureResult(
        extractorResult.error!,
        'extractor',
        operationId,
        Date.now() - startTime,
        architectResult.tokensUsed + extractorResult.tokensUsed,
        architectResult.searchPlan
      );
    }
    return extractorResult;
  }

  /**
   * Finalizes the parse result, combining information from Architect and Extractor stages,
   * and applying any fallback logic if necessary.
   */
  private _finalizeParseResult(
    architectResult: IArchitectResult,
    extractorResult: IExtractorResult,
    startTime: number,
    operationId: string,
    userId?: string
  ): IParseResult {
    const result = this.combineResults(
      architectResult,
      extractorResult,
      Date.now() - startTime,
      operationId
    );

    // Apply fallback strategies if confidence is too low
    if (this.config.enableFallbacks && result.metadata.confidence < this.config.minOverallConfidence) {
      this.logger.warn('Low confidence result, applying fallbacks', {
        requestId: operationId,
        confidence: result.metadata.confidence,
        threshold: this.config.minOverallConfidence
      });

      // TODO: Implement a more robust fallback strategy.
      // This could involve:
      // 1. Retrying the Extractor stage with a simplified search plan (e.g., removing low-confidence steps).
      // 2. Retrying the Architect stage with different sampling or instructions.
      // 3. Using a simpler, potentially rule-based, parsing model as a last resort.
      // 4. Returning a specific error or default response indicating low confidence.
      // For now, we proceed with the low-confidence result.
    }
    return result;
  }


  /**
   * Validates the parse request and performs initial logging.
   */
  private _validateAndInitializeParse(request: IParseRequest, operationId: string): void {
    this.logger.info('Starting parse operation', {
      requestId: operationId,
      userId: request.userId,
      inputLength: request.inputData.length,
      schemaFields: Object.keys(request.outputSchema).length,
      hasInstructions: !!request.instructions,
      operation: 'parse'
    });

    // Validate inputs
    this.validateParseRequest(request);
  }

  /**
   * Execute the Architect stage
   */
  private async executeArchitectStage(
    outputSchema: Record<string, any>,
    inputData: string,
    instructions: string | undefined,
    requestId: string
  ): Promise<IArchitectResult> {
    this.logger.info('Executing Architect stage', {
      requestId,
      stage: 'architect',
      operation: 'executeArchitectStage'
    });

    try {
      // Create optimized sample for the Architect
      const dataSample = this.createOptimizedSample(inputData);

      const result = await this.architectService.generateSearchPlan(
        outputSchema,
        dataSample,
        instructions,
        requestId
      );

      this.logger.info('Architect stage completed', {
        requestId,
        success: result.success,
        confidence: result.success ? result.searchPlan.architectConfidence : 0,
        tokensUsed: result.tokensUsed,
        stage: 'architect'
      });

      return result;

    } catch (error) {
      this.logger.error('Architect stage failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stage: 'architect'
      });

      throw error;
    }
  }

  /**
   * Execute the Extractor stage
   */
  private async executeExtractorStage(
    inputData: string,
    searchPlan: ISearchPlan,
    requestId: string
  ): Promise<IExtractorResult> {
    this.logger.info('Executing Extractor stage', {
      requestId,
      stepsToExecute: searchPlan.steps.length,
      planComplexity: searchPlan.estimatedComplexity,
      stage: 'extractor',
      operation: 'executeExtractorStage'
    });

    try {
      const result = await this.extractorService.executeSearchPlan(
        inputData,
        searchPlan,
        requestId
      );

      this.logger.info('Extractor stage completed', {
        requestId,
        success: result.success,
        confidence: result.success ? result.overallConfidence : 0,
        tokensUsed: result.tokensUsed,
        failedFields: result.failedFields.length,
        stage: 'extractor'
      });

      return result;

    } catch (error) {
      this.logger.error('Extractor stage failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stage: 'extractor'
      });

      throw error;
    }
  }

  /**
   * Combine results from both stages into final result
   */
  private combineResults(
    architectResult: IArchitectResult,
    extractorResult: IExtractorResult,
    totalProcessingTimeMs: number,
    requestId: string
  ): IParseResult {
    const totalTokens = architectResult.tokensUsed + extractorResult.tokensUsed;
    
    // Calculate weighted confidence score
    const architectWeight = 0.3;
    const extractorWeight = 0.7;
    const overallConfidence = (
      architectResult.searchPlan.architectConfidence * architectWeight +
      extractorResult.overallConfidence * extractorWeight
    );

    return {
      success: true,
      parsedData: extractorResult.parsedData,
      metadata: {
        architectPlan: architectResult.searchPlan,
        confidence: overallConfidence,
        tokensUsed: totalTokens,
        processingTimeMs: totalProcessingTimeMs,
        architectTokens: architectResult.tokensUsed,
        extractorTokens: extractorResult.tokensUsed,
        stageBreakdown: {
          architect: {
            timeMs: architectResult.processingTimeMs,
            tokens: architectResult.tokensUsed,
            confidence: architectResult.searchPlan.architectConfidence
          },
          extractor: {
            timeMs: extractorResult.processingTimeMs,
            tokens: extractorResult.tokensUsed,
            confidence: extractorResult.overallConfidence
          }
        }
      }
    };
  }

  /**
   * Create a failure result with comprehensive error information
   */
  private createFailureResult(
    error: { code: string; message: string; details?: any },
    stage: 'architect' | 'extractor' | 'validation' | 'orchestration',
    requestId: string,
    processingTimeMs: number,
    tokensUsed: number = 0,
    architectPlan?: ISearchPlan
  ): IParseResult {
    return {
      success: false,
      parsedData: {},
      metadata: {
        architectPlan: architectPlan || {
          steps: [],
          totalSteps: 0,
          estimatedComplexity: 'high',
          architectConfidence: 0.0,
          estimatedExtractorTokens: 0,
          metadata: {
            createdAt: new Date().toISOString(),
            architectVersion: 'unknown',
            sampleLength: 0
          }
        },
        confidence: 0.0,
        tokensUsed,
        processingTimeMs,
        architectTokens: stage === 'architect' ? tokensUsed : 0,
        extractorTokens: stage === 'extractor' ? tokensUsed : 0,
        stageBreakdown: {
          architect: {
            timeMs: stage === 'architect' ? processingTimeMs : 0,
            tokens: stage === 'architect' ? tokensUsed : 0,
            confidence: 0.0
          },
          extractor: {
            timeMs: stage === 'extractor' ? processingTimeMs : 0,
            tokens: stage === 'extractor' ? tokensUsed : 0,
            confidence: 0.0
          }
        }
      },
      error: {
        code: error.code,
        message: error.message,
        stage,
        details: {
          requestId,
          ...error.details
        }
      }
    };
  }

  /**
   * Create an optimized sample from input data for the Architect
   */
  private createOptimizedSample(inputData: string): string {
    if (inputData.length <= this.config.architectSampleSize) {
      return inputData;
    }

    // Try to get a representative sample from the beginning
    const sample = inputData.substring(0, this.config.architectSampleSize);
    
    // Try to break at natural boundaries to avoid cutting words/sentences
    const lastPeriod = sample.lastIndexOf('.');
    const lastNewline = sample.lastIndexOf('\n');
    const lastSpace = sample.lastIndexOf(' ');
    const lastComma = sample.lastIndexOf(',');
    
    // Choose the best breaking point
    const breakPoints = [lastPeriod, lastNewline, lastComma, lastSpace].filter(pos => pos > 0);
    const bestBreakPoint = Math.max(...breakPoints);
    
    // Use the break point if it's not too far from the end (>70% of sample)
    if (bestBreakPoint > this.config.architectSampleSize * 0.7) {
      return sample.substring(0, bestBreakPoint + 1);
    }
    
    return sample;
  }

  /**
   * Validate parse request inputs
   */
  private validateParseRequest(request: IParseRequest): void {
    // Validate input data
    if (!request.inputData || typeof request.inputData !== 'string') {
      throw new ParseError(
        'Input data must be a non-empty string',
        'INVALID_INPUT_DATA',
        'validation'
      );
    }

    if (request.inputData.trim().length === 0) {
      throw new ParseError(
        'Input data cannot be empty or only whitespace',
        'EMPTY_INPUT_DATA',
        'validation'
      );
    }

    if (request.inputData.length > this.config.maxInputLength) {
      throw new ParseError(
        `Input data length ${request.inputData.length} exceeds maximum ${this.config.maxInputLength}`,
        'INPUT_TOO_LARGE',
        'validation',
        { inputLength: request.inputData.length, maxLength: this.config.maxInputLength }
      );
    }

    // Validate output schema
    if (!request.outputSchema || typeof request.outputSchema !== 'object') {
      throw new ParseError(
        'Output schema must be a non-null object',
        'INVALID_OUTPUT_SCHEMA',
        'validation'
      );
    }

    const schemaKeys = Object.keys(request.outputSchema);
    if (schemaKeys.length === 0) {
      throw new ParseError(
        'Output schema cannot be empty',
        'EMPTY_OUTPUT_SCHEMA',
        'validation'
      );
    }

    if (schemaKeys.length > this.config.maxSchemaFields) {
      throw new ParseError(
        `Output schema has ${schemaKeys.length} fields, exceeding limit of ${this.config.maxSchemaFields}`,
        'SCHEMA_TOO_LARGE',
        'validation',
        { fieldCount: schemaKeys.length, limit: this.config.maxSchemaFields }
      );
    }

    // Validate instructions if provided
    if (request.instructions !== undefined && typeof request.instructions !== 'string') {
      throw new ParseError(
        'Instructions must be a string if provided',
        'INVALID_INSTRUCTIONS',
        'validation'
      );
    }
  }

  /**
   * Generate unique operation ID for tracking
   */
  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: string;
  }> {
    try {
      const geminiHealthy = await this.geminiService.testConnection();
      
      return {
        status: geminiHealthy ? 'healthy' : 'unhealthy',
        services: {
          gemini: geminiHealthy,
          architect: true, // Service is operational if initialized
          extractor: true  // Service is operational if initialized
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        status: 'unhealthy',
        services: {
          gemini: false,
          architect: false,
          extractor: false
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): IParseConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IParseConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // TODO: Consider a more centralized configuration management approach
    // if the number of sub-services or configuration complexity grows.
    // This could involve a dedicated configuration service or an event-based
    // update mechanism to propagate changes more effectively.
    // For now, direct updates to sub-services are acceptable.

    // Update sub-service configurations
    this.architectService.updateConfig({
      maxSampleLength: this.config.architectSampleSize,
      maxFieldCount: this.config.maxSchemaFields,
      timeoutMs: Math.floor(this.config.timeoutMs * 0.4)
    });

    this.extractorService.updateConfig({
      maxInputLength: this.config.maxInputLength,
      timeoutMs: Math.floor(this.config.timeoutMs * 0.6)
    });

    this.logger.info('ParseService configuration updated', {
      newConfig,
      service: 'parse'
    });
  }
}