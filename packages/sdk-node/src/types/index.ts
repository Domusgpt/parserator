/**
 * Core TypeScript interfaces for the Parserator Node.js SDK
 * Implements the Architect-Extractor pattern for intelligent data parsing
 */

// Core API Request/Response Types
export interface ParseRequest {
  inputData: string;
  outputSchema: Record<string, any>;
  instructions?: string;
  options?: ParseOptions;
}

export interface ParseOptions {
  timeout?: number;
  retries?: number;
  validateOutput?: boolean;
  includeMetadata?: boolean;
  confidenceThreshold?: number;
}

export interface ParseResponse {
  success: boolean;
  parsedData: Record<string, any>;
  metadata: ParseMetadata;
  error?: ParseError;
}

export interface ParseMetadata {
  architectPlan: SearchPlan;
  confidence: number;
  tokensUsed: number;
  processingTimeMs: number;
  requestId: string;
  timestamp: string;
}

// Architect-Extractor Pattern Types
export interface SearchStep {
  targetKey: string;
  description: string;
  searchInstruction: string;
  validationType: ValidationType;
  isRequired: boolean;
  confidence?: number;
  fallbackValue?: any;
}

export interface SearchPlan {
  steps: SearchStep[];
  strategy: 'sequential' | 'parallel' | 'adaptive';
  confidenceThreshold: number;
  metadata: {
    detectedFormat: string;
    complexity: 'low' | 'medium' | 'high';
    estimatedTokens: number;
  };
}

export type ValidationType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'email'
  | 'phone'
  | 'date'
  | 'iso_date'
  | 'url'
  | 'string_array'
  | 'number_array'
  | 'object'
  | 'custom';

// Error Types
export interface ParseError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  suggestion?: string;
}

export type ErrorCode =
  | 'INVALID_API_KEY'
  | 'INVALID_INPUT'
  | 'INVALID_SCHEMA'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'PARSE_FAILED'
  | 'VALIDATION_FAILED'
  | 'INSUFFICIENT_CONFIDENCE'
  | 'QUOTA_EXCEEDED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

// Client Configuration
export interface ParseratorConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  defaultOptions?: ParseOptions;
  debug?: boolean;
}

// Batch Processing Types
export interface BatchParseRequest {
  items: ParseRequest[];
  options?: BatchOptions;
}

export interface BatchOptions {
  concurrency?: number;
  failFast?: boolean;
  preserveOrder?: boolean;
}

export interface BatchParseResponse {
  results: (ParseResponse | ParseError)[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalTokensUsed: number;
    totalProcessingTimeMs: number;
  };
}

// Schema Management Types
export interface SchemaTemplate {
  name: string;
  description: string;
  schema: Record<string, any>;
  examples: string[];
  tags: string[];
  version: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
  suggestions: string[];
}

export interface SchemaValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

// Utility Types
export interface ProgressCallback {
  (progress: {
    completed: number;
    total: number;
    currentItem?: string;
    estimatedTimeRemaining?: number;
  }): void;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

// Event Types for Advanced Usage
export interface ParseEvent {
  type: 'start' | 'architect_complete' | 'extractor_start' | 'complete' | 'error';
  timestamp: string;
  data: any;
}

export type EventHandler = (event: ParseEvent) => void;

// Template and Preset Types
export interface ParsePreset {
  name: string;
  description: string;
  outputSchema: Record<string, any>;
  instructions: string;
  examples: Array<{
    input: string;
    expectedOutput: Record<string, any>;
  }>;
  options: ParseOptions;
}

// Advanced Configuration
export interface AdvancedConfig {
  architectModel?: string;
  extractorModel?: string;
  customEndpoints?: {
    architect?: string;
    extractor?: string;
  };
  fallbackStrategies?: string[];
  caching?: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
}

// Export all types for easy importing
export * from './validation';
export * from './presets';
